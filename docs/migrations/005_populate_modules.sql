-- BTG Platform: Populate Modules from Legacy Content
-- Version: 005
-- Date: January 2026
-- Description: Creates module structure for HS (18 weeks) and College (16 weeks)

-- ============================================
-- 1. HIGH SCHOOL PROGRAM - 18 WEEKS
-- ============================================

-- Each week: Days 1-4 (Mon-Thu) for modules, Day 5 (Fri) for quiz
-- Week 1: Understanding Income, Expenses, and Savings
INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_video, has_reading, has_activity, estimated_minutes, track_level, language)
VALUES
  ('HS', 1, 1, 'What is Income?', ARRAY['Understand different sources of income', 'Track all income sources', 'Calculate total monthly income'], FALSE, TRUE, FALSE, 15, 'beginner', 'en'),
  ('HS', 1, 2, 'Types of Expenses', ARRAY['Distinguish fixed vs variable expenses', 'Identify where spending can be reduced', 'Track expenses for a month'], FALSE, TRUE, FALSE, 15, 'beginner', 'en'),
  ('HS', 1, 3, 'The Power of Saving', ARRAY['Understand compound interest basics', 'Apply the 50/30/20 rule', 'Set up an emergency fund'], TRUE, TRUE, FALSE, 20, 'beginner', 'en'),
  ('HS', 1, 4, 'Creating Your First Budget', ARRAY['Calculate income minus expenses', 'Prioritize needs vs wants', 'Create a monthly budget'], FALSE, TRUE, TRUE, 25, 'beginner', 'en'),
  ('HS', 1, 5, 'Week 1 Review Quiz', ARRAY['Test understanding of income, expenses, and budgeting'], FALSE, FALSE, FALSE, 15, 'beginner', 'en')
ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;

-- Week 2: Increasing Your Income
INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_video, has_reading, has_activity, estimated_minutes, track_level, language)
VALUES
  ('HS', 2, 1, 'Side Hustle Opportunities', ARRAY['Identify skills that can generate income', 'Evaluate flexible gig opportunities', 'Balance work with school'], FALSE, TRUE, FALSE, 20, 'beginner', 'en'),
  ('HS', 2, 2, 'Goal Setting and Income Planning', ARRAY['Set SMART financial goals', 'Create an income growth plan', 'Track progress toward goals'], FALSE, TRUE, TRUE, 20, 'beginner', 'en'),
  ('HS', 2, 3, 'Building Multiple Income Streams', ARRAY['Understand diversification of income', 'Start with one extra income stream', 'Plan for passive income'], FALSE, TRUE, FALSE, 15, 'beginner', 'en'),
  ('HS', 2, 4, 'Negotiating and Earning More', ARRAY['Learn negotiation basics', 'Ask for raises effectively', 'Value your time properly'], FALSE, TRUE, TRUE, 20, 'beginner', 'en'),
  ('HS', 2, 5, 'Week 2 Review Quiz', ARRAY['Test understanding of income growth strategies'], FALSE, FALSE, FALSE, 15, 'beginner', 'en')
ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;

-- Week 3: Understanding Credit
INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_video, has_reading, has_activity, estimated_minutes, track_level, language)
VALUES
  ('HS', 3, 1, 'Credit Basics', ARRAY['Understand what credit is', 'Know types of credit', 'Understand interest rates'], FALSE, TRUE, FALSE, 20, 'beginner', 'en'),
  ('HS', 3, 2, 'Your Credit Score Explained', ARRAY['Know the credit score range', 'Understand factors affecting score', 'Learn how to check your score'], TRUE, TRUE, FALSE, 25, 'beginner', 'en'),
  ('HS', 3, 3, 'Building Credit as a Student', ARRAY['Choose first credit product', 'Use credit responsibly', 'Avoid common mistakes'], FALSE, TRUE, TRUE, 20, 'beginner', 'en'),
  ('HS', 3, 4, 'Managing Credit Wisely', ARRAY['Pay balances in full', 'Keep utilization under 30%', 'Monitor credit regularly'], FALSE, TRUE, FALSE, 15, 'beginner', 'en'),
  ('HS', 3, 5, 'Week 3 Review Quiz', ARRAY['Test understanding of credit fundamentals'], FALSE, FALSE, FALSE, 15, 'beginner', 'en')
ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;

-- Week 4: Banking Basics
INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_video, has_reading, has_activity, estimated_minutes, track_level, language)
VALUES
  ('HS', 4, 1, 'Checking vs Savings Accounts', ARRAY['Understand account types', 'Choose right accounts', 'Avoid fees'], FALSE, TRUE, FALSE, 15, 'beginner', 'en'),
  ('HS', 4, 2, 'Online Banking and Apps', ARRAY['Set up mobile banking', 'Use budgeting apps', 'Automate finances'], FALSE, TRUE, TRUE, 20, 'beginner', 'en'),
  ('HS', 4, 3, 'Avoiding Bank Fees', ARRAY['Identify common fees', 'Choose fee-free options', 'Maintain minimums'], FALSE, TRUE, FALSE, 15, 'beginner', 'en'),
  ('HS', 4, 4, 'Protecting Your Money', ARRAY['Recognize fraud', 'Secure accounts', 'Report suspicious activity'], TRUE, TRUE, FALSE, 20, 'beginner', 'en'),
  ('HS', 4, 5, 'Week 4 Review Quiz', ARRAY['Test understanding of banking fundamentals'], FALSE, FALSE, FALSE, 15, 'beginner', 'en')
ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;

