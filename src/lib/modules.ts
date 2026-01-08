/**
 * Module Content System for BTG Platform
 * Handles the new 5-day × 4-module structure
 */

import { supabase } from './supabase';
import type { ProgramId, TrackLevel, Language, DayNumber, Module, ModuleProgress, WeekContent, DayContent } from './types';

// ============================================
// TYPES
// ============================================

export interface ModuleContent {
  id: string;
  module_id: string;
  content_type: 'reading' | 'video' | 'activity' | 'resource';
  content_order: number;
  title: string;
  content_html: string | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  video_duration_seconds: number | null;
  activity_type: string | null;
  activity_data: Record<string, unknown> | null;
}

export interface FridayQuiz {
  id: string;
  module_id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  max_attempts: number | null;
  source_module_ids: string[];
  questions_per_module: number;
}

export interface QuizQuestion {
  id: string;
  module_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options: Array<{ id: string; text: string; isCorrect: boolean }> | null;
  correct_answer: string | null;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  friday_quiz_id: string;
  attempt_number: number;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  correct_count: number | null;
  total_questions: number | null;
  passed: boolean | null;
  answers: Array<{ questionId: string; answer: string; isCorrect: boolean }> | null;
  time_spent_seconds: number | null;
}

// ============================================
// MODULE FETCHING
// ============================================

/**
 * Get all modules for a specific week
 */
export async function getWeekModules(
  programId: ProgramId,
  weekNumber: number,
  trackLevel?: TrackLevel,
  language: Language = 'en'
): Promise<Module[]> {
  const { data, error } = await supabase.rpc('get_week_modules', {
    p_program_id: programId,
    p_week_number: weekNumber,
    p_track_level: trackLevel || null,
    p_language: language,
  });

  if (error) {
    console.error('[Modules] Error fetching week modules:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single module by ID
 */
export async function getModule(moduleId: string): Promise<Module | null> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (error) {
    console.error('[Modules] Error fetching module:', error);
    return null;
  }

  return data;
}

/**
 * Get module content
 */
export async function getModuleContent(moduleId: string): Promise<ModuleContent[]> {
  const { data, error } = await supabase
    .from('module_content')
    .select('*')
    .eq('module_id', moduleId)
    .order('content_order');

  if (error) {
    console.error('[Modules] Error fetching module content:', error);
    return [];
  }

  return data || [];
}

// ============================================
// PROGRESS TRACKING
// ============================================

/**
 * Get user's progress for a module
 */
export async function getModuleProgress(
  userId: string,
  moduleId: string
): Promise<ModuleProgress | null> {
  const { data, error } = await supabase
    .from('user_module_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[Modules] Error fetching progress:', error);
  }

  return data || null;
}

/**
 * Start or update module progress
 */
export async function updateModuleProgress(
  userId: string,
  moduleId: string,
  updates: Partial<ModuleProgress>
): Promise<void> {
  const { error } = await supabase
    .from('user_module_progress')
    .upsert({
      user_id: userId,
      module_id: moduleId,
      ...updates,
    }, {
      onConflict: 'user_id,module_id',
    });

  if (error) {
    console.error('[Modules] Error updating progress:', error);
  }
}

/**
 * Mark a module as complete
 */
export async function completeModule(
  userId: string,
  moduleId: string
): Promise<void> {
  await updateModuleProgress(userId, moduleId, {
    completed_at: new Date().toISOString(),
  } as Partial<ModuleProgress>);
}

/**
 * Get all progress for a week
 */
export async function getWeekProgress(
  userId: string,
  programId: ProgramId,
  weekNumber: number
): Promise<Map<string, ModuleProgress>> {
  const { data, error } = await supabase
    .from('user_module_progress')
    .select(`
      *,
      modules!inner(program_id, week_number)
    `)
    .eq('user_id', userId)
    .eq('modules.program_id', programId)
    .eq('modules.week_number', weekNumber);

  if (error) {
    console.error('[Modules] Error fetching week progress:', error);
    return new Map();
  }

  const progressMap = new Map<string, ModuleProgress>();
  (data || []).forEach((p: ModuleProgress) => {
    progressMap.set(p.module_id, p);
  });

  return progressMap;
}

// ============================================
// QUIZ FUNCTIONS
// ============================================

/**
 * Check if user can take Friday quiz (completed days 1-4)
 */
export async function canTakeFridayQuiz(
  userId: string,
  programId: ProgramId,
  weekNumber: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_take_friday_quiz', {
    p_user_id: userId,
    p_program_id: programId,
    p_week_number: weekNumber,
  });

  if (error) {
    console.error('[Modules] Error checking quiz eligibility:', error);
    return false;
  }

  return data === true;
}

