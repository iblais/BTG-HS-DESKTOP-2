-- Fix: Add INSERT and UPDATE policies for course_progress
-- Students need to be able to save their own progress

-- Allow students to insert their own progress
DROP POLICY IF EXISTS "Users can insert own progress" ON course_progress;
CREATE POLICY "Users can insert own progress"
    ON course_progress
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow students to update their own progress
DROP POLICY IF EXISTS "Users can update own progress" ON course_progress;
CREATE POLICY "Users can update own progress"
    ON course_progress
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Also fix lesson_progress table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_progress') THEN
        -- Enable RLS
        ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
        
        -- Select policy
        DROP POLICY IF EXISTS "Users can view own lesson progress" ON lesson_progress;
        CREATE POLICY "Users can view own lesson progress"
            ON lesson_progress
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
        
        -- Insert policy
        DROP POLICY IF EXISTS "Users can insert own lesson progress" ON lesson_progress;
        CREATE POLICY "Users can insert own lesson progress"
            ON lesson_progress
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);
        
        -- Update policy
        DROP POLICY IF EXISTS "Users can update own lesson progress" ON lesson_progress;
        CREATE POLICY "Users can update own lesson progress"
            ON lesson_progress
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Fix activity_responses INSERT policy if missing
DROP POLICY IF EXISTS "Users can insert own activity responses" ON activity_responses;
CREATE POLICY "Users can insert own activity responses"
    ON activity_responses
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Fix activity_responses UPDATE policy if missing  
DROP POLICY IF EXISTS "Users can update own activity responses" ON activity_responses;
CREATE POLICY "Users can update own activity responses"
    ON activity_responses
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
