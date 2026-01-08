-- BTG Platform Restructure Migration
-- Version: 001
-- Date: January 2026
-- Description: Creates new tables for module-based curriculum, assignments, and teacher features
-- NOTE: This is a NON-DESTRUCTIVE migration - does not modify existing tables

-- ============================================
-- 1. MODULES TABLE
-- Stores the new 5-day × 4-module structure
-- ============================================

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL, -- 'HS' or 'COLLEGE'
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 4),
  module_number INTEGER NOT NULL CHECK (module_number BETWEEN 1 AND 4),

  -- Content
  title TEXT NOT NULL,
  intro_story TEXT, -- Mike's hook narrative
  lesson_content TEXT NOT NULL,
  vocabulary JSONB DEFAULT '[]', -- [{term, definition}]
  activity_description TEXT,
  activity_duration_minutes INTEGER DEFAULT 20,
  assignment_prompt TEXT,
  key_points JSONB DEFAULT '[]', -- string[]
  references JSONB DEFAULT '[]', -- [{title, url}]

  -- Video (nullable for future uploads)
  video_url TEXT,
  video_duration_seconds INTEGER,
  video_transcript TEXT,

  -- Metadata
  estimated_duration_minutes INTEGER DEFAULT 5,
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'advanced')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es')),

  -- Legacy mapping (for content migration)
  legacy_week_number INTEGER,
  legacy_section_index INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_id, week_number, day_number, module_number, language)
);

CREATE INDEX IF NOT EXISTS idx_modules_program_week ON modules(program_id, week_number);
CREATE INDEX IF NOT EXISTS idx_modules_language ON modules(language);
CREATE INDEX IF NOT EXISTS idx_modules_legacy ON modules(legacy_week_number, legacy_section_index);

-- ============================================
-- 2. MODULE PROGRESS TABLE
-- Tracks student progress through modules
-- ============================================

CREATE TABLE IF NOT EXISTS module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,

  -- Progress flags
  video_watched BOOLEAN DEFAULT FALSE,
  video_watch_seconds INTEGER DEFAULT 0,
  lesson_read BOOLEAN DEFAULT FALSE,
  activity_completed BOOLEAN DEFAULT FALSE,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_module_progress_user ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_enrollment ON module_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module ON module_progress(module_id);

-- ============================================
-- 3. GRADING RUBRICS TABLE
-- Defines AI grading criteria per module/week
-- ============================================

CREATE TABLE IF NOT EXISTS grading_rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  week_number INTEGER, -- For week-level rubrics

  -- Rubric Definition
  rubric_name TEXT NOT NULL,
  full_credit_criteria TEXT NOT NULL,
  full_credit_example TEXT,
  half_credit_criteria TEXT NOT NULL,
  half_credit_example TEXT,
  no_credit_criteria TEXT NOT NULL,
  no_credit_example TEXT,

  -- Keywords/concepts that must be present
  required_concepts JSONB DEFAULT '[]', -- string[]

  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grading_rubrics_module ON grading_rubrics(module_id);
CREATE INDEX IF NOT EXISTS idx_grading_rubrics_week ON grading_rubrics(week_number);

-- ============================================
-- 4. ASSIGNMENTS TABLE
-- Student assignment submissions with AI + teacher grading
-- ============================================

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,

  -- Response
  response_text TEXT,
  response_submitted_at TIMESTAMPTZ,

  -- AI Grading
  ai_score TEXT CHECK (ai_score IS NULL OR ai_score IN ('full', 'half', 'none')),
  ai_feedback TEXT,
  ai_graded_at TIMESTAMPTZ,
  ai_model_used TEXT,
  ai_rubric_version TEXT,

  -- Teacher Override
  teacher_score TEXT CHECK (teacher_score IS NULL OR teacher_score IN ('full', 'half', 'none')),
  teacher_feedback TEXT,
  teacher_override_at TIMESTAMPTZ,
  teacher_id UUID REFERENCES auth.users(id),

  -- Metadata
  time_spent_seconds INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, module_id, attempt_number)
);

-- Note: final_score computed in application layer as COALESCE(teacher_score, ai_score)

CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_module ON assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_assignments_enrollment ON assignments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_needs_review ON assignments(ai_score) WHERE teacher_score IS NULL AND ai_score IS NOT NULL;

-- ============================================
-- 5. TEACHERS TABLE
-- Teacher profiles for dashboard access
-- ============================================

CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  school_name TEXT,
  district TEXT,

  -- Permissions
  can_create_classes BOOLEAN DEFAULT TRUE,
  can_grade_assignments BOOLEAN DEFAULT TRUE,
  can_view_analytics BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

-- ============================================
-- 6. CLASSES TABLE
-- Teacher classes/sections
-- ============================================

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL, -- "Period 1", "Block A"
  program_id TEXT, -- 'HS' or 'COLLEGE'
  school_year TEXT, -- "2025-2026"

  -- Google Classroom integration (future)
  google_classroom_id TEXT,
  google_classroom_link TEXT,

  -- Join code for students
  join_code TEXT UNIQUE,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_join_code ON classes(join_code);

