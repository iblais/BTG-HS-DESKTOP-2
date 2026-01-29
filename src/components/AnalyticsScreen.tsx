import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, BookOpen, Trophy, Gamepad2, RefreshCw, Zap, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStudentAnalytics, type StudentAnalytics } from '@/lib/analytics';

interface AnalyticsScreenProps {
  onBack: () => void;
}

export function AnalyticsScreen({ onBack }: AnalyticsScreenProps) {
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    const data = await getStudentAnalytics();
    setAnalytics(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-white/40 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[#0A0E27] p-4">
        <button onClick={onBack} className="p-2 rounded-lg bg-white/5">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center mt-20">
          <p className="text-white/60">Unable to load analytics</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total XP', value: analytics.totalXP.toLocaleString(), icon: Zap, color: 'from-yellow-500 to-orange-500' },
    { label: 'Level', value: analytics.currentLevel, icon: Trophy, color: 'from-purple-500 to-pink-500' },
    { label: 'Weeks Done', value: `${analytics.weeksCompleted}/18`, icon: Target, color: 'from-green-500 to-emerald-500' },
    { label: 'Games Played', value: analytics.gamesPlayed, icon: Gamepad2, color: 'from-blue-500 to-cyan-500' },
  ];

  // Get max XP for chart scaling
  const maxXP = Math.max(...analytics.xpHistory.map(h => h.xp), 1);

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0A0E27]/95 backdrop-blur-sm border-b border-white/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-white font-bold text-lg">Your Analytics</h1>
          <button
            onClick={loadAnalytics}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="bg-white/5 rounded-xl p-4 border border-white/5"
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-gradient-to-br",
                  stat.color
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-white text-2xl font-bold">{stat.value}</p>
                <p className="text-white/50 text-sm">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* XP Over Time Chart */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            <h2 className="text-white font-semibold">XP Earned Over Time</h2>
          </div>
          {analytics.xpHistory.length > 0 ? (
            <div className="h-40 flex items-end gap-1">
              {analytics.xpHistory.slice(-14).map((day, i) => {
                const height = (day.xp / maxXP) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-yellow-500 to-orange-400 rounded-t"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-[10px] text-white/40">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-white/40 text-sm">No XP history yet</p>
            </div>
          )}
        </div>

        {/* Quiz Scores */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-white font-semibold">Quiz Performance</h2>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/50 text-sm">Quizzes Completed</p>
              <p className="text-white text-xl font-bold">{analytics.quizzesCompleted}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-sm">Average Score</p>
              <p className="text-white text-xl font-bold">{analytics.quizAvgScore}/10</p>
            </div>
          </div>
          {analytics.quizScores.length > 0 ? (
            <div className="flex items-end gap-2 h-24">
              {analytics.quizScores.slice(-10).map((quiz, i) => {
                const height = (quiz.score / 10) * 100;
                const isPassing = quiz.score >= 7;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className={cn(
                        "w-full rounded-t transition-all",
                        isPassing
                          ? "bg-gradient-to-t from-green-500 to-emerald-400"
                          : "bg-gradient-to-t from-red-500 to-orange-400"
                      )}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-white/40">W{quiz.week}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center">
              <p className="text-white/40 text-sm">No quizzes completed yet</p>
            </div>
          )}
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-green-400" />
            <h2 className="text-white font-semibold">Activity Calendar</h2>
          </div>
          {analytics.activityHeatmap.length > 0 ? (
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-white/40 text-xs py-1">
                  {day}
                </div>
              ))}
              {/* Last 28 days */}
              {Array.from({ length: 28 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (27 - i));
                const dateStr = date.toISOString().split('T')[0];
                const activity = analytics.activityHeatmap.find(a => a.date === dateStr);
                const intensity = activity ? Math.min(activity.count / 5, 1) : 0;
                return (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square rounded-sm",
                      intensity === 0
                        ? "bg-white/5"
                        : intensity < 0.3
                        ? "bg-green-900/50"
                        : intensity < 0.6
                        ? "bg-green-700/70"
                        : "bg-green-500"
                    )}
                    title={`${dateStr}: ${activity?.count || 0} activities`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-white/40 text-sm">No activity yet</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-white/40 text-xs">Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-white/5" />
              <div className="w-3 h-3 rounded-sm bg-green-900/50" />
              <div className="w-3 h-3 rounded-sm bg-green-700/70" />
              <div className="w-3 h-3 rounded-sm bg-green-500" />
            </div>
            <span className="text-white/40 text-xs">More</span>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/20">
          <h2 className="text-white font-semibold mb-2">Keep Going!</h2>
          <p className="text-white/70 text-sm">
            {analytics.weeksCompleted < 9
              ? `You're ${analytics.weeksCompleted} weeks in! Complete ${9 - analytics.weeksCompleted} more to reach the halfway point.`
              : analytics.weeksCompleted < 18
              ? `Amazing! You're past halfway with ${analytics.weeksCompleted} weeks complete. Only ${18 - analytics.weeksCompleted} more to graduate!`
              : `Congratulations! You've completed all 18 weeks of the program!`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