/**
 * Get Friday quiz for a week
 */
export async function getFridayQuiz(
  programId: ProgramId,
  weekNumber: number
): Promise<FridayQuiz | null> {
  const { data, error } = await supabase
    .from('friday_quizzes')
    .select(`
      *,
      modules!inner(program_id, week_number, day_number)
    `)
    .eq('modules.program_id', programId)
    .eq('modules.week_number', weekNumber)
    .eq('modules.day_number', 5)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[Modules] Error fetching Friday quiz:', error);
    }
    return null;
  }

  return data;
}

/**
 * Get quiz questions for a Friday quiz
 */
export async function getQuizQuestions(
  fridayQuizId: string
): Promise<QuizQuestion[]> {
  const quiz = await supabase
    .from('friday_quizzes')
    .select('source_module_ids, questions_per_module')
    .eq('id', fridayQuizId)
    .single();

  if (quiz.error || !quiz.data) {
    return [];
  }

  const { source_module_ids, questions_per_module } = quiz.data;

  // Get random questions from each source module
  const allQuestions: QuizQuestion[] = [];

  for (const moduleId of source_module_ids) {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('module_id', moduleId)
      .limit(questions_per_module);

    if (!error && data) {
      allQuestions.push(...data);
    }
  }

  // Shuffle questions
  return allQuestions.sort(() => Math.random() - 0.5);
}

/**
 * Get user's quiz attempts for a week
 */
export async function getQuizAttempts(
  userId: string,
  programId: ProgramId,
  weekNumber: number
): Promise<QuizAttempt[]> {
  const { data, error } = await supabase.rpc('get_quiz_attempts', {
    p_user_id: userId,
    p_program_id: programId,
    p_week_number: weekNumber,
  });

  if (error) {
    console.error('[Modules] Error fetching quiz attempts:', error);
    return [];
  }

  return data || [];
}

/**
 * Start a new quiz attempt
 */
export async function startQuizAttempt(
  userId: string,
  fridayQuizId: string
): Promise<QuizAttempt | null> {
  // Get current attempt count
  const { data: existing } = await supabase
    .from('quiz_attempts')
    .select('attempt_number')
    .eq('user_id', userId)
    .eq('friday_quiz_id', fridayQuizId)
    .order('attempt_number', { ascending: false })
    .limit(1);

  const nextAttempt = (existing?.[0]?.attempt_number || 0) + 1;

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      user_id: userId,
      friday_quiz_id: fridayQuizId,
      attempt_number: nextAttempt,
    })
    .select()
    .single();

  if (error) {
    console.error('[Modules] Error starting quiz attempt:', error);
    return null;
  }

  return data;
}

/**
 * Submit quiz answers
 */
export async function submitQuizAttempt(
  attemptId: string,
  answers: Array<{ questionId: string; answer: string; isCorrect: boolean }>,
  score: number,
  passed: boolean,
  timeSpentSeconds: number
): Promise<void> {
  const { error } = await supabase
    .from('quiz_attempts')
    .update({
      completed_at: new Date().toISOString(),
      answers,
      score,
      correct_count: answers.filter((a) => a.isCorrect).length,
      total_questions: answers.length,
      passed,
      time_spent_seconds: timeSpentSeconds,
    })
    .eq('id', attemptId);

  if (error) {
    console.error('[Modules] Error submitting quiz:', error);
  }
}

// ============================================
// WEEK CONTENT BUILDER
// ============================================

/**
 * Build complete week content structure for display
 */
export async function buildWeekContent(
  userId: string,
  programId: ProgramId,
  weekNumber: number,
  trackLevel: TrackLevel,
  language: Language = 'en'
): Promise<WeekContent | null> {
  // Get all modules for the week
  const modules = await getWeekModules(programId, weekNumber, trackLevel, language);
  if (modules.length === 0) return null;

  // Get progress for all modules
  const progressMap = await getWeekProgress(userId, programId, weekNumber);

  // Build day content
  const days: DayContent[] = [];
  for (let day = 1; day <= 4; day++) {
    const dayModules = modules.filter((m) => m.day_number === day);
    const dayProgress = dayModules.map((m) => progressMap.get(m.id));
    const completedCount = dayProgress.filter((p) => p?.completed_at).length;

    days.push({
      day_number: day as DayNumber,
      day_name: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'][day - 1] as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday',
      modules: dayModules,
      is_complete: completedCount === dayModules.length && dayModules.length > 0,
      modules_completed: completedCount,
      total_modules: dayModules.length,
    });
  }

  // Check quiz status
  const quizAvailable = days.every((d) => d.is_complete);
  const attempts = await getQuizAttempts(userId, programId, weekNumber);
  const lastAttempt = attempts[attempts.length - 1];
  const quizCompleted = lastAttempt?.passed === true;

  return {
    week_number: weekNumber,
    week_title: `Week ${weekNumber}`,
    days,
    quiz_available: quizAvailable,
    quiz_completed: quizCompleted,
    quiz_score: lastAttempt?.score || null,
  };
}

