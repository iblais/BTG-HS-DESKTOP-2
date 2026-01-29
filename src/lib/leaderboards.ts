import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export type LeaderboardType = 'total_xp' | 'weekly_xp' | 'quiz_avg' | 'games';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url?: string | null;
  value: number;
  is_current_user?: boolean;
}

/**
 * Get leaderboard data for a specific type
 */
export async function getLeaderboard(
  type: LeaderboardType,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  try {
    const user = await getCurrentUser();
    const currentUserId = user?.id;

    let entries: LeaderboardEntry[] = [];

    switch (type) {
      case 'total_xp': {
        // profiles.id = user id, so query directly
        const { data: fallbackData } = await supabase
          .from('profiles')
          .select('id, total_xp')
          .order('total_xp', { ascending: false })
          .limit(limit);

        if (fallbackData) {
          entries = fallbackData.map((row, index) => ({
            rank: index + 1,
            user_id: row.id,
            display_name: null,
            email: 'User ' + (index + 1),
            value: row.total_xp || 0,
            is_current_user: row.id === currentUserId
          }));
        }
        break;
      }

      case 'weekly_xp': {
        // Get XP earned this week
        const startOfWeek = getStartOfWeek();
        const { data, error } = await supabase
          .from('xp_history')
          .select('user_id, xp_amount')
          .gte('created_at', startOfWeek.toISOString());

        if (!error && data) {
          // Aggregate XP by user
          const userXP: Record<string, number> = {};
          data.forEach(row => {
            userXP[row.user_id] = (userXP[row.user_id] || 0) + row.xp_amount;
          });

          // Sort and rank
          const sorted = Object.entries(userXP)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit);

          entries = sorted.map(([userId, xp], index) => ({
            rank: index + 1,
            user_id: userId,
            display_name: null,
            email: 'User ' + (index + 1),
            value: xp,
            is_current_user: userId === currentUserId
          }));
        }
        break;
      }

      case 'quiz_avg': {
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('user_id, score');

        if (!error && data) {
          // Calculate averages
          const userScores: Record<string, { total: number; count: number }> = {};
          data.forEach(row => {
            if (!userScores[row.user_id]) {
              userScores[row.user_id] = { total: 0, count: 0 };
            }
            userScores[row.user_id].total += row.score;
            userScores[row.user_id].count += 1;
          });

          // Filter users with at least 3 quizzes and calculate average
          const sorted = Object.entries(userScores)
            .filter(([, stats]) => stats.count >= 3)
            .map(([userId, stats]) => ({
              userId,
              avg: stats.total / stats.count
            }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, limit);

          entries = sorted.map((row, index) => ({
            rank: index + 1,
            user_id: row.userId,
            display_name: null,
            email: 'User ' + (index + 1),
            value: Math.round(row.avg * 10) / 10,
            is_current_user: row.userId === currentUserId
          }));
        }
        break;
      }

      case 'games': {
        const { data, error } = await supabase
          .from('game_scores')
          .select('user_id, score')
          .eq('completed', true);

        if (!error && data) {
          // Get highest score per user
          const userHighScores: Record<string, number> = {};
          data.forEach(row => {
            if (!userHighScores[row.user_id] || row.score > userHighScores[row.user_id]) {
              userHighScores[row.user_id] = row.score;
            }
          });

          const sorted = Object.entries(userHighScores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit);

          entries = sorted.map(([userId, score], index) => ({
            rank: index + 1,
            user_id: userId,
            display_name: null,
            email: 'User ' + (index + 1),
            value: score,
            is_current_user: userId === currentUserId
          }));
        }
        break;
      }
    }

    // Try to get display names for entries
    if (entries.length > 0) {
      const userIds = entries.map(e => e.user_id);
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, email')
        .in('id', userIds);

      if (users) {
        const userMap = new Map(users.map(u => [u.id, u]));
        entries = entries.map(entry => {
          const user = userMap.get(entry.user_id);
          return {
            ...entry,
            display_name: user?.display_name || entry.display_name,
            email: user?.email || entry.email
          };
        });
      }
    }

    return entries;
  } catch (err) {
    console.error('Error getting leaderboard:', err);
    return [];
  }
}

/**
 * Get current user's rank for a specific leaderboard type
 */
export async function getUserRank(type: LeaderboardType): Promise<{
  rank: number | null;
  value: number;
  totalUsers: number;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { rank: null, value: 0, totalUsers: 0 };
    }

    const leaderboard = await getLeaderboard(type, 1000);
    const totalUsers = leaderboard.length;
    const userEntry = leaderboard.find(e => e.user_id === user.id);

    return {
      rank: userEntry?.rank || null,
      value: userEntry?.value || 0,
      totalUsers
    };
  } catch (err) {
    console.error('Error getting user rank:', err);
    return { rank: null, value: 0, totalUsers: 0 };
  }
}

/**
 * Helper: Get start of current week (Monday)
 */
function getStartOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
