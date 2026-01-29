import { supabase } from './supabase';
import { getCurrentUser } from './auth';

// Achievement definitions
export const ACHIEVEMENTS = [
  {
    id: 'first_lesson',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🎯',
    xp_reward: 25,
    category: 'learning'
  },
  {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Pass 5 quizzes in a row',
    icon: '🏆',
    xp_reward: 100,
    category: 'learning'
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: '💯',
    xp_reward: 75,
    category: 'learning'
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete a full week',
    icon: '⚔️',
    xp_reward: 50,
    category: 'learning'
  },
  {
    id: 'halfway_hero',
    name: 'Halfway Hero',
    description: 'Complete Week 9',
    icon: '🦸',
    xp_reward: 200,
    category: 'learning'
  },
  {
    id: 'graduate',
    name: 'Graduate',
    description: 'Complete all 18 weeks',
    icon: '🎓',
    xp_reward: 500,
    category: 'learning'
  },
  {
    id: 'gamer',
    name: 'Gamer',
    description: 'Play all 6 games',
    icon: '🎮',
    xp_reward: 100,
    category: 'games'
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Login 7 days in a row',
    icon: '🔥',
    xp_reward: 150,
    category: 'engagement'
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a lesson before 8am',
    icon: '🌅',
    xp_reward: 50,
    category: 'engagement'
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a lesson after 10pm',
    icon: '🦉',
    xp_reward: 50,
    category: 'engagement'
  },
  {
    id: 'first_game',
    name: 'Game On',
    description: 'Complete your first game',
    icon: '🕹️',
    xp_reward: 25,
    category: 'games'
  },
  {
    id: 'high_scorer',
    name: 'High Scorer',
    description: 'Score over 1000 points in any game',
    icon: '⭐',
    xp_reward: 75,
    category: 'games'
  }
] as const;

export type AchievementId = typeof ACHIEVEMENTS[number]['id'];

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
}

export interface UnlockedAchievement {
  achievement_id: string;
  unlocked_at: string;
}

/**
 * Get achievement definition by ID
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

/**
 * Get all achievements a user has unlocked
 */
export async function getUnlockedAchievements(userId?: string): Promise<UnlockedAchievement[]> {
  try {
    const user = userId ? { id: userId } : await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error getting achievements:', err);
    return [];
  }
}

/**
 * Check if a user has unlocked a specific achievement
 */
export async function hasAchievement(achievementId: string, userId?: string): Promise<boolean> {
  const unlocked = await getUnlockedAchievements(userId);
  return unlocked.some(a => a.achievement_id === achievementId);
}

/**
 * Unlock an achievement for the current user
 */
export async function unlockAchievement(achievementId: string): Promise<{
  success: boolean;
  alreadyUnlocked: boolean;
  achievement?: Achievement;
  xpAwarded?: number;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, alreadyUnlocked: false };
    }

    // Check if already unlocked
    const alreadyUnlocked = await hasAchievement(achievementId, user.id);
    if (alreadyUnlocked) {
      return { success: true, alreadyUnlocked: true };
    }

    const achievement = getAchievementById(achievementId);
    if (!achievement) {
      console.error('Achievement not found:', achievementId);
      return { success: false, alreadyUnlocked: false };
    }

    // Insert achievement record
    const { error } = await supabase
      .from('achievements')
      .insert({
        user_id: user.id,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error unlocking achievement:', error);
      return { success: false, alreadyUnlocked: false };
    }

    // Award XP for the achievement
    // Note: This is separate from the regular XP system - achievement XP bonus
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', user.id)
      .single();

    const currentXP = profile?.total_xp || 0;
    const newXP = currentXP + achievement.xp_reward;

    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        total_xp: newXP,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    // Log XP from achievement
    await supabase
      .from('xp_history')
      .insert({
        user_id: user.id,
        action: `achievement_${achievementId}`,
        xp_amount: achievement.xp_reward,
        metadata: { achievement_id: achievementId, achievement_name: achievement.name }
      });

    console.log(`Achievement unlocked: ${achievement.name} (+${achievement.xp_reward} XP)`);

    return {
      success: true,
      alreadyUnlocked: false,
      achievement,
      xpAwarded: achievement.xp_reward
    };
  } catch (err) {
    console.error('Error unlocking achievement:', err);
    return { success: false, alreadyUnlocked: false };
  }
}

/**
 * Check and potentially unlock achievements based on an action
 */