-- ============================================
-- 7. CLASS ENROLLMENTS TABLE
-- Links students to classes
-- ============================================

CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,

  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_enrollments_class ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student ON class_enrollments(student_id);

-- ============================================
-- 8. QUIZ QUESTIONS V2 TABLE
-- Enhanced quiz questions with module links
-- ============================================

CREATE TABLE IF NOT EXISTS quiz_questions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL,
  week_number INTEGER NOT NULL,

  -- Question content
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- string[4]
  correct_answer_index INTEGER NOT NULL CHECK (correct_answer_index BETWEEN 0 AND 3),
  explanation TEXT,

  -- Source tracking
  source_module_ids UUID[] DEFAULT '{}',
  source_day_numbers INTEGER[] DEFAULT '{}',

  -- Metadata
  difficulty_level TEXT DEFAULT 'beginner',
  language TEXT DEFAULT 'en',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_id, week_number, question_text, language)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_v2_program_week ON quiz_questions_v2(program_id, week_number);

-- ============================================
-- 9. TRANSLATIONS TABLE (for Spanish support)
-- ============================================

CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL, -- 'ui.button.submit', 'lesson.week1.intro'
  language TEXT NOT NULL CHECK (language IN ('en', 'es')),
  value TEXT NOT NULL,
  context TEXT, -- Optional context for translators

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(key, language)
);

CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language);

-- ============================================
-- 10. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Modules: Anyone can read
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read modules" ON modules;
CREATE POLICY "Anyone can read modules" ON modules
  FOR SELECT USING (true);

-- Module Progress: Users can manage own
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own module progress" ON module_progress;
CREATE POLICY "Users can view own module progress" ON module_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own module progress" ON module_progress;
CREATE POLICY "Users can insert own module progress" ON module_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own module progress" ON module_progress;
CREATE POLICY "Users can update own module progress" ON module_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Grading Rubrics: Anyone can read
ALTER TABLE grading_rubrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read grading rubrics" ON grading_rubrics;
CREATE POLICY "Anyone can read grading rubrics" ON grading_rubrics
  FOR SELECT USING (true);

-- Assignments: Users can manage own, teachers can view class assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assignments" ON assignments;
CREATE POLICY "Users can view own assignments" ON assignments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assignments" ON assignments;
CREATE POLICY "Users can insert own assignments" ON assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own assignments" ON assignments;
CREATE POLICY "Users can update own assignments" ON assignments
  FOR UPDATE USING (auth.uid() = user_id);

-- Teachers: Users can view own profile
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view own profile" ON teachers;
CREATE POLICY "Teachers can view own profile" ON teachers
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Teachers can update own profile" ON teachers;
CREATE POLICY "Teachers can update own profile" ON teachers
  FOR UPDATE USING (auth.uid() = id);

-- Classes: Teachers can manage own classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view own classes" ON classes;
CREATE POLICY "Teachers can view own classes" ON classes
  FOR SELECT USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can insert own classes" ON classes;
CREATE POLICY "Teachers can insert own classes" ON classes
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can update own classes" ON classes;
CREATE POLICY "Teachers can update own classes" ON classes
  FOR UPDATE USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can delete own classes" ON classes;
CREATE POLICY "Teachers can delete own classes" ON classes
  FOR DELETE USING (auth.uid() = teacher_id);

-- Class Enrollments: Teachers and students can view
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own class enrollments" ON class_enrollments;
CREATE POLICY "Students can view own class enrollments" ON class_enrollments
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert own class enrollments" ON class_enrollments;
CREATE POLICY "Students can insert own class enrollments" ON class_enrollments
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Quiz Questions V2: Anyone can read
ALTER TABLE quiz_questions_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read quiz questions v2" ON quiz_questions_v2;
CREATE POLICY "Anyone can read quiz questions v2" ON quiz_questions_v2
  FOR SELECT USING (true);

-- Translations: Anyone can read
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read translations" ON translations;
CREATE POLICY "Anyone can read translations" ON translations
  FOR SELECT USING (true);

-- ============================================
-- 11. HELPER FUNCTIONS
-- ============================================

-- Function to generate join codes for classes
CREATE OR REPLACE FUNCTION generate_class_join_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Avoid confusing chars
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate join code
CREATE OR REPLACE FUNCTION set_class_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := generate_class_join_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_class_join_code ON classes;
CREATE TRIGGER trigger_set_class_join_code
  BEFORE INSERT ON classes
  FOR EACH ROW
  EXECUTE FUNCTION set_class_join_code();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS trigger_modules_updated_at ON modules;
CREATE TRIGGER trigger_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_grading_rubrics_updated_at ON grading_rubrics;
CREATE TRIGGER trigger_grading_rubrics_updated_at
  BEFORE UPDATE ON grading_rubrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_assignments_updated_at ON assignments;
CREATE TRIGGER trigger_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_teachers_updated_at ON teachers;
CREATE TRIGGER trigger_teachers_updated_at
  BEFORE UPDATE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_classes_updated_at ON classes;
CREATE TRIGGER trigger_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- All tables are created with IF NOT EXISTS for safety
-- All policies use DROP IF EXISTS before CREATE for idempotency
