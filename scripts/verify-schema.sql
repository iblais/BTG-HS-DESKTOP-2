-- BTG Schema Verification Script
-- Run in Supabase SQL Editor to verify production readiness

-- ============================================
-- 1. TABLE INVENTORY
-- ============================================

SELECT '=== TABLE INVENTORY ===' as section;

SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'programs', 'enrollments', 'modules', 'module_content', 'module_map',
    'user_module_progress', 'friday_quizzes', 'quiz_questions', 'quiz_attempts',
    'assignments', 'grading_rubrics', 'classes', 'class_enrollments',
    'teachers', 'users', 'admin_users', 'feature_flags', 'error_logs'
  )
ORDER BY table_name;

-- ============================================
-- 2. PROGRAM STRUCTURE VERIFICATION
-- ============================================

SELECT '=== PROGRAM STRUCTURE ===' as section;

-- Check programs exist with correct weeks
SELECT id as program_id, title, weeks_total,
       CASE
         WHEN id = 'HS' AND weeks_total = 18 THEN '✓ PASS'
         WHEN id = 'COLLEGE' AND weeks_total = 16 THEN '✓ PASS'
         ELSE '✗ FAIL'
       END as status
FROM programs;

-- ============================================
-- 3. MODULE STRUCTURE VERIFICATION
-- ============================================

SELECT '=== MODULE COUNTS BY PROGRAM ===' as section;

-- Count modules per program
SELECT program_id,
       COUNT(*) as total_modules,
       COUNT(CASE WHEN day_number <= 4 THEN 1 END) as content_modules,
       COUNT(CASE WHEN day_number = 5 THEN 1 END) as quiz_modules,
       CASE
         WHEN program_id = 'HS' AND COUNT(*) = 90 THEN '✓ PASS (90 expected)'
         WHEN program_id = 'COLLEGE' AND COUNT(*) = 80 THEN '✓ PASS (80 expected)'
         ELSE '✗ FAIL'
       END as status
FROM modules
GROUP BY program_id;

-- Check each week has 5 days
SELECT '=== DAYS PER WEEK ===' as section;

SELECT program_id, week_number, COUNT(DISTINCT day_number) as days,
       CASE WHEN COUNT(DISTINCT day_number) = 5 THEN '✓' ELSE '✗' END as status
FROM modules
GROUP BY program_id, week_number
ORDER BY program_id, week_number;

-- ============================================
-- 4. ENROLLMENT SCHEMA CHECK
-- ============================================

SELECT '=== ENROLLMENTS COLUMNS ===' as section;

SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'enrollments'
ORDER BY ordinal_position;

-- ============================================
-- 5. RLS POLICY CHECK
-- ============================================

SELECT '=== RLS POLICIES ===' as section;

SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 6. MISSING TABLES CHECK
-- ============================================

SELECT '=== MISSING TABLES CHECK ===' as section;

-- Check for required tables that might be missing
SELECT 'assignments' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments')
            THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
UNION ALL
SELECT 'grading_rubrics',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grading_rubrics')
            THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'classes',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes')
            THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'class_enrollments',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_enrollments')
            THEN '✓ EXISTS' ELSE '✗ MISSING' END
UNION ALL
SELECT 'teachers',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teachers')
            THEN '✓ EXISTS' ELSE '✗ MISSING' END;

-- ============================================
-- 7. FRIDAY QUIZ CONFIGURATION
-- ============================================

SELECT '=== FRIDAY QUIZZES ===' as section;

SELECT COUNT(*) as total_friday_quizzes,
       COUNT(CASE WHEN array_length(source_module_ids, 1) = 4 THEN 1 END) as with_4_sources,
       COUNT(CASE WHEN passing_score = 70 THEN 1 END) as with_70_passing
FROM friday_quizzes;
