-- BTG Platform: Complete Schema for Production
-- Version: 006
-- Date: January 2026
-- Description: Adds all missing tables for full functionality

-- ============================================
-- 1. TEACHERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  school_name TEXT,
  district TEXT,

  can_create_classes BOOLEAN DEFAULT TRUE,
  can_grade_assignments BOOLEAN DEFAULT TRUE,
  can_view_analytics BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can read own profile" ON teachers;
CREATE POLICY "Teachers can read own profile" ON teachers
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
CREATE POLICY "Teachers can update own profile" ON teachers
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage teachers" ON teachers;
CREATE POLICY "Admins can manage teachers" ON teachers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ============================================
-- 2. CLASSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  period TEXT,
  program_id TEXT REFERENCES programs(id),
  school_year TEXT,

  google_classroom_id TEXT,
  google_classroom_link TEXT,

  join_code TEXT UNIQUE DEFAULT upper(substring(md5(random()::text) from 1 for 6)),
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_join_code ON classes(join_code);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage own classes" ON classes;
CREATE POLICY "Teachers can manage own classes" ON classes
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Note: "Students can view joined classes" policy is created after class_enrollments table

-- ============================================
-- 3. CLASS ENROLLMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,

  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_enrollments_class ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student ON class_enrollments(student_id);

ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage class enrollments" ON class_enrollments;
CREATE POLICY "Teachers can manage class enrollments" ON class_enrollments
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM classes WHERE id = class_id AND teacher_id = auth.uid())
  );

DROP POLICY IF EXISTS "Students can view own class enrollments" ON class_enrollments;
CREATE POLICY "Students can view own class enrollments" ON class_enrollments
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can join classes" ON class_enrollments;
CREATE POLICY "Students can join classes" ON class_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Now create the classes policy that references class_enrollments
DROP POLICY IF EXISTS "Students can view joined classes" ON classes;
CREATE POLICY "Students can view joined classes" ON classes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_enrollments
      WHERE class_id = classes.id AND student_id = auth.uid()
    )
  );

-- ============================================
-- 4. GRADING RUBRICS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS grading_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  week_number INTEGER,
  program_id TEXT,

  rubric_name TEXT NOT NULL,
  full_credit_criteria TEXT NOT NULL,
  full_credit_example TEXT,
  half_credit_criteria TEXT NOT NULL,
  half_credit_example TEXT,
  no_credit_criteria TEXT NOT NULL,
  no_credit_example TEXT,

  required_concepts TEXT[],

  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grading_rubrics_module ON grading_rubrics(module_id);

ALTER TABLE grading_rubrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read rubrics" ON grading_rubrics;
CREATE POLICY "Anyone can read rubrics" ON grading_rubrics
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage rubrics" ON grading_rubrics;
CREATE POLICY "Admins can manage rubrics" ON grading_rubrics
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ============================================
-- 5. ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  rubric_id UUID REFERENCES grading_rubrics(id) ON DELETE SET NULL,

  -- Student response
  response_text TEXT,
  response_submitted_at TIMESTAMPTZ,

  -- AI Grading
  ai_score TEXT CHECK (ai_score IN ('full', 'half', 'none')),
  ai_feedback TEXT,
  ai_graded_at TIMESTAMPTZ,
  ai_model_used TEXT,
  ai_rubric_version TEXT,
  ai_confidence DECIMAL(3,2),

  -- Teacher Override
  teacher_score TEXT CHECK (teacher_score IN ('full', 'half', 'none')),
  teacher_feedback TEXT,
  teacher_override_at TIMESTAMPTZ,
  teacher_id UUID REFERENCES auth.users(id),

  -- Metadata
  time_spent_seconds INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, module_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_module ON assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_assignments_pending ON assignments(ai_score) WHERE teacher_score IS NULL;

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own assignments" ON assignments;
CREATE POLICY "Users can manage own assignments" ON assignments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view class assignments" ON assignments;
CREATE POLICY "Teachers can view class assignments" ON assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = assignments.user_id
        AND c.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can grade assignments" ON assignments;
CREATE POLICY "Teachers can grade assignments" ON assignments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_enrollments ce
      JOIN classes c ON ce.class_id = c.id
      WHERE ce.student_id = assignments.user_id
        AND c.teacher_id = auth.uid()
    )
  );