// ============================================
// LEGACY CONTENT MIGRATION HELPER
// ============================================

interface LegacySection {
  title: string;
  type: 'reading' | 'video' | 'interactive';
  duration: string;
  content: string;
  keyPoints: string[];
}

interface LegacyWeek {
  title: string;
  sections: LegacySection[];
}

/**
 * Convert legacy section content to new module format
 * This is used during migration to transform existing content
 */
export function convertLegacySectionToModule(
  programId: ProgramId,
  weekNumber: number,
  sectionIndex: number,
  section: LegacySection,
  trackLevel: TrackLevel = 'beginner',
  language: Language = 'en'
): Partial<Module> {
  // Map section index to day (0-3 → day 1, 4-7 → day 2, etc.)
  const dayNumber = Math.min(Math.floor(sectionIndex / 1) + 1, 4) as DayNumber;
  const moduleNumber = ((sectionIndex % 4) + 1) as 1 | 2 | 3 | 4;

  // Parse duration string to minutes
  const durationMatch = section.duration.match(/(\d+)/);
  const durationMinutes = durationMatch ? parseInt(durationMatch[1], 10) : 30;

  return {
    program_id: programId,
    week_number: weekNumber,
    day_number: dayNumber,
    module_number: moduleNumber,
    title: section.title,
    intro_story: null,
    lesson_content: section.content,
    vocabulary: [],
    activity_description: section.type === 'interactive' ? section.content : null,
    activity_duration_minutes: section.type === 'interactive' ? durationMinutes : 0,
    assignment_prompt: null,
    key_points: section.keyPoints,
    references: [],
    video_url: section.type === 'video' ? null : null, // Would need to be added separately
    video_duration_seconds: null,
    video_transcript: section.type === 'video' ? section.content : null,
    estimated_duration_minutes: durationMinutes,
    difficulty_level: trackLevel,
    language,
    legacy_week_number: weekNumber,
    legacy_section_index: sectionIndex,
  };
}

/**
 * Generate migration SQL for populating modules from legacy content
 * This creates the INSERT statements needed to migrate content
 */
export function generateMigrationSQL(
  programId: ProgramId,
  weekNumber: number,
  legacyWeek: LegacyWeek,
  trackLevel: TrackLevel = 'beginner'
): string {
  const statements: string[] = [];

  // Create module for each section (up to 4 per week)
  const sectionsToMigrate = legacyWeek.sections.slice(0, 4);

  sectionsToMigrate.forEach((section, index) => {
    const dayNumber = index + 1;
    const escapedTitle = section.title.replace(/'/g, "''");
    const escapedKeyPoints = JSON.stringify(section.keyPoints).replace(/'/g, "''");

    const hasVideo = section.type === 'video';
    const hasActivity = section.type === 'interactive';

    statements.push(`
INSERT INTO modules (
  program_id, week_number, day_number,
  title, learning_objectives,
  has_video, has_reading, has_activity,
  estimated_minutes, track_level, language
) VALUES (
  '${programId}', ${weekNumber}, ${dayNumber},
  '${escapedTitle}', ARRAY${escapedKeyPoints}::TEXT[],
  ${hasVideo}, TRUE, ${hasActivity},
  ${parseInt(section.duration) || 30}, '${trackLevel}', 'en'
) ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;
`);
  });

  // Add Friday quiz module
  statements.push(`
INSERT INTO modules (
  program_id, week_number, day_number,
  title, description,
  has_quiz,
  estimated_minutes, track_level, language
) VALUES (
  '${programId}', ${weekNumber}, 5,
  'Week ${weekNumber} Review Quiz', 'Test your knowledge from this week''s modules',
  TRUE,
  15, '${trackLevel}', 'en'
) ON CONFLICT (program_id, week_number, day_number, track_level, language) DO NOTHING;
`);

  return statements.join('\n');
}

export default {
  getWeekModules,
  getModule,
  getModuleContent,
  getModuleProgress,
  updateModuleProgress,
  completeModule,
  getWeekProgress,
  canTakeFridayQuiz,
  getFridayQuiz,
  getQuizQuestions,
  getQuizAttempts,
  startQuizAttempt,
  submitQuizAttempt,
  buildWeekContent,
};
