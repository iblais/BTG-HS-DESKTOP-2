/**
 * BTG Platform Type Definitions
 * Defines types for the new module-based curriculum structure
 */

// ============================================
// CORE ENUMS AND TYPES
// ============================================

export type ProgramId = 'HS' | 'COLLEGE';

// IMPORTANT: Intermediate level removed per restructure spec
export type TrackLevel = 'beginner' | 'advanced';

export type GradeScore = 'full' | 'half' | 'none';

export type Language = 'en' | 'es';

export type DayNumber = 1 | 2 | 3 | 4;
export type ModuleNumber = 1 | 2 | 3 | 4;

// ============================================
// MODULE TYPES
// ============================================

export interface VocabularyItem {
  term: string;
  definition: string;
}

export interface Reference {
  title: string;
  url: string;
}

export interface Module {
  id: string;
  program_id: ProgramId;
  week_number: number;
  day_number: DayNumber;
  module_number: ModuleNumber;

  // Content
  title: string;
  intro_story: string | null; // Mike's hook narrative
  lesson_content: string;
  vocabulary: VocabularyItem[];
  activity_description: string | null;
  activity_duration_minutes: number;
  assignment_prompt: string | null;
  key_points: string[];
  references: Reference[];

  // Video
  video_url: string | null;
  video_duration_seconds: number | null;
  video_transcript: string | null;

  // Metadata
  estimated_duration_minutes: number;
  difficulty_level: TrackLevel;
  language: Language;

  // Legacy mapping (for content migration)
  legacy_week_number: number | null;
  legacy_section_index: number | null;

  created_at: string;
  updated_at: string;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  enrollment_id: string | null;
  module_id: string;

  // Progress flags
  video_watched: boolean;
  video_watch_seconds: number;
  lesson_read: boolean;
  activity_completed: boolean;

  // Timing
  started_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number;

  created_at: string;
}

// Helper to check if module is complete
export function isModuleComplete(progress: ModuleProgress): boolean {
  return progress.lesson_read && progress.activity_completed;
}

// ============================================
// ASSIGNMENT TYPES
// ============================================

export interface Assignment {
  id: string;
  user_id: string;
  enrollment_id: string | null;
  module_id: string;

  // Response
  response_text: string | null;
  response_submitted_at: string | null;

  // AI Grading
  ai_score: GradeScore | null;
  ai_feedback: string | null;
  ai_graded_at: string | null;
  ai_model_used: string | null;
  ai_rubric_version: string | null;

  // Teacher Override
  teacher_score: GradeScore | null;
  teacher_feedback: string | null;
  teacher_override_at: string | null;
  teacher_id: string | null;

  // Metadata
  time_spent_seconds: number;
  attempt_number: number;

  created_at: string;
  updated_at: string;
}

// Computed final score
export function getFinalScore(assignment: Assignment): GradeScore | null {
  return assignment.teacher_score ?? assignment.ai_score;
}

// Convert grade to numeric for calculations
export function gradeToPoints(score: GradeScore | null): number {
  switch (score) {
    case 'full': return 1;
    case 'half': return 0.5;
    case 'none': return 0;
    default: return 0;
  }
}

// ============================================
// GRADING RUBRIC TYPES
// ============================================

export interface GradingRubric {
  id: string;
  module_id: string | null;
  week_number: number | null;

  rubric_name: string;
  full_credit_criteria: string;
  full_credit_example: string | null;
  half_credit_criteria: string;
  half_credit_example: string | null;
  no_credit_criteria: string;
  no_credit_example: string | null;

  required_concepts: string[];

  version: string;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// ============================================
// TEACHER & CLASS TYPES
// ============================================

export interface Teacher {
  id: string; // Same as auth.users.id
  email: string;
  display_name: string | null;
  school_name: string | null;
  district: string | null;

  can_create_classes: boolean;
  can_grade_assignments: boolean;
  can_view_analytics: boolean;

  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  teacher_id: string;

