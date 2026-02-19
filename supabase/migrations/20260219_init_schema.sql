-- Initial Schema for Beyond The Game
-- Based on src/lib/supabase.ts types

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Programs Table
CREATE TABLE IF NOT EXISTS programs (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  weeks_total integer NOT NULL,
  target_audience text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Programs RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public programs access" ON programs FOR SELECT USING (true);

-- 2. Users Table (Public profile linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  username text UNIQUE,
  avatar_url text,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  show_level_on_profile boolean DEFAULT true,
  notification_push boolean DEFAULT true,
  notification_course_reminders boolean DEFAULT true,
  notification_streak_reminders boolean DEFAULT true,
  notification_achievement_alerts boolean DEFAULT true,
  notification_product_updates boolean DEFAULT true,
  notification_quiet_start text,
  notification_quiet_end text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Users RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  program_id text REFERENCES programs(id) NOT NULL,
  track_level text DEFAULT 'beginner',
  language text DEFAULT 'en',
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enrollments RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own enrollments" ON enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own enrollments" ON enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own enrollments" ON enrollments FOR UPDATE USING (auth.uid() = user_id);

-- 4. Course Progress
CREATE TABLE IF NOT EXISTS course_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  completed boolean DEFAULT false,
  lesson_completed boolean DEFAULT false,
  quiz_completed boolean DEFAULT false,
  quiz_attempts integer DEFAULT 0,
  best_quiz_score integer,
  score integer,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, enrollment_id, week_number)
);

ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own course progress" ON course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own course progress" ON course_progress FOR ALL USING (auth.uid() = user_id);

-- 5. Lesson Progress
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  week_number integer NOT NULL,
  section_index integer NOT NULL,
  completed boolean DEFAULT false,
  time_spent_seconds integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, enrollment_id, week_number, section_index)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own lesson progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own lesson progress" ON lesson_progress FOR ALL USING (auth.uid() = user_id);

-- 6. Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  week_number integer NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  passed boolean DEFAULT false,
  time_taken_seconds integer,
  answers jsonb,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own quiz attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own quiz attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Game Scores
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE SET NULL,
  game_type text NOT NULL,
  score integer NOT NULL,
  completed boolean DEFAULT false,
  session_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own game scores" ON game_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own game scores" ON game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE SET NULL,
  achievement_type text NOT NULL,
  progress_data jsonb,
  unlocked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own achievements" ON achievements FOR SELECT USING (auth.uid() = user_id);

-- 9. Weekly Goals
CREATE TABLE IF NOT EXISTS weekly_goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) NOT NULL,
  week_number integer NOT NULL,
  goal_type text NOT NULL,
  target_value integer NOT NULL,
  current_value integer DEFAULT 0,
  completed boolean DEFAULT false,
  week_start_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON weekly_goals FOR ALL USING (auth.uid() = user_id);

-- 10. Bitcoin Simulator
CREATE TABLE IF NOT EXISTS bitcoin_simulator (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  balance numeric DEFAULT 100000,
  btc_holdings numeric DEFAULT 0,
  starting_balance numeric DEFAULT 100000,
  total_profit numeric DEFAULT 0,
  total_loss numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bitcoin_simulator ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own simulator" ON bitcoin_simulator FOR ALL USING (auth.uid() = user_id);

-- 11. Bitcoin Trades
CREATE TABLE IF NOT EXISTS bitcoin_trades (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  simulator_id uuid REFERENCES bitcoin_simulator(id) ON DELETE SET NULL,
  trade_type text NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  btc_amount numeric NOT NULL,
  price_per_btc numeric NOT NULL,
  total_usd numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bitcoin_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trades" ON bitcoin_trades FOR ALL USING (auth.uid() = user_id);

-- 12. Quiz Progress
CREATE TABLE IF NOT EXISTS quiz_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE SET NULL,
  week_number integer NOT NULL,
  current_question_index integer DEFAULT 0,
  answers jsonb,
  started_at timestamptz DEFAULT now(),
  time_spent_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own quiz progress" ON quiz_progress FOR ALL USING (auth.uid() = user_id);

-- 13. Game Progress
CREATE TABLE IF NOT EXISTS game_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  game_id text NOT NULL,
  game_data jsonb,
  started_at timestamptz DEFAULT now(),
  last_played_at timestamptz DEFAULT now(),
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own game progress" ON game_progress FOR ALL USING (auth.uid() = user_id);

-- Insert Default HS Program
INSERT INTO programs (id, title, description, weeks_total, target_audience)
VALUES (
  'HS',
  'High School Financial Literacy',
  'Comprehensive financial literacy curriculum for high school students.',
  18,
  'High School Students'
) ON CONFLICT (id) DO NOTHING;

-- Trigger to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