-- ============================================
-- 6. USER ROLES TABLE (for role-based auth)
-- ============================================

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
CREATE POLICY "Users can read own role" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ============================================
-- 7. USER PREFERENCES (language, etc)
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es')),
  theme TEXT DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 8. WEEK UNLOCKS (for progression tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS week_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,

  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  unlock_reason TEXT DEFAULT 'quiz_passed', -- 'quiz_passed', 'teacher_override', 'auto'
  unlocked_by UUID REFERENCES auth.users(id), -- teacher who unlocked, if override

  UNIQUE (user_id, program_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_week_unlocks_user ON week_unlocks(user_id);

ALTER TABLE week_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own unlocks" ON week_unlocks;
CREATE POLICY "Users can view own unlocks" ON week_unlocks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create unlocks" ON week_unlocks;
CREATE POLICY "System can create unlocks" ON week_unlocks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM class_enrollments ce
    JOIN classes c ON ce.class_id = c.id
    WHERE ce.student_id = week_unlocks.user_id AND c.teacher_id = auth.uid()
  ));

-- ============================================
-- 9. TRANSLATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('en', 'es')),
  value TEXT NOT NULL,
  context TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (key, language)
);

ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read translations" ON translations;
CREATE POLICY "Anyone can read translations" ON translations
  FOR SELECT USING (true);

-- ============================================
-- 10. HELPER FUNCTIONS
-- ============================================

-- Get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if admin first
  IF EXISTS (SELECT 1 FROM admin_users WHERE user_id = p_user_id) THEN
    RETURN 'admin';
  END IF;

  -- Check if teacher
  IF EXISTS (SELECT 1 FROM teachers WHERE id = p_user_id) THEN
    RETURN 'teacher';
  END IF;

  -- Default to student
  RETURN 'student';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if week is unlocked for user
CREATE OR REPLACE FUNCTION is_week_unlocked(
  p_user_id UUID,
  p_program_id TEXT,
  p_week_number INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Week 1 always unlocked
  IF p_week_number = 1 THEN
    RETURN TRUE;
  END IF;

  -- Check explicit unlock
  IF EXISTS (
    SELECT 1 FROM week_unlocks
    WHERE user_id = p_user_id
      AND program_id = p_program_id
      AND week_number = p_week_number
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check if previous week's quiz was passed
  RETURN EXISTS (
    SELECT 1 FROM quiz_attempts qa
    JOIN friday_quizzes fq ON qa.friday_quiz_id = fq.id
    JOIN modules m ON fq.module_id = m.id
    WHERE qa.user_id = p_user_id
      AND m.program_id = p_program_id
      AND m.week_number = p_week_number - 1
      AND qa.passed = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Unlock week for student (teacher action)
CREATE OR REPLACE FUNCTION unlock_week_for_student(
  p_student_id UUID,
  p_program_id TEXT,
  p_week_number INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_teacher_id UUID := auth.uid();
BEGIN
  -- Verify caller is teacher of this student's class
  IF NOT EXISTS (
    SELECT 1 FROM class_enrollments ce
    JOIN classes c ON ce.class_id = c.id
    WHERE ce.student_id = p_student_id AND c.teacher_id = v_teacher_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- Create unlock
  INSERT INTO week_unlocks (user_id, program_id, week_number, unlock_reason, unlocked_by)
  VALUES (p_student_id, p_program_id, p_week_number, 'teacher_override', v_teacher_id)
  ON CONFLICT (user_id, program_id, week_number) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get assignment grade (final score)
CREATE OR REPLACE FUNCTION get_final_grade(p_assignment_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_assignment RECORD;
BEGIN
  SELECT teacher_score, ai_score INTO v_assignment
  FROM assignments WHERE id = p_assignment_id;

  RETURN COALESCE(v_assignment.teacher_score, v_assignment.ai_score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 11. INSERT DEFAULT RUBRICS
-- ============================================

INSERT INTO grading_rubrics (rubric_name, full_credit_criteria, half_credit_criteria, no_credit_criteria, required_concepts)
VALUES
  ('Default Assignment Rubric',
   'Response demonstrates complete understanding of the concept. Includes specific examples or personal application. Shows critical thinking.',
   'Response shows partial understanding. May lack examples or depth. Addresses the main point but misses nuances.',
   'Response is off-topic, incomplete, or shows significant misunderstanding. May be too brief or copied.',
   ARRAY['understanding', 'application', 'examples'])
ON CONFLICT DO NOTHING;

-- ============================================
-- 12. ENSURE ENROLLMENTS HAS ALL COLUMNS
-- ============================================

-- Add language column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'language'
  ) THEN
    ALTER TABLE enrollments ADD COLUMN language TEXT DEFAULT 'en';
  END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
