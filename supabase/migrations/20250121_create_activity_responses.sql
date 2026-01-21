-- Create activity_responses table for tracking student activity submissions
-- This table stores responses to module activities which are required for progression

CREATE TABLE IF NOT EXISTS activity_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
    week_number INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    module_number INTEGER NOT NULL,
    module_title TEXT,
    activity_question TEXT,
    response_text TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one response per user per module per week
    CONSTRAINT unique_activity_response UNIQUE (user_id, week_number, day_number)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_responses_user_id ON activity_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_responses_enrollment_id ON activity_responses(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_activity_responses_week ON activity_responses(week_number);

-- Enable Row Level Security
ALTER TABLE activity_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own activity responses
CREATE POLICY "Users can view own activity responses"
    ON activity_responses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own activity responses
CREATE POLICY "Users can insert own activity responses"
    ON activity_responses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own activity responses
CREATE POLICY "Users can update own activity responses"
    ON activity_responses
    FOR UPDATE
    USING (auth.uid() = user_id);