  name: string; // "Period 1", "Block A"
  program_id: ProgramId | null;
  school_year: string | null;

  // Google Classroom (future)
  google_classroom_id: string | null;
  google_classroom_link: string | null;

  join_code: string;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrollment_id: string | null;

  joined_at: string;
}

// ============================================
// QUIZ TYPES (V2)
// ============================================

export interface QuizQuestionV2 {
  id: string;
  program_id: ProgramId;
  week_number: number;

  question_text: string;
  options: string[]; // 4 options
  correct_answer_index: 0 | 1 | 2 | 3;
  explanation: string | null;

  // Source tracking
  source_module_ids: string[];
  source_day_numbers: DayNumber[];

  difficulty_level: TrackLevel;
  language: Language;

  created_at: string;
}

// ============================================
// DAILY/WEEKLY VIEW TYPES
// ============================================

export interface DayContent {
  day_number: DayNumber;
  day_name: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';
  modules: Module[];
  is_complete: boolean;
  modules_completed: number;
  total_modules: number;
}

export interface WeekContent {
  week_number: number;
  week_title: string;
  days: DayContent[];
  quiz_available: boolean; // True if all 4 days complete
  quiz_completed: boolean;
  quiz_score: number | null;
}

// Day number to name mapping
export const DAY_NAMES: Record<DayNumber, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
};

// ============================================
// TRANSLATION TYPES
// ============================================

export interface Translation {
  id: string;
  key: string;
  language: Language;
  value: string;
  context: string | null;

  created_at: string;
  updated_at: string;
}

// ============================================
// ANALYTICS TYPES (for teacher dashboard)
// ============================================

export interface StudentProgress {
  student_id: string;
  student_name: string;
  student_email: string;

  current_week: number;
  current_day: DayNumber;

  modules_completed: number;
  total_modules: number;
  completion_percentage: number;

  assignments_submitted: number;
  assignments_graded: number;
  average_score: number; // 0-1

  quizzes_passed: number;
  total_quizzes: number;
  average_quiz_score: number;

  last_activity: string | null;
}

export interface ClassAnalytics {
  class_id: string;
  class_name: string;

  total_students: number;
  active_students: number; // Active in last 7 days

  average_completion: number;
  average_assignment_score: number;
  average_quiz_score: number;

  students_behind: number; // Behind schedule
  students_on_track: number;
  students_ahead: number;

  pending_assignments: number; // Needs teacher review
}

// ============================================
// UTILITY TYPES
// ============================================

// For creating new records (omit auto-generated fields)
export type NewModule = Omit<Module, 'id' | 'created_at' | 'updated_at'>;
export type NewAssignment = Omit<Assignment, 'id' | 'created_at' | 'updated_at'>;
export type NewClass = Omit<Class, 'id' | 'join_code' | 'created_at' | 'updated_at'>;

// For updates (partial, omit id)
export type ModuleUpdate = Partial<Omit<Module, 'id' | 'created_at' | 'updated_at'>>;
export type AssignmentUpdate = Partial<Omit<Assignment, 'id' | 'created_at' | 'updated_at'>>;

// ============================================
// LEGACY COMPATIBILITY
// ============================================

// Maps old section index to new day/module
export interface LegacyMapping {
  old_week: number;
  old_section_index: number;
  new_week: number;
  new_day: DayNumber;
  new_module: ModuleNumber;
}

// Helper to convert legacy progress
export function mapLegacySectionToModule(
  _weekNumber: number,
  sectionIndex: number
): { day: DayNumber; module: ModuleNumber } {
  // Old structure: ~5 sections per week
  // New structure: 4 days × 4 modules = 16 modules
  // Simple mapping: section 0-3 → day 1, section 4-7 → day 2, etc.
  const day = (Math.floor(sectionIndex / 4) + 1) as DayNumber;
  const module = ((sectionIndex % 4) + 1) as ModuleNumber;

  return {
    day: Math.min(day, 4) as DayNumber,
    module: Math.min(module, 4) as ModuleNumber,
  };
}