export async function checkAchievements(
  action: string,
  data?: {
    weekNumber?: number;
    percentage?: number;
    score?: number;
    gameType?: string;
    quizzesPassedInRow?: number;
    completedWeeks?: number[];
    gamesPlayed?: string[];
  }
): Promise<Achievement[]> {
  const unlockedAchievements: Achievement[] = [];
  const hour = new Date().getHours();

  try {
    switch (action) {
      case 'complete_lesson': {
        // First lesson achievement
        const firstLesson = await unlockAchievement('first_lesson');
        if (firstLesson.success && !firstLesson.alreadyUnlocked && firstLesson.achievement) {
          unlockedAchievements.push(firstLesson.achievement);
        }

        // Early bird (before 8am)
        if (hour < 8) {
          const earlyBird = await unlockAchievement('early_bird');
          if (earlyBird.success && !earlyBird.alreadyUnlocked && earlyBird.achievement) {
            unlockedAchievements.push(earlyBird.achievement);
          }
        }

        // Night owl (after 10pm)
        if (hour >= 22) {
          const nightOwl = await unlockAchievement('night_owl');
          if (nightOwl.success && !nightOwl.alreadyUnlocked && nightOwl.achievement) {
            unlockedAchievements.push(nightOwl.achievement);
          }
        }
        break;
      }

      case 'pass_quiz': {
        // Perfect score
        if (data?.percentage === 100) {
          const perfect = await unlockAchievement('perfect_score');
          if (perfect.success && !perfect.alreadyUnlocked && perfect.achievement) {
            unlockedAchievements.push(perfect.achievement);
          }
        }

        // Quiz master (5 in a row - we'll check via database)
        if (data?.quizzesPassedInRow && data.quizzesPassedInRow >= 5) {
          const quizMaster = await unlockAchievement('quiz_master');
          if (quizMaster.success && !quizMaster.alreadyUnlocked && quizMaster.achievement) {
            unlockedAchievements.push(quizMaster.achievement);
          }
        }
        break;
      }

      case 'complete_week': {
        // Week warrior
        const weekWarrior = await unlockAchievement('week_warrior');
        if (weekWarrior.success && !weekWarrior.alreadyUnlocked && weekWarrior.achievement) {
          unlockedAchievements.push(weekWarrior.achievement);
        }

        // Halfway hero (completed week 9)
        if (data?.weekNumber === 9) {
          const halfwayHero = await unlockAchievement('halfway_hero');
          if (halfwayHero.success && !halfwayHero.alreadyUnlocked && halfwayHero.achievement) {
            unlockedAchievements.push(halfwayHero.achievement);
          }
        }

        // Graduate (completed all 18 weeks)
        if (data?.completedWeeks && data.completedWeeks.length >= 18) {
          const graduate = await unlockAchievement('graduate');
          if (graduate.success && !graduate.alreadyUnlocked && graduate.achievement) {
            unlockedAchievements.push(graduate.achievement);
          }
        }
        break;
      }

      case 'complete_game': {
        // First game
        const firstGame = await unlockAchievement('first_game');
        if (firstGame.success && !firstGame.alreadyUnlocked && firstGame.achievement) {
          unlockedAchievements.push(firstGame.achievement);
        }

        // High scorer
        if (data?.score && data.score > 1000) {
          const highScorer = await unlockAchievement('high_scorer');
          if (highScorer.success && !highScorer.alreadyUnlocked && highScorer.achievement) {
            unlockedAchievements.push(highScorer.achievement);
          }
        }

        // Gamer (played all 6 games)
        if (data?.gamesPlayed && data.gamesPlayed.length >= 6) {
          const gamer = await unlockAchievement('gamer');
          if (gamer.success && !gamer.alreadyUnlocked && gamer.achievement) {
            unlockedAchievements.push(gamer.achievement);
          }
        }
        break;
      }
    }

    return unlockedAchievements;
  } catch (err) {
    console.error('Error checking achievements:', err);
    return [];
  }
}

/**
 * Get all achievements with unlock status for a user
 */
export async function getAllAchievementsWithStatus(): Promise<Array<Achievement & { unlocked: boolean; unlocked_at?: string }>> {
  const unlocked = await getUnlockedAchievements();
  const unlockedMap = new Map(unlocked.map(u => [u.achievement_id, u.unlocked_at]));

  return ACHIEVEMENTS.map(achievement => ({
    ...achievement,
    unlocked: unlockedMap.has(achievement.id),
    unlocked_at: unlockedMap.get(achievement.id)
  }));
}
