import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface StudentAnalytics {
  totalXP: number;
  currentLevel: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  quizAvgScore: number;
  gamesPlayed: number;
  totalTimeMinutes: number;
  streakDays: number;
  weeksCompleted: number;
  xpHistory: { date: string; xp: number }[];
  quizScores: { week: number; score: number }[];
  activityHeatmap: { date: string; count: number }[];
}

export interface TeacherAnalytics {
  totalStudents: number;
  activeStudents: number;
  avgProgress: number;
  avgQuizScore: number;
  completionRates: { week: number; rate: number }[];
  gradeDistribution: { grade: string; count: number }[];
  recentActivity: { date: string; studentCount: number }[];
  topPerformers: { userId: string; email: string; xp: number; progress: number }[];
  strugglingStudents: { userId: string; email: string; avgScore: number; lastActive: string }[];
}

/**
 * Get student analytics for current user
 */
export async function getStudentAnalytics(): Promise<StudentAnalytics | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    // Get profile data (profiles.id = user.id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, current_level')
      .eq('id', user.id)
      .single();

    // Get course progress
    const { data: courseProgress } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id);

    // Get quiz attempts
    const { data: quizAttempts } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    // Get game scores
    const { data: gameScores } = await supabase
      .from('game_scores')
      .select('*')
      .eq('user_id', user.id);

    // Get XP history
    const { data: xpHistory } = await supabase
      .from('xp_history')
      .select('created_at, xp_amount')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    // Calculate metrics
    const weeksCompleted = courseProgress?.filter(p => p.quiz_completed).length || 0;
    const lessonsCompleted = courseProgress?.filter(p => p.lesson_completed).length || 0;
    const quizzesCompleted = quizAttempts?.length || 0;

    const quizScores = quizAttempts?.map(q => ({
      week: q.week_number || 0,
      score: q.score
    })) || [];

    const quizAvgScore = quizScores.length > 0
      ? quizScores.reduce((sum, q) => sum + q.score, 0) / quizScores.length
      : 0;

    // Process XP history for chart
    const xpByDate: Record<string, number> = {};
    xpHistory?.forEach(entry => {
      const date = new Date(entry.created_at).toISOString().split('T')[0];
      xpByDate[date] = (xpByDate[date] || 0) + entry.xp_amount;
    });

    const xpHistoryFormatted = Object.entries(xpByDate)
      .map(([date, xp]) => ({ date, xp }))
      .slice(-30); // Last 30 days

    // Activity heatmap (last 90 days)
    const activityByDate: Record<string, number> = {};

    // Count quiz attempts by date
    quizAttempts?.forEach(q => {
      if (q.completed_at) {
        const date = new Date(q.completed_at).toISOString().split('T')[0];
        activityByDate[date] = (activityByDate[date] || 0) + 1;
      }
    });

    // Count game completions by date
    gameScores?.forEach(g => {
      if (g.created_at) {
        const date = new Date(g.created_at).toISOString().split('T')[0];
        activityByDate[date] = (activityByDate[date] || 0) + 1;
      }
    });

    // Count XP events by date
    xpHistory?.forEach(x => {
      const date = new Date(x.created_at).toISOString().split('T')[0];
      activityByDate[date] = (activityByDate[date] || 0) + 1;
    });

    const activityHeatmap = Object.entries(activityByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-90);

    return {
      totalXP: profile?.total_xp || 0,
      currentLevel: profile?.current_level || 1,
      lessonsCompleted,
      quizzesCompleted,
      quizAvgScore: Math.round(quizAvgScore * 10) / 10,
      gamesPlayed: gameScores?.length || 0,
      totalTimeMinutes: 0, // Would need time tracking implementation
      streakDays: 0, // Would need streak tracking
      weeksCompleted,
      xpHistory: xpHistoryFormatted,
      quizScores,
      activityHeatmap
    };
  } catch (err) {
    console.error('Error getting student analytics:', err);
    return null;
  }
}

/**
 * Get teacher analytics (class overview)
 */
