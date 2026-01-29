-- Add teacher access policies
-- Teachers need to be able to view all users and their progress

-- First, ensure user_roles table exists and has proper structure
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_role UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own role
CREATE POLICY "Users can view own role"
    ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create a function to check if user is a teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check user_roles table
    RETURN EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'teacher'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user email is a teacher (for hardcoded teachers)
CREATE OR REPLACE FUNCTION is_teacher_email()
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get current user's email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = auth.uid();

    -- Check against hardcoded teacher emails
    RETURN user_email IN ('itsblais@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for teachers to view ALL users
DROP POLICY IF EXISTS "Teachers can view all users" ON users;
CREATE POLICY "Teachers can view all users"
    ON users
    FOR SELECT
    USING (
        auth.uid() = id  -- Users can see themselves
        OR is_teacher()  -- Teachers can see everyone
        OR is_teacher_email()  -- Hardcoded teacher emails can see everyone
    );

-- Add policy for teachers to view ALL activity_responses
DROP POLICY IF EXISTS "Teachers can view all activity responses" ON activity_responses;
CREATE POLICY "Teachers can view all activity responses"
    ON activity_responses
    FOR SELECT
    USING (
        auth.uid() = user_id  -- Users can see their own
        OR is_teacher()  -- Teachers can see all
        OR is_teacher_email()  -- Hardcoded teacher emails can see all
    );

-- Add policy for teachers to view ALL course_progress
DROP POLICY IF EXISTS "Teachers can view all course progress" ON course_progress;
CREATE POLICY "Teachers can view all course progress"
    ON course_progress
    FOR SELECT
    USING (
        auth.uid() = user_id  -- Users can see their own
        OR is_teacher()  -- Teachers can see all
        OR is_teacher_email()  -- Hardcoded teacher emails can see all
    );

-- Add policy for teachers to view ALL enrollments
DROP POLICY IF EXISTS "Teachers can view all enrollments" ON enrollments;
CREATE POLICY "Teachers can view all enrollments"
    ON enrollments
    FOR SELECT
    USING (
        auth.uid() = user_id  -- Users can see their own
        OR is_teacher()  -- Teachers can see all
        OR is_teacher_email()  -- Hardcoded teacher emails can see all
    );

-- Add policy for teachers to view ALL quiz_attempts
DROP POLICY IF EXISTS "Teachers can view all quiz attempts" ON quiz_attempts;
CREATE POLICY "Teachers can view all quiz attempts"
    ON quiz_attempts
    FOR SELECT
    USING (
        auth.uid() = user_id  -- Users can see their own
        OR is_teacher()  -- Teachers can see all
        OR is_teacher_email()  -- Hardcoded teacher emails can see all
    );

-- Add policy for teachers to view ALL game_scores
DROP POLICY IF EXISTS "Teachers can view all game scores" ON game_scores;
CREATE POLICY "Teachers can view all game scores"
    ON game_scores
    FOR SELECT
    USING (
        auth.uid() = user_id  -- Users can see their own
        OR is_teacher()  -- Teachers can see all
        OR is_teacher_email()  -- Hardcoded teacher emails can see all
    );

-- Add policy for teachers to view ALL achievements
DROP POLICY IF EXISTS "Teachers can view all achievements" ON achievements;
CREATE POLICY "Teachers can view all achievements"
    ON achievements
    FOR SELECT
    USING (
        auth.uid() = user_id  -- Users can see their own
        OR is_teacher()  -- Teachers can see all
        OR is_teacher_email()  -- Hardcoded teacher emails can see all
    );

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION is_teacher_email() TO authenticated;