-- Week 5: Debt Management
INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_video, has_reading, has_activity, estimated_minutes, track_level, language)
VALUES
  ('HS', 5, 1, 'Good Debt vs Bad Debt', ARRAY['Distinguish debt types', 'Understand leverage', 'Make informed borrowing decisions'], FALSE, TRUE, FALSE, 15, 'beginner', 'en'),
  ('HS', 5, 2, 'Student Loans Explained', ARRAY['Know loan types', 'Understand repayment options', 'Minimize borrowing'], TRUE, TRUE, FALSE, 25, 'beginner', 'en'),
  ('HS', 5, 3, 'Paying Off Debt Strategies', ARRAY['Compare avalanche vs snowball', 'Create payoff plan', 'Stay motivated'], FALSE, TRUE, TRUE, 20, 'beginner', 'en'),
  ('HS', 5, 4, 'Avoiding Debt Traps', ARRAY['Recognize predatory lending', 'Avoid payday loans', 'Build emergency fund'], FALSE, TRUE, FALSE, 15, 'beginner', 'en'),
  ('HS', 5, 5, 'Week 5 Review Quiz', ARRAY['Test understanding of debt management'], FALSE, FALSE, FALSE, 15, 'beginner', 'en')
ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;

-- Week 6: Introduction to Investing
INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_video, has_reading, has_activity, estimated_minutes, track_level, language)
VALUES
  ('HS', 6, 1, 'Why Invest?', ARRAY['Understand wealth building', 'Beat inflation', 'Start early advantage'], FALSE, TRUE, FALSE, 15, 'beginner', 'en'),
  ('HS', 6, 2, 'Stocks and Bonds Basics', ARRAY['Understand stock ownership', 'Know bond mechanics', 'Compare risk/reward'], TRUE, TRUE, FALSE, 25, 'beginner', 'en'),
  ('HS', 6, 3, 'Mutual Funds and ETFs', ARRAY['Understand diversification', 'Compare fund types', 'Choose low-cost options'], FALSE, TRUE, FALSE, 20, 'beginner', 'en'),
  ('HS', 6, 4, 'Starting to Invest', ARRAY['Open investment account', 'Make first investment', 'Set up auto-invest'], FALSE, TRUE, TRUE, 20, 'beginner', 'en'),
  ('HS', 6, 5, 'Week 6 Review Quiz', ARRAY['Test understanding of investing basics'], FALSE, FALSE, FALSE, 15, 'beginner', 'en')
ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;

-- Weeks 7-18: Generate remaining weeks with placeholder content
DO $$
DECLARE
  week_num INTEGER;
  week_titles TEXT[] := ARRAY[
    'Retirement Planning Basics',     -- Week 7
    'Insurance Fundamentals',         -- Week 8
    'Taxes Made Simple',              -- Week 9
    'Career and Financial Planning',  -- Week 10
    'Real Estate Basics',             -- Week 11
    'Entrepreneurship 101',           -- Week 12
    'Financial Decision Making',      -- Week 13
    'Consumer Rights',                -- Week 14
    'Giving and Philanthropy',        -- Week 15
    'Financial Review',               -- Week 16
    'Advanced Planning',              -- Week 17
    'Final Preparation'               -- Week 18
  ];
  day_num INTEGER;
  day_titles TEXT[][] := ARRAY[
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps'],
    ARRAY['Introduction', 'Core Concepts', 'Practical Application', 'Action Steps']
  ];
BEGIN
  FOR week_num IN 7..18 LOOP
    FOR day_num IN 1..4 LOOP
      INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_video, has_reading, has_activity, estimated_minutes, track_level, language)
      VALUES (
        'HS',
        week_num,
        day_num,
        week_titles[week_num - 6] || ': ' || day_titles[week_num - 6][day_num],
        ARRAY['Learning objective 1', 'Learning objective 2', 'Learning objective 3'],
        day_num = 2 OR day_num = 4, -- Video on days 2 and 4
        TRUE,
        day_num = 3 OR day_num = 4, -- Activity on days 3 and 4
        CASE WHEN day_num = 4 THEN 25 ELSE 20 END,
        'beginner',
        'en'
      )
      ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;
    END LOOP;

    -- Friday quiz
    INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_quiz, estimated_minutes, track_level, language)
    VALUES (
      'HS',
      week_num,
      5,
      'Week ' || week_num || ' Review Quiz',
      ARRAY['Test understanding of ' || week_titles[week_num - 6]],
      TRUE,
      15,
      'beginner',
      'en'
    )
    ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- 2. COLLEGE PROGRAM - 16 WEEKS
-- ============================================

