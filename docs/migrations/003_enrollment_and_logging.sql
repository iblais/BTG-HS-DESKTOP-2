-- BTG Platform: Enrollment Schema Fixes & Error Logging
-- Version: 003
-- Date: January 2026
-- Description: Ensure enrollment schema consistency and add error logging

-- ============================================
-- 1. ENSURE ENROLLMENTS TABLE HAS ALL NEEDED COLUMNS
-- ============================================

-- Add is_active column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Add ended_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN ended_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- Add current_week column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'current_week'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN current_week INTEGER DEFAULT 1;
  END IF;
END $$;

-- Add current_day column for new structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'current_day'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN current_day INTEGER DEFAULT 1;
  END IF;
END $$;

-- ============================================
-- 2. ERROR LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL, -- 'enrollment', 'quiz', 'assignment', 'auth', 'general'
  error_code TEXT,
  error_message TEXT NOT NULL,
  error_details JSONB, -- Additional context
  stack_trace TEXT,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at DESC);

-- RLS: Users can create their own error logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create error logs" ON error_logs;
CREATE POLICY "Users can create error logs" ON error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can read error logs" ON error_logs;
CREATE POLICY "Admins can read error logs" ON error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ============================================
-- 3. ENSURE ENROLLMENTS RLS ALLOWS CREATION
-- ============================================

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can create own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON enrollments;

-- Recreate with proper permissions
CREATE POLICY "Users can view own enrollments" ON enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own enrollments" ON enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own enrollments" ON enrollments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 4. ENSURE PROGRAMS TABLE EXISTS AND HAS DATA
-- ============================================

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  weeks_total INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default programs if they don't exist
INSERT INTO programs (id, title, description, target_audience, weeks_total)
VALUES
  ('HS', 'High School Program', 'Financial literacy fundamentals for high school students', 'High School Students (Grades 9-12)', 18),
  ('COLLEGE', 'College Program', 'Advanced financial concepts for college students', 'College Students', 16)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  weeks_total = EXCLUDED.weeks_total;

-- RLS for programs
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read programs" ON programs;
CREATE POLICY "Anyone can read programs" ON programs
  FOR SELECT
  USING (true);

-- ============================================
-- 5. ENSURE USERS TABLE HAS REQUIRED COLUMNS
-- ============================================

-- The users table should already exist from Supabase auth
-- But we need to ensure custom columns exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE users ADD COLUMN display_name TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- 6. FUNCTION TO LOG ERRORS
-- ============================================

CREATE OR REPLACE FUNCTION log_error(
  p_error_type TEXT,
  p_error_message TEXT,
  p_error_code TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL,
  p_stack_trace TEXT DEFAULT NULL,
  p_page_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO error_logs (
    user_id,
    error_type,
    error_code,
    error_message,
    error_details,
    stack_trace,
    page_url
  ) VALUES (
    auth.uid(),
    p_error_type,
    p_error_code,
    p_error_message,
    p_error_details,
    p_stack_trace,
    p_page_url
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNCTION TO CREATE ENROLLMENT SAFELY
-- ============================================

CREATE OR REPLACE FUNCTION create_enrollment_safe(
  p_program_id TEXT,
  p_track_level TEXT DEFAULT 'beginner',
  p_language TEXT DEFAULT 'en'
)
RETURNS TABLE (
  success BOOLEAN,
  enrollment_id UUID,
  error_message TEXT
) AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_enrollment_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Not authenticated'::TEXT;
    RETURN;
  END IF;

  -- Check if program exists
  IF NOT EXISTS (SELECT 1 FROM programs WHERE id = p_program_id) THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid program ID: ' || p_program_id;
    RETURN;
  END IF;

  -- Check for existing active enrollment
  SELECT id INTO v_existing_id
  FROM enrollments
  WHERE user_id = v_user_id AND is_active = TRUE
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Return existing enrollment instead of error
    RETURN QUERY SELECT TRUE, v_existing_id, 'Existing enrollment found'::TEXT;
    RETURN;
  END IF;

  -- Create new enrollment
  INSERT INTO enrollments (
    user_id,
    program_id,
    track_level,
    language,
    is_active,
    current_week,
    current_day
  ) VALUES (
    v_user_id,
    p_program_id,
    p_track_level,
    p_language,
    TRUE,
    1,
    1
  )
  RETURNING id INTO v_enrollment_id;

  RETURN QUERY SELECT TRUE, v_enrollment_id, NULL::TEXT;

EXCEPTION WHEN OTHERS THEN
  -- Log the error
  PERFORM log_error(
    'enrollment',
    SQLERRM,
    SQLSTATE,
    jsonb_build_object(
      'program_id', p_program_id,
      'track_level', p_track_level,
      'language', p_language
    )
  );

  RETURN QUERY SELECT FALSE, NULL::UUID, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
