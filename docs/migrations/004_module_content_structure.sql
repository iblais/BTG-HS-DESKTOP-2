-- BTG Platform: Module Content Structure
-- Version: 004
-- Date: January 2026
-- Description: New 5-day × 4-module structure with content migration

-- ============================================
-- 1. MODULE DEFINITION TABLE
-- ============================================
-- Defines the structure: each week has 4 modules (Mon-Thu) + Friday quiz

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number > 0),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 5), -- 1-4 = modules, 5 = Friday quiz
  module_number INTEGER GENERATED ALWAYS AS ((week_number - 1) * 4 + day_number) STORED,

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  learning_objectives TEXT[], -- Array of objectives

  -- Content types for this module
  has_video BOOLEAN DEFAULT FALSE,
  has_reading BOOLEAN DEFAULT TRUE,
  has_activity BOOLEAN DEFAULT FALSE,
  has_assignment BOOLEAN DEFAULT FALSE,
  has_quiz BOOLEAN DEFAULT FALSE, -- True only for day 5 (Friday)

  -- Estimated duration in minutes
  estimated_minutes INTEGER DEFAULT 30,

  -- Track level (NULL = all levels)
  track_level TEXT CHECK (track_level IN ('beginner', 'intermediate', 'advanced') OR track_level IS NULL),

  -- Language (NULL = all languages)
  language TEXT DEFAULT 'en',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per program/week/day/level/language
  UNIQUE (program_id, week_number, day_number, track_level, language)
);

CREATE INDEX IF NOT EXISTS idx_modules_program ON modules(program_id);
CREATE INDEX IF NOT EXISTS idx_modules_week ON modules(week_number);
CREATE INDEX IF NOT EXISTS idx_modules_lookup ON modules(program_id, week_number, day_number);

-- ============================================
-- 2. MODULE CONTENT TABLE
-- ============================================
-- Actual content for each module (text, videos, etc.)

CREATE TABLE IF NOT EXISTS module_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,

  -- Content type
  content_type TEXT NOT NULL CHECK (content_type IN ('reading', 'video', 'activity', 'resource')),
  content_order INTEGER DEFAULT 1,

  -- Content
  title TEXT NOT NULL,
  content_html TEXT, -- For reading content
  video_url TEXT, -- For video content
  video_thumbnail_url TEXT,
  video_duration_seconds INTEGER,

  -- Activity/interactive content
  activity_type TEXT, -- 'drag-drop', 'fill-blank', 'matching', etc.
  activity_data JSONB, -- Activity-specific configuration

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_content_module ON module_content(module_id);
CREATE INDEX IF NOT EXISTS idx_module_content_type ON module_content(content_type);

-- ============================================
-- 3. MODULE MAP - LEGACY CONTENT MAPPING
-- ============================================
-- Maps old lesson IDs to new module structure

CREATE TABLE IF NOT EXISTS module_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Legacy reference
  legacy_week INTEGER NOT NULL,
  legacy_day INTEGER,
  legacy_lesson_id TEXT,

  -- New structure
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  program_id TEXT NOT NULL,

  -- Migration status
  migrated BOOLEAN DEFAULT FALSE,
  migrated_at TIMESTAMPTZ,
  migration_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_map_legacy ON module_map(legacy_week, legacy_day);
CREATE INDEX IF NOT EXISTS idx_module_map_module ON module_map(module_id);

-- ============================================
-- 4. QUIZ STRUCTURE FOR FRIDAY
-- ============================================
-- Friday quizzes cover content from the 4 modules of that week

CREATE TABLE IF NOT EXISTS friday_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE, -- The Friday module

  -- Quiz configuration
  title TEXT NOT NULL DEFAULT 'Weekly Review Quiz',
  description TEXT DEFAULT 'Test your knowledge from this week''s modules',
  time_limit_minutes INTEGER DEFAULT 15,
  passing_score INTEGER DEFAULT 70, -- Percentage
  max_attempts INTEGER DEFAULT 3, -- NULL = unlimited

  -- Questions from which modules (should be the 4 preceding modules)
  source_module_ids UUID[] NOT NULL,
  questions_per_module INTEGER DEFAULT 3, -- How many questions to pull from each module

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. QUIZ QUESTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE, -- Source module

  -- Question content
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank')),

  -- Options for multiple choice (array of objects with id, text, isCorrect)
  options JSONB,
  correct_answer TEXT, -- For fill_blank

  -- Explanation shown after answering
  explanation TEXT,

  -- Metadata
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  points INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_module ON quiz_questions(module_id);