-- Week 1: Advanced Budgeting
INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_video, has_reading, has_activity, estimated_minutes, track_level, language)
VALUES
  ('COLLEGE', 1, 1, 'Zero-Based Budgeting', ARRAY['Understand zero-based approach', 'Allocate every dollar', 'Track spending categories'], FALSE, TRUE, FALSE, 20, 'beginner', 'en'),
  ('COLLEGE', 1, 2, 'Budgeting Apps and Tools', ARRAY['Compare budgeting tools', 'Set up automated tracking', 'Sync bank accounts'], FALSE, TRUE, TRUE, 20, 'beginner', 'en'),
  ('COLLEGE', 1, 3, 'College-Specific Expenses', ARRAY['Budget for tuition', 'Plan for textbooks', 'Manage housing costs'], TRUE, TRUE, FALSE, 25, 'beginner', 'en'),
  ('COLLEGE', 1, 4, 'Financial Planning Workshop', ARRAY['Create semester budget', 'Plan for emergencies', 'Set financial goals'], FALSE, TRUE, TRUE, 30, 'beginner', 'en'),
  ('COLLEGE', 1, 5, 'Week 1 Review Quiz', ARRAY['Test understanding of advanced budgeting'], FALSE, FALSE, FALSE, 15, 'beginner', 'en')
ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;

-- Generate remaining College weeks (2-16)
DO $$
DECLARE
  week_num INTEGER;
  week_titles TEXT[] := ARRAY[
    'Credit Building Strategies',      -- Week 2
    'Student Loan Mastery',            -- Week 3
    'Investment Foundations',          -- Week 4
    'Retirement Accounts',             -- Week 5
    'Tax Planning for Students',       -- Week 6
    'Career Finances',                 -- Week 7
    'Insurance Deep Dive',             -- Week 8
    'Real Estate and Renting',         -- Week 9
    'Entrepreneurship and Side Income', -- Week 10
    'Advanced Investing',              -- Week 11
    'Wealth Building Strategies',      -- Week 12
    'Financial Independence',          -- Week 13
    'Estate Planning Basics',          -- Week 14
    'Comprehensive Review',            -- Week 15
    'Final Preparation'                -- Week 16
  ];
  day_num INTEGER;
BEGIN
  FOR week_num IN 2..16 LOOP
    FOR day_num IN 1..4 LOOP
      INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_video, has_reading, has_activity, estimated_minutes, track_level, language)
      VALUES (
        'COLLEGE',
        week_num,
        day_num,
        week_titles[week_num - 1] || ': Part ' || day_num,
        ARRAY['Learning objective 1', 'Learning objective 2', 'Learning objective 3'],
        day_num = 2 OR day_num = 4,
        TRUE,
        day_num = 3 OR day_num = 4,
        CASE WHEN day_num = 4 THEN 30 ELSE 25 END,
        'beginner',
        'en'
      )
      ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;
    END LOOP;

    -- Friday quiz
    INSERT INTO modules (program_id, week_number, day_number, title, learning_objectives, has_quiz, estimated_minutes, track_level, language)
    VALUES (
      'COLLEGE',
      week_num,
      5,
      'Week ' || week_num || ' Review Quiz',
      ARRAY['Test understanding of ' || week_titles[week_num - 1]],
      TRUE,
      15,
      'beginner',
      'en'
    )
    ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- 3. UPDATE PROGRAMS TABLE WITH CORRECT WEEKS
-- ============================================

UPDATE programs SET weeks_total = 18 WHERE id = 'HS';
UPDATE programs SET weeks_total = 16 WHERE id = 'COLLEGE';

-- ============================================
-- 4. CREATE FRIDAY QUIZZES
-- ============================================

-- For each Friday module, create the quiz configuration
INSERT INTO friday_quizzes (module_id, title, description, time_limit_minutes, passing_score, max_attempts, source_module_ids, questions_per_module)
SELECT
  friday_mod.id as module_id,
  friday_mod.title,
  'Test your knowledge from this week''s four modules',
  15,
  70,
  3,
  ARRAY(
    SELECT id FROM modules
    WHERE program_id = friday_mod.program_id
      AND week_number = friday_mod.week_number
      AND day_number BETWEEN 1 AND 4
      AND (track_level = friday_mod.track_level OR track_level IS NULL)
    ORDER BY day_number
  ),
  3
FROM modules friday_mod
WHERE friday_mod.day_number = 5
  AND friday_mod.has_quiz = TRUE
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. CREATE MODULE MAP FOR LEGACY CONTENT
-- ============================================

-- Map legacy weeks to new module structure
INSERT INTO module_map (legacy_week, legacy_day, program_id, migrated, migration_notes)
SELECT
  m.week_number,
  m.day_number,
  m.program_id,
  TRUE,
  'Auto-generated module structure'
FROM modules m
WHERE m.day_number <= 4
ON CONFLICT DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary:
-- HS Program: 18 weeks × 5 days = 90 modules (72 content + 18 quizzes)
-- College Program: 16 weeks × 5 days = 80 modules (64 content + 16 quizzes)
-- Total: 170 modules created
