/**
 * Quiz Attempt Tracking for BTG Platform
 * Tracks quiz attempts, stores results, and enables retakes
 */

import { supabase } from './supabase';
import { getCurrentUser } from './auth';

// ============================================
// TYPES
// ============================================

export interface QuizAttemptRecord {
  id: string;
  week_number: number;
  program_id: string;
  attempt_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  time_spent_seconds: number;
  answers: QuizAnswer[];
  started_at: string;
  completed_at: string;
}

export interface QuizAnswer {
  question_id: number;
  question_text: string;
  user_answer: number;
  correct_answer: number;
  is_correct: boolean;
  explanation?: string;
}

export interface QuizStats {
  total_attempts: number;
  best_score: number;
  best_percentage: number;
  passed: boolean;
  first_attempt_at: string | null;
  last_attempt_at: string | null;
  average_score: number;
}

// Local storage keys
const QUIZ_ATTEMPTS_KEY = 'btg_quiz_attempts';
const CURRENT_ATTEMPT_KEY = 'btg_current_quiz_attempt';

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

function getLocalAttempts(): QuizAttemptRecord[] {
  try {
    const stored = localStorage.getItem(QUIZ_ATTEMPTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalAttempts(attempts: QuizAttemptRecord[]): void {
  try {
    localStorage.setItem(QUIZ_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    // Ignore storage errors
  }
}

// ============================================
// ATTEMPT TRACKING
// ============================================

/**
 * Start a new quiz attempt
 */
export async function startQuizAttempt(
  weekNumber: number,
  programId: string = 'HS'
): Promise<{ attemptNumber: number; attemptId: string }> {
  const user = await getCurrentUser();
  const userId = user?.id || 'anonymous';

  // Get existing attempts to determine attempt number
  const existingAttempts = await getQuizAttempts(weekNumber, programId);
  const attemptNumber = existingAttempts.length + 1;

  const attemptId = `${userId}-${programId}-W${weekNumber}-A${attemptNumber}-${Date.now()}`;

  // Store current attempt in progress
  const currentAttempt = {
    id: attemptId,
    week_number: weekNumber,
    program_id: programId,
    attempt_number: attemptNumber,
    started_at: new Date().toISOString(),
    user_id: userId,
  };

  try {
    localStorage.setItem(CURRENT_ATTEMPT_KEY, JSON.stringify(currentAttempt));
  } catch {
    // Ignore
  }

  return { attemptNumber, attemptId };
}

/**
 * Complete a quiz attempt
 */
export async function completeQuizAttempt(
  weekNumber: number,
  programId: string,
  score: number,
  totalQuestions: number,
  passed: boolean,
  answers: QuizAnswer[],
  timeSpentSeconds: number
): Promise<QuizAttemptRecord> {
  const user = await getCurrentUser();
  const userId = user?.id || 'anonymous';

  // Get current attempt info
  let attemptNumber = 1;
  let attemptId = '';
  let startedAt = new Date().toISOString();

  try {
    const currentAttempt = localStorage.getItem(CURRENT_ATTEMPT_KEY);
    if (currentAttempt) {
      const parsed = JSON.parse(currentAttempt);
      if (parsed.week_number === weekNumber && parsed.program_id === programId) {
        attemptNumber = parsed.attempt_number;
        attemptId = parsed.id;
        startedAt = parsed.started_at;
      }
    }
  } catch {
    // Use defaults
  }

  if (!attemptId) {
    attemptId = `${userId}-${programId}-W${weekNumber}-A${attemptNumber}-${Date.now()}`;
  }

  const percentage = Math.round((score / totalQuestions) * 100);

  const record: QuizAttemptRecord = {
    id: attemptId,
    week_number: weekNumber,
    program_id: programId,
    attempt_number: attemptNumber,
    score,
    total_questions: totalQuestions,
    percentage,
    passed,
    time_spent_seconds: timeSpentSeconds,
    answers,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
  };

  // Save to local storage
  const attempts = getLocalAttempts();
  attempts.push(record);
  saveLocalAttempts(attempts);

  // Clear current attempt
  try {
    localStorage.removeItem(CURRENT_ATTEMPT_KEY);
  } catch {
    // Ignore
  }

  // Try to save to database
  if (user) {
    try {
      await supabase.from('quiz_attempts').insert({
        user_id: user.id,
        friday_quiz_id: null, // Will be linked when new quiz system is active
        attempt_number: attemptNumber,
        score: percentage,
        correct_count: score,
        total_questions: totalQuestions,
        passed,
        answers: answers as unknown as Record<string, unknown>,
        time_spent_seconds: timeSpentSeconds,
        started_at: startedAt,
        completed_at: record.completed_at,
      });
    } catch (error) {
      console.warn('[QuizTracking] Failed to save to database:', error);
    }
  }

  return record;
}

/**
 * Get all attempts for a specific week
 */
export async function getQuizAttempts(
  weekNumber: number,
  programId: string = 'HS'
): Promise<QuizAttemptRecord[]> {
  // Get from local storage first
  const localAttempts = getLocalAttempts().filter(
    (a) => a.week_number === weekNumber && a.program_id === programId
  );

  // Try to fetch from database
  const user = await getCurrentUser();
  if (user) {
    try {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('attempt_number', { ascending: true });

      if (data && data.length > 0) {
        // Merge with local (database is source of truth)
        return data.map((d: any) => ({
          id: d.id,
          week_number: weekNumber,
          program_id: programId,
          attempt_number: d.attempt_number,
          score: d.correct_count || 0,
          total_questions: d.total_questions || 0,
          percentage: d.score || 0,
          passed: d.passed || false,
          time_spent_seconds: d.time_spent_seconds || 0,
          answers: d.answers || [],
          started_at: d.started_at,
          completed_at: d.completed_at,
        }));
      }
    } catch {
      // Use local data
    }
  }

  return localAttempts;
}

/**
 * Get quiz stats for a specific week
 */
export async function getQuizStats(
  weekNumber: number,
  programId: string = 'HS'
): Promise<QuizStats> {
  const attempts = await getQuizAttempts(weekNumber, programId);

  if (attempts.length === 0) {
    return {
      total_attempts: 0,
      best_score: 0,
      best_percentage: 0,
      passed: false,
      first_attempt_at: null,
      last_attempt_at: null,
      average_score: 0,
    };
  }

  const bestAttempt = attempts.reduce((best, current) =>
    current.percentage > best.percentage ? current : best
  );

  const totalScore = attempts.reduce((sum, a) => sum + a.percentage, 0);

  return {
    total_attempts: attempts.length,
    best_score: bestAttempt.score,
    best_percentage: bestAttempt.percentage,
    passed: attempts.some((a) => a.passed),
    first_attempt_at: attempts[0]?.started_at || null,
    last_attempt_at: attempts[attempts.length - 1]?.completed_at || null,
    average_score: Math.round(totalScore / attempts.length),
  };
}

/**
 * Get missed questions from the last attempt
 */
export async function getMissedQuestions(
  weekNumber: number,
  programId: string = 'HS'
): Promise<QuizAnswer[]> {
  const attempts = await getQuizAttempts(weekNumber, programId);
  if (attempts.length === 0) return [];

  const lastAttempt = attempts[attempts.length - 1];
  return lastAttempt.answers.filter((a) => !a.is_correct);
}

/**
 * Check if user can retake quiz (unlimited retakes until passed)
 */
export async function canRetakeQuiz(
  weekNumber: number,
  programId: string = 'HS',
  maxAttempts: number | null = null
): Promise<{ canRetake: boolean; reason: string; attemptsRemaining: number | null }> {
  const stats = await getQuizStats(weekNumber, programId);

  // Already passed - no need to retake
  if (stats.passed) {
    return {
      canRetake: false,
      reason: 'Quiz already passed!',
      attemptsRemaining: null,
    };
  }

  // Check max attempts if specified
  if (maxAttempts !== null && stats.total_attempts >= maxAttempts) {
    return {
      canRetake: false,
      reason: `Maximum attempts (${maxAttempts}) reached`,
      attemptsRemaining: 0,
    };
  }

  // Can retake
  return {
    canRetake: true,
    reason: 'Ready to retake',
    attemptsRemaining: maxAttempts !== null ? maxAttempts - stats.total_attempts : null,
  };
}

/**
 * Clear all local quiz data (for testing/development)
 */
export function clearLocalQuizData(): void {
  try {
    localStorage.removeItem(QUIZ_ATTEMPTS_KEY);
    localStorage.removeItem(CURRENT_ATTEMPT_KEY);
  } catch {
    // Ignore
  }
}

export default {
  startQuizAttempt,
  completeQuizAttempt,
  getQuizAttempts,
  getQuizStats,
  getMissedQuestions,
  canRetakeQuiz,
  clearLocalQuizData,
};