-- ============================================
-- 6. QUIZ ATTEMPTS
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friday_quiz_id UUID NOT NULL REFERENCES friday_quizzes(id) ON DELETE CASCADE,

  -- Attempt info
  attempt_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Results
  score INTEGER, -- Percentage
  correct_count INTEGER,
  total_questions INTEGER,
  passed BOOLEAN,

  -- Answers given (array of {questionId, answer, isCorrect})
  answers JSONB,

  -- Time tracking
  time_spent_seconds INTEGER,

  UNIQUE (user_id, friday_quiz_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(friday_quiz_id);

-- ============================================
-- 7. USER MODULE PROGRESS
-- ============================================

CREATE TABLE IF NOT EXISTS user_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,

  -- Progress tracking
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Content completion (content_id -> completion timestamp)
  content_completed JSONB DEFAULT '{}',

  -- Time tracking
  time_spent_seconds INTEGER DEFAULT 0,

  -- Notes or bookmarks
  user_notes TEXT,

  UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_user_module_progress_user ON user_module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_module_progress_module ON user_module_progress(module_id);

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Modules: Everyone can read
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read modules" ON modules;
CREATE POLICY "Anyone can read modules" ON modules FOR SELECT USING (true);

-- Module content: Everyone can read
ALTER TABLE module_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read module content" ON module_content;
CREATE POLICY "Anyone can read module content" ON module_content FOR SELECT USING (true);

-- Quiz questions: Everyone can read (for now)
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read quiz questions" ON quiz_questions;
CREATE POLICY "Anyone can read quiz questions" ON quiz_questions FOR SELECT USING (true);

-- Friday quizzes: Everyone can read
ALTER TABLE friday_quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read friday quizzes" ON friday_quizzes;
CREATE POLICY "Anyone can read friday quizzes" ON friday_quizzes FOR SELECT USING (true);

-- Quiz attempts: Users can manage their own
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own quiz attempts" ON quiz_attempts;
CREATE POLICY "Users can manage own quiz attempts" ON quiz_attempts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User module progress: Users can manage their own
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own module progress" ON user_module_progress;
CREATE POLICY "Users can manage own module progress" ON user_module_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin policies for content management
DROP POLICY IF EXISTS "Admins can manage modules" ON modules;
CREATE POLICY "Admins can manage modules" ON modules
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage module content" ON module_content;
CREATE POLICY "Admins can manage module content" ON module_content
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage quiz questions" ON quiz_questions;
CREATE POLICY "Admins can manage quiz questions" ON quiz_questions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage friday quizzes" ON friday_quizzes;
CREATE POLICY "Admins can manage friday quizzes" ON friday_quizzes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Get modules for a specific week
CREATE OR REPLACE FUNCTION get_week_modules(
  p_program_id TEXT,
  p_week_number INTEGER,
  p_track_level TEXT DEFAULT NULL,
  p_language TEXT DEFAULT 'en'
)
RETURNS SETOF modules AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM modules
  WHERE program_id = p_program_id
    AND week_number = p_week_number
    AND (track_level IS NULL OR track_level = p_track_level)
    AND language = p_language
  ORDER BY day_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can take Friday quiz (completed days 1-4)
CREATE OR REPLACE FUNCTION can_take_friday_quiz(
  p_user_id UUID,
  p_program_id TEXT,
  p_week_number INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_completed_days INTEGER;
BEGIN
  SELECT COUNT(DISTINCT m.day_number)
  INTO v_completed_days
  FROM user_module_progress ump
  JOIN modules m ON ump.module_id = m.id
  WHERE ump.user_id = p_user_id
    AND m.program_id = p_program_id
    AND m.week_number = p_week_number
    AND m.day_number BETWEEN 1 AND 4
    AND ump.completed_at IS NOT NULL;

  RETURN v_completed_days >= 4;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's quiz attempts for a week
CREATE OR REPLACE FUNCTION get_quiz_attempts(
  p_user_id UUID,
  p_program_id TEXT,
  p_week_number INTEGER
)
RETURNS TABLE (
  attempt_id UUID,
  attempt_number INTEGER,
  score INTEGER,
  passed BOOLEAN,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qa.id,
    qa.attempt_number,
    qa.score,
    qa.passed,
    qa.completed_at
  FROM quiz_attempts qa
  JOIN friday_quizzes fq ON qa.friday_quiz_id = fq.id
  JOIN modules m ON fq.module_id = m.id
  WHERE qa.user_id = p_user_id
    AND m.program_id = p_program_id
    AND m.week_number = p_week_number
  ORDER BY qa.attempt_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
