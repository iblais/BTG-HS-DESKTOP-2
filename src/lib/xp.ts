import { supabase } from './supabase';
import { getCurrentUser } from './auth';

// XP values for different actions
export const XP_VALUES = {
  COMPLETE_LESSON: 10,
  COMPLETE_WRITING: 25,
  PASS_QUIZ: 50,
  COMPLETE_WEEK_BONUS: 100,
  PLAY_GAME: 15,
  COMPLETE_GAME: 30,
  PERFECT_QUIZ_BONUS: 25,
  COMPLETE_FINAL_EXAM: 500,
} as const;

// Level thresholds - each level requires 2x the previous
export const LEVEL_THRESHOLDS = [
  0,      // Level 1: 0-99
  100,    // Level 2: 100-249
  250,    // Level 3: 250-499
  500,    // Level 4: 500-999
  1000,   // Level 5: 1000-1999
  2000,   // Level 6: 2000-3999
  4000,   // Level 7: 4000-7999
  8000,   // Level 8: 8000-15999
  16000,  // Level 9: 16000-31999
  32000,  // Level 10: 32000+
];

export type XPAction =
  | 'complete_lesson'
  | 'complete_writing'
  | 'pass_quiz'
  | 'complete_week'
  | 'play_game'
  | 'complete_game'
  | 'perfect_quiz'
  | 'complete_final_exam';

/**
 * Calculate XP for a specific action
 */
export function calculateXP(action: XPAction, data?: { score?: number; percentage?: number }): number {
  switch (action) {
    case 'complete_lesson':
      return XP_VALUES.COMPLETE_LESSON;
    case 'complete_writing':
      return XP_VALUES.COMPLETE_WRITING;
    case 'pass_quiz': {
      // Base XP for passing, plus bonus for perfect score
      let quizXP = XP_VALUES.PASS_QUIZ;
      if (data?.percentage === 100 || data?.score === 10) {
        quizXP += XP_VALUES.PERFECT_QUIZ_BONUS;
      }
      return quizXP;
    }
    case 'complete_week':
      return XP_VALUES.COMPLETE_WEEK_BONUS;
    case 'play_game':
      return XP_VALUES.PLAY_GAME;
    case 'complete_game':
      return XP_VALUES.COMPLETE_GAME;
    case 'perfect_quiz':
      return XP_VALUES.PERFECT_QUIZ_BONUS;
    case 'complete_final_exam':
      return XP_VALUES.COMPLETE_FINAL_EXAM;
    default:
      return 0;
  }
}

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP required for the next level
 */
export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    // After max level, each level requires 2x the last threshold
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * Math.pow(2, currentLevel - LEVEL_THRESHOLDS.length + 1);
  }
  return LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}

/**
 * Get XP progress within current level (0-100%)
 */
export function getLevelProgress(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextLevelThreshold = getXPForNextLevel(currentLevel);

  const xpInLevel = totalXP - currentLevelThreshold;
  const xpNeeded = nextLevelThreshold - currentLevelThreshold;

  return Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));
}

/**
 * Award XP to the current user
 */
export async function awardXP(action: XPAction, data?: { score?: number; percentage?: number }): Promise<{
  success: boolean;
  xpAwarded: number;
  newTotal: number;
  newLevel: number;
  leveledUp: boolean;
  previousLevel: number;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, xpAwarded: 0, newTotal: 0, newLevel: 1, leveledUp: false, previousLevel: 1 };
    }

    const xpToAward = calculateXP(action, data);

    // Get current XP from profiles table (id = user.id)
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('total_xp, current_level')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return { success: false, xpAwarded: 0, newTotal: 0, newLevel: 1, leveledUp: false, previousLevel: 1 };
    }

    const currentXP = profile?.total_xp || 0;
    const previousLevel = profile?.current_level || calculateLevel(currentXP);
    const newTotal = currentXP + xpToAward;
    const newLevel = calculateLevel(newTotal);
    const leveledUp = newLevel > previousLevel;

    // Upsert profile with new XP (id is the user id)
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        total_xp: newTotal,
        current_level: newLevel,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (updateError) {
      console.error('Error updating XP:', updateError);
      return { success: false, xpAwarded: 0, newTotal: currentXP, newLevel: previousLevel, leveledUp: false, previousLevel };
    }

    // Log XP event for history
    await supabase
      .from('xp_history')
      .insert({
        user_id: user.id,
        action: action,
        xp_amount: xpToAward,
        created_at: new Date().toISOString()
      });

    console.log(`Awarded ${xpToAward} XP for ${action}. New total: ${newTotal}`);

    return {
      success: true,
      xpAwarded: xpToAward,
      newTotal,
      newLevel,
      leveledUp,
      previousLevel
    };
  } catch (err) {
    console.error('Error awarding XP:', err);
    return { success: false, xpAwarded: 0, newTotal: 0, newLevel: 1, leveledUp: false, previousLevel: 1 };
  }
}

/**
 * Get user's current XP and level
 */
export async function getUserXP(): Promise<{ totalXP: number; level: number; progress: number }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { totalXP: 0, level: 1, progress: 0 };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, current_level')
      .eq('id', user.id)
      .single();

    const totalXP = profile?.total_xp || 0;
    const level = profile?.current_level || calculateLevel(totalXP);
    const progress = getLevelProgress(totalXP);

    return { totalXP, level, progress };
  } catch (err) {
    console.error('Error getting user XP:', err);
    return { totalXP: 0, level: 1, progress: 0 };
  }
}
