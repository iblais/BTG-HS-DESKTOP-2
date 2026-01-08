-- BTG Platform: Feature Flags Table
-- Version: 002
-- Date: January 2026
-- Description: Production-safe feature flag storage with admin controls

-- ============================================
-- 1. FEATURE FLAGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,

  -- Targeting (future use)
  user_ids UUID[] DEFAULT '{}', -- Enable only for specific users
  percentage INTEGER DEFAULT 100, -- Percentage rollout (0-100)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 2. INSERT DEFAULT FLAGS
-- ============================================

INSERT INTO feature_flags (flag_key, enabled, description) VALUES
  -- Phase A: Foundation
  ('newModuleStructure', FALSE, '5-day × 4-module structure'),
  ('fridayQuizOnly', FALSE, 'Quizzes only on Fridays after completing Days 1-4'),
  ('removeIntermediate', FALSE, 'Hide intermediate level option (Beginner + Advanced only)'),

  -- Phase B: Content
  ('videoContainers', FALSE, 'Video player in modules'),
  ('moduleNavigation', FALSE, 'New module-based navigation'),

  -- Phase C: Assessment
  ('assignmentWorkflow', FALSE, 'Assignment submission system'),
  ('aiGrading', FALSE, 'Claude AI grading for assignments'),

  -- Phase D: Teacher
  ('teacherDashboard', FALSE, 'Teacher role and dashboard'),
  ('classManagement', FALSE, 'Class roster management'),

  -- Phase E: Platform
  ('pdfExport', FALSE, 'Export to PDF for Kami'),
  ('googleClassroom', FALSE, 'Google Classroom integration'),
  ('spanishLanguage', FALSE, 'Spanish translations'),

  -- Debug
  ('debugMode', FALSE, 'Extra logging'),
  ('mockAiGrading', FALSE, 'Use mock AI responses')
ON CONFLICT (flag_key) DO NOTHING;

-- ============================================
-- 3. ADMIN USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read flags
DROP POLICY IF EXISTS "Authenticated users can read flags" ON feature_flags;
CREATE POLICY "Authenticated users can read flags" ON feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify flags
DROP POLICY IF EXISTS "Admins can modify flags" ON feature_flags;
CREATE POLICY "Admins can modify flags" ON feature_flags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Admins can read admin_users
DROP POLICY IF EXISTS "Admins can read admin list" ON admin_users;
CREATE POLICY "Admins can read admin list" ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Super admins can modify admin list
DROP POLICY IF EXISTS "Super admins can modify admin list" ON admin_users;
CREATE POLICY "Super admins can modify admin list" ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- ============================================
-- 5. UPDATED_AT TRIGGER
-- ============================================

DROP TRIGGER IF EXISTS trigger_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER trigger_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 6. HELPER FUNCTION TO CHECK IF USER IS ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNCTION TO GET ALL ENABLED FLAGS
-- ============================================

CREATE OR REPLACE FUNCTION get_enabled_flags()
RETURNS TABLE (flag_key TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ff.flag_key
  FROM feature_flags ff
  WHERE ff.enabled = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USAGE NOTES
-- ============================================
-- To make a user admin:
--   INSERT INTO admin_users (user_id, role) VALUES ('user-uuid-here', 'admin');
--
-- To make yourself admin (run in SQL editor as service role):
--   INSERT INTO admin_users (user_id, role)
--   SELECT id, 'super_admin' FROM auth.users WHERE email = 'your@email.com';
--
-- To enable a flag:
--   UPDATE feature_flags SET enabled = TRUE WHERE flag_key = 'newModuleStructure';
