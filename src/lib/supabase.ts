import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Program Types
export type ProgramId = 'HS' | 'COLLEGE';
export type TrackLevel = 'beginner' | 'advanced';
export type Language = 'en' | 'es';

// Database Types
export interface Database {
  public: {
    Tables: {
      programs: {
        Row: {
          id: string
          title: string
          description: string | null
          weeks_total: number
          target_audience: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          weeks_total: number
          target_audience?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          weeks_total?: number
          target_audience?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          program_id: string
          track_level: string
          language: string
          enrolled_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          program_id: string
          track_level?: string
          language?: string
          enrolled_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          program_id?: string
          track_level?: string
          language?: string
          enrolled_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          display_name: string | null
          username: string | null
          avatar_url: string | null
          xp: number
          level: number
          streak_days: number
          last_active: string
          show_level_on_profile: boolean
          notification_push: boolean
          notification_course_reminders: boolean
          notification_streak_reminders: boolean
          notification_achievement_alerts: boolean
          notification_product_updates: boolean
          notification_quiet_start: string | null
          notification_quiet_end: string | null
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          username?: string | null
          avatar_url?: string | null
          xp?: number
          level?: number
          streak_days?: number
          last_active?: string
          show_level_on_profile?: boolean
          notification_push?: boolean
          notification_course_reminders?: boolean
          notification_streak_reminders?: boolean
          notification_achievement_alerts?: boolean
          notification_product_updates?: boolean
          notification_quiet_start?: string | null
          notification_quiet_end?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          display_name?: string | null
          username?: string | null
          avatar_url?: string | null
          xp?: number
          level?: number
          streak_days?: number
          last_active?: string
          show_level_on_profile?: boolean
          notification_push?: boolean
          notification_course_reminders?: boolean
          notification_streak_reminders?: boolean
          notification_achievement_alerts?: boolean
          notification_product_updates?: boolean
          notification_quiet_start?: string | null
          notification_quiet_end?: string | null
        }
      }
      course_progress: {
        Row: {
          id: string
          user_id: string
          enrollment_id: string | null
          week_number: number
          completed: boolean
          lesson_completed: boolean
          quiz_completed: boolean
          quiz_attempts: number
          best_quiz_score: number | null
          score: number | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enrollment_id?: string | null
          week_number: number
          completed?: boolean
          lesson_completed?: boolean
          quiz_completed?: boolean
          quiz_attempts?: number
          best_quiz_score?: number | null
          score?: number | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enrollment_id?: string | null
          week_number?: number
          completed?: boolean
          lesson_completed?: boolean
          quiz_completed?: boolean
          quiz_attempts?: number
          best_quiz_score?: number | null
          score?: number | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lesson_progress: {
        Row: {
          id: string
          user_id: string
          enrollment_id: string
          week_number: number
          section_index: number
          completed: boolean
          time_spent_seconds: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enrollment_id: string
          week_number: number
          section_index: number
          completed?: boolean
          time_spent_seconds?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enrollment_id?: string
          week_number?: number
          section_index?: number
          completed?: boolean
          time_spent_seconds?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          enrollment_id: string
          week_number: number
          score: number
          total_questions: number
          passed: boolean
          time_taken_seconds: number | null
          answers: unknown // JSONB
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enrollment_id: string
          week_number: number
          score: number
          total_questions: number
          passed: boolean
          time_taken_seconds?: number | null
          answers?: unknown
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enrollment_id?: string
          week_number?: number
          score?: number
          total_questions?: number
          passed?: boolean
          time_taken_seconds?: number | null
          answers?: unknown
          completed_at?: string
          created_at?: string
        }
      }
      game_scores: {
        Row: {
          id: string
          user_id: string
          enrollment_id: string | null
          game_type: string
          score: number
          completed: boolean
          session_data: unknown | null // JSONB
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enrollment_id?: string | null
          game_type: string
          score: number
          completed?: boolean
          session_data?: unknown | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enrollment_id?: string | null
          game_type?: string
          score?: number
          completed?: boolean
          session_data?: unknown | null
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          enrollment_id: string | null
          achievement_type: string
          progress_data: unknown | null // JSONB
          unlocked_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enrollment_id?: string | null
          achievement_type: string
          progress_data?: unknown | null
          unlocked_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enrollment_id?: string | null
          achievement_type?: string
          progress_data?: unknown | null
          unlocked_at?: string
          created_at?: string
        }
      }
      weekly_goals: {
        Row: {
          id: string
          user_id: string
          enrollment_id: string
          week_number: number
          goal_type: string
          target_value: number
          current_value: number
          completed: boolean
          week_start_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enrollment_id: string
          week_number: number
          goal_type: string
          target_value: number
          current_value?: number
          completed?: boolean
          week_start_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enrollment_id?: string
          week_number?: number
          goal_type?: string
          target_value?: number
          current_value?: number
          completed?: boolean
          week_start_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      bitcoin_simulator: {
        Row: {
          id: string
          user_id: string
          balance: number
          btc_holdings: number
          starting_balance: number
          total_profit: number
          total_loss: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          btc_holdings?: number
          starting_balance?: number
          total_profit?: number
          total_loss?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          btc_holdings?: number
          starting_balance?: number
          total_profit?: number
          total_loss?: number
          created_at?: string
          updated_at?: string
        }
      }
      bitcoin_trades: {
        Row: {
          id: string
          user_id: string
          simulator_id: string | null
          trade_type: 'buy' | 'sell'
          btc_amount: number
          price_per_btc: number
          total_usd: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          simulator_id?: string | null
          trade_type: 'buy' | 'sell'
          btc_amount: number
          price_per_btc: number
          total_usd: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          simulator_id?: string | null
          trade_type?: 'buy' | 'sell'
          btc_amount?: number
          price_per_btc?: number
          total_usd?: number
          created_at?: string
        }
      }
      quiz_progress: {
        Row: {
          id: string
          user_id: string
          enrollment_id: string | null
          week_number: number
          current_question_index: number
          answers: Record<number, number>
          started_at: string
          time_spent_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          enrollment_id?: string | null
          week_number: number
          current_question_index?: number
          answers?: Record<number, number>
          started_at?: string
          time_spent_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          enrollment_id?: string | null
          week_number?: number
          current_question_index?: number
          answers?: Record<number, number>
          started_at?: string
          time_spent_seconds?: number
          created_at?: string
          updated_at?: string
        }
      }
      game_progress: {
        Row: {
          id: string
          user_id: string
          game_id: string
          game_data: unknown
          started_at: string
          last_played_at: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          game_data?: unknown
          started_at?: string
          last_played_at?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          game_data?: unknown
          started_at?: string
          last_played_at?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
