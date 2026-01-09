-- Migration: Add activity_responses table
-- This stores student responses to module activities
-- Each module (Days 1-4) has a required activity at the end

CREATE TABLE IF NOT EXISTS activity_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Location in curriculum
    week_number INTEGER NOT NULL,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 4),
    module_number INTEGER NOT NULL CHECK (module_number BETWEEN 1 AND 4),

    -- Activity details
    activity_title TEXT,
    activity_prompt TEXT,

    -- Student response
    response_text TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- AI Grading (optional)
    ai_score TEXT CHECK (ai_score IN ('full', 'half', 'none')),
    ai_feedback TEXT,
    ai_graded_at TIMESTAMPTZ,

    -- Teacher Review (optional)
    teacher_score TEXT CHECK (teacher_score IN ('full', 'half', 'none')),
    teacher_feedback TEXT,
    teacher_reviewed_at TIMESTAMPTZ,
    teacher_id UUID REFERENCES auth.users(id),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one response per user per day
    UNIQUE(user_id, week_number, day_number)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_activity_responses_user_week
ON activity_responses(user_id, week_number);

-- Index for teacher dashboard
CREATE INDEX IF NOT EXISTS idx_activity_responses_needs_review
ON activity_responses(ai_score) WHERE teacher_score IS NULL;

-- Enable RLS
ALTER TABLE activity_responses ENABLE ROW LEVEL SECURITY;

-- Users can see their own responses
CREATE POLICY "Users can view own activity responses"
ON activity_responses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert own activity responses"
ON activity_responses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update own activity responses"
ON activity_responses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Teachers can view all responses (for grading)
-- Note: Adjust this based on your teacher role implementation
CREATE POLICY "Teachers can view all activity responses"
ON activity_responses FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM teachers
        WHERE teachers.user_id = auth.uid()
    )
);

-- Teachers can update responses (for grading)
CREATE POLICY "Teachers can grade activity responses"
ON activity_responses FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM teachers
        WHERE teachers.user_id = auth.uid()
    )
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_activity_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_responses_updated_at
    BEFORE UPDATE ON activity_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_activity_responses_updated_at();
