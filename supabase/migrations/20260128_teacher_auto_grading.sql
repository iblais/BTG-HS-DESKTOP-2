-- BTG-Desktop: Teacher Auto-Grading and Kami Integration
-- Migration: 20260128_teacher_auto_grading.sql

-- 1. Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  school_name text,
  grade_level text,
  academic_year text DEFAULT '2024-2025',
  kami_enabled boolean DEFAULT true,
  auto_grading_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Class codes table
CREATE TABLE IF NOT EXISTS class_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 year'),
  is_active boolean DEFAULT true
);

-- 3. Teacher-student relationships
CREATE TABLE IF NOT EXISTS teacher_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- 4. Rubric templates (for auto-grading)
CREATE TABLE IF NOT EXISTS rubric_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  criteria jsonb NOT NULL,
  total_points integer NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  is_system_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 5. Auto-grading results (stores AI scores)
CREATE TABLE IF NOT EXISTS auto_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_response_id uuid,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number integer,
  day_number integer,
  rubric_id uuid REFERENCES rubric_templates(id),
  rubric_scores jsonb NOT NULL,
  total_score integer NOT NULL,
  max_score integer DEFAULT 100,
  ai_feedback text,
  graded_at timestamptz DEFAULT now(),
  teacher_reviewed boolean DEFAULT false,
  teacher_adjusted_score integer,
  teacher_feedback text,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  UNIQUE(student_id, week_number, day_number)
);

-- 6. Kami integration tracking
CREATE TABLE IF NOT EXISTS kami_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_response_id uuid,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number integer,
  day_number integer,
  kami_document_id text UNIQUE,
  kami_share_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, week_number, day_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_codes_code ON class_codes(code);
CREATE INDEX IF NOT EXISTS idx_class_codes_class ON class_codes(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher ON teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_student ON teacher_students(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_class ON teacher_students(class_id);
CREATE INDEX IF NOT EXISTS idx_auto_grades_student ON auto_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_auto_grades_week_day ON auto_grades(student_id, week_number, day_number);
CREATE INDEX IF NOT EXISTS idx_kami_docs_student ON kami_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_kami_docs_week_day ON kami_documents(student_id, week_number, day_number);
CREATE INDEX IF NOT EXISTS idx_rubric_templates_default ON rubric_templates(is_system_default);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE kami_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
DROP POLICY IF EXISTS "Teachers manage own classes" ON classes;
CREATE POLICY "Teachers manage own classes"
  ON classes FOR ALL TO authenticated
  USING (teacher_id = auth.uid());

-- RLS Policies for class_codes
DROP POLICY IF EXISTS "Anyone can verify codes" ON class_codes;
CREATE POLICY "Anyone can verify codes"
  ON class_codes FOR SELECT TO authenticated
  USING (is_active = true AND expires_at > now());

DROP POLICY IF EXISTS "Teachers manage own class codes" ON class_codes;
CREATE POLICY "Teachers manage own class codes"
  ON class_codes FOR ALL TO authenticated
  USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));

-- RLS Policies for teacher_students
DROP POLICY IF EXISTS "Teachers view own students" ON teacher_students;
CREATE POLICY "Teachers view own students"
  ON teacher_students FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students view own relationships" ON teacher_students;
CREATE POLICY "Students view own relationships"
  ON teacher_students FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "System creates relationships" ON teacher_students;
CREATE POLICY "System creates relationships"
  ON teacher_students FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

-- RLS Policies for rubric_templates
DROP POLICY IF EXISTS "Anyone can view system rubrics" ON rubric_templates;
CREATE POLICY "Anyone can view system rubrics"
  ON rubric_templates FOR SELECT TO authenticated
  USING (is_system_default = true);

DROP POLICY IF EXISTS "Teachers manage own rubrics" ON rubric_templates;
CREATE POLICY "Teachers manage own rubrics"
  ON rubric_templates FOR ALL TO authenticated
  USING (created_by = auth.uid() OR is_system_default = true);

-- RLS Policies for auto_grades
DROP POLICY IF EXISTS "Teachers view student auto grades" ON auto_grades;
CREATE POLICY "Teachers view student auto grades"
  ON auto_grades FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT ts.student_id FROM teacher_students ts
      WHERE ts.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers update auto grades" ON auto_grades;
CREATE POLICY "Teachers update auto grades"
  ON auto_grades FOR UPDATE TO authenticated
  USING (
    student_id IN (
      SELECT ts.student_id FROM teacher_students ts
      WHERE ts.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students view own auto grades" ON auto_grades;
CREATE POLICY "Students view own auto grades"
  ON auto_grades FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "System inserts auto grades" ON auto_grades;
CREATE POLICY "System inserts auto grades"
  ON auto_grades FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS Policies for kami_documents
DROP POLICY IF EXISTS "Teachers view kami docs" ON kami_documents;
CREATE POLICY "Teachers view kami docs"
  ON kami_documents FOR ALL TO authenticated
  USING (
    student_id IN (
      SELECT ts.student_id FROM teacher_students ts
      WHERE ts.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students view own kami docs" ON kami_documents;
CREATE POLICY "Students view own kami docs"
  ON kami_documents FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "System inserts kami docs" ON kami_documents;
CREATE POLICY "System inserts kami docs"
  ON kami_documents FOR INSERT TO authenticated
  WITH CHECK (true);

-- Function to generate class code
CREATE OR REPLACE FUNCTION generate_class_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i integer;
BEGIN
  FOR i IN 1..3 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  code := code || '-';
  FOR i IN 1..3 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  code := code || '-';
  FOR i IN 1..3 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Insert default rubrics (only if not exists)
INSERT INTO rubric_templates (name, description, criteria, total_points, is_system_default)
SELECT
  'Standard Writing Rubric',
  'Default rubric for financial literacy writing assignments',
  '[
    {"criterion": "Understanding of Concept", "points": 25, "description": "Demonstrates clear understanding of financial concept"},
    {"criterion": "Real-World Application", "points": 25, "description": "Applies concept to real-life scenarios"},
    {"criterion": "Writing Quality", "points": 25, "description": "Clear, organized, and well-written"},
    {"criterion": "Completeness", "points": 25, "description": "Fully addresses the prompt"}
  ]'::jsonb,
  100,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM rubric_templates WHERE name = 'Standard Writing Rubric' AND is_system_default = true
);

-- Trigger to auto-generate class code when class is created
CREATE OR REPLACE FUNCTION auto_generate_class_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := generate_class_code();
    SELECT EXISTS(SELECT 1 FROM class_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  INSERT INTO class_codes (class_id, code)
  VALUES (NEW.id, new_code);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_class_code_trigger ON classes;
CREATE TRIGGER create_class_code_trigger
  AFTER INSERT ON classes
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_class_code();