export async function getTeacherAnalytics(): Promise<TeacherAnalytics | null> {
  try {
    // Get all students (non-teacher users)
    const { data: users } = await supabase
      .from('users')
      .select('id, email, created_at, last_active');

    if (!users) return null;

    const studentIds = users.map(u => u.id);

    // Get all profiles for XP data (profiles.id = user id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, total_xp, current_level')
      .in('id', studentIds);

    // Get all course progress
    const { data: allProgress } = await supabase
      .from('course_progress')
      .select('*')
      .in('user_id', studentIds);

    // Get all quiz attempts
    const { data: allQuizzes } = await supabase
      .from('quiz_attempts')
      .select('*')
      .in('user_id', studentIds);

    // Calculate metrics
    const totalStudents = users.length;

    // Active students (active in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeStudents = users.filter(u =>
      u.last_active && new Date(u.last_active) > sevenDaysAgo
    ).length;

    // Average progress (weeks completed / 18)
    const progressByUser: Record<string, number> = {};
    allProgress?.forEach(p => {
      if (p.quiz_completed) {
        progressByUser[p.user_id] = (progressByUser[p.user_id] || 0) + 1;
      }
    });
    const avgWeeksCompleted = totalStudents > 0
      ? Object.values(progressByUser).reduce((sum, v) => sum + v, 0) / totalStudents
      : 0;
    const avgProgress = Math.round((avgWeeksCompleted / 18) * 100);

    // Average quiz score
    const allScores = allQuizzes?.map(q => q.score) || [];
    const avgQuizScore = allScores.length > 0
      ? Math.round((allScores.reduce((sum, s) => sum + s, 0) / allScores.length) * 10) / 10
      : 0;

    // Completion rates by week
    const weekCompletions: Record<number, number> = {};
    allProgress?.forEach(p => {
      if (p.quiz_completed && p.week_number < 100) {
        weekCompletions[p.week_number] = (weekCompletions[p.week_number] || 0) + 1;
      }
    });
    const completionRates = Array.from({ length: 18 }, (_, i) => ({
      week: i + 1,
      rate: Math.round((weekCompletions[i + 1] || 0) / totalStudents * 100)
    }));

    // Grade distribution
    const gradeRanges = [
      { grade: 'A (90-100%)', min: 9, max: 10 },
      { grade: 'B (80-89%)', min: 8, max: 9 },
      { grade: 'C (70-79%)', min: 7, max: 8 },
      { grade: 'D (60-69%)', min: 6, max: 7 },
      { grade: 'F (<60%)', min: 0, max: 6 }
    ];
    const gradeDistribution = gradeRanges.map(({ grade, min, max }) => ({
      grade,
      count: allScores.filter(s => s >= min && s < max).length
    }));

    // Recent activity (last 14 days)
    const activityByDate: Record<string, Set<string>> = {};
    allQuizzes?.forEach(q => {
      if (q.completed_at) {
        const date = new Date(q.completed_at).toISOString().split('T')[0];
        if (!activityByDate[date]) activityByDate[date] = new Set();
        activityByDate[date].add(q.user_id);
      }
    });
    const recentActivity = Object.entries(activityByDate)
      .map(([date, students]) => ({ date, studentCount: students.size }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    // Top performers
    const profileMap = new Map(profiles?.map(p => [p.id, p]));
    const topPerformers = users
      .map(u => {
        const profile = profileMap.get(u.id);
        return {
          userId: u.id,
          email: u.email,
          xp: profile?.total_xp || 0,
          progress: Math.round((progressByUser[u.id] || 0) / 18 * 100)
        };
      })
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);

    // Struggling students (low avg score or inactive)
    const userQuizAvg: Record<string, { total: number; count: number }> = {};
    allQuizzes?.forEach(q => {
      if (!userQuizAvg[q.user_id]) {
        userQuizAvg[q.user_id] = { total: 0, count: 0 };
      }
      userQuizAvg[q.user_id].total += q.score;
      userQuizAvg[q.user_id].count += 1;
    });

    const strugglingStudents = users
      .map(u => {
        const quizData = userQuizAvg[u.id];
        const avgScore = quizData ? quizData.total / quizData.count : 0;
        return {
          userId: u.id,
          email: u.email,
          avgScore: Math.round(avgScore * 10) / 10,
          lastActive: u.last_active || u.created_at
        };
      })
      .filter(s => s.avgScore < 7 || !users.find(u => u.id === s.userId)?.last_active)
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 10);

    return {
      totalStudents,
      activeStudents,
      avgProgress,
      avgQuizScore,
      completionRates,
      gradeDistribution,
      recentActivity,
      topPerformers,
      strugglingStudents
    };
  } catch (err) {
    console.error('Error getting teacher analytics:', err);
    return null;
  }
}

/**
 * Generate CSV report
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const value = row[h];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}
