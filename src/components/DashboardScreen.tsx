import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { type Enrollment } from '@/lib/enrollment';
import {
  CheckCircle, BookOpen, Clock, ChevronRight, Loader2, Flame, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  financialRookieBadge,
  budgetMasterBadge,
  investmentProBadge,
  streakLegendBadge,
  goalSetterBadge,
  perfectScoreBadge,
  week1Image, week2Image, week3Image, week4Image,
  week5Image, week6Image, week7Image, week8Image,
  week9Image, week10Image, week11Image, week12Image,
  week13Image, week14Image, week15Image, week16Image,
  week17Image, week18Image
} from '@/assets';

// Map week numbers to images
const weekImages: Record<number, string> = {
  1: week1Image, 2: week2Image, 3: week3Image, 4: week4Image,
  5: week5Image, 6: week6Image, 7: week7Image, 8: week8Image,
  9: week9Image, 10: week10Image, 11: week11Image, 12: week12Image,
  13: week13Image, 14: week14Image, 15: week15Image, 16: week16Image,
  17: week17Image, 18: week18Image,
};

interface DashboardScreenProps {
  enrollment: Enrollment | null;
  onNavigateToTab?: (tab: string) => void;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  xp: number;
  level: number;
  streak_days: number;
  last_active: string;
}

interface CourseProgress {
  week_number: number;
  completed: boolean;
  score: number;
}

export function DashboardScreen({ enrollment, onNavigateToTab }: DashboardScreenProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user) {
        setError('Unable to get user session.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        const newProfile = {
          id: user.id,
          email: user.email,
          display_name: null,
          xp: 0,
          level: 1,
          streak_days: 0,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: insertedData, error: insertError } = await supabase
          .from('users')
          .insert([newProfile])
          .select()
          .single();

        if (insertError) {
          setError('Failed to create user profile.');
          setLoading(false);
          return;
        }

        if (insertedData) setUserProfile(insertedData);
      } else if (fetchError) {
        setError('Failed to load user data.');
        setLoading(false);
        return;
      } else if (data) {
        setUserProfile(data);

        await supabase
          .from('users')
          .update({ last_active: new Date().toISOString() })
          .eq('id', user.id);

        const [progressRes, achievementsRes] = await Promise.all([
          supabase
            .from('course_progress')
            .select('*')
            .eq('user_id', user.id)
            .order('week_number', { ascending: true }),
          supabase
            .from('achievements')
            .select('achievement_type')
            .eq('user_id', user.id)
        ]);

        if (progressRes.data) setCourseProgress(progressRes.data);
        if (achievementsRes.data) {
          setUserAchievements(achievementsRes.data.map(a => a.achievement_type));
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (userProfile?.email) return userProfile.email.split('@')[0];
    return 'User';
  };

  const weekTitles: Record<number, string> = {
    1: 'Income & Expenses', 2: 'Increasing Your Income', 3: 'What is Credit?',
    4: 'Build & Maintain Credit', 5: 'Avoid Debt Traps', 6: 'Bank Account Basics',
    7: 'Personal Budget', 8: 'Smart Spending', 9: 'Personal Branding',
    10: 'Resume Building', 11: 'Career Readiness', 12: 'Networking',
    13: 'Entrepreneurship', 14: 'Workshop Project', 15: 'Community Showcase',
    16: 'Graduation', 17: 'Advanced Investing', 18: 'Final Review'
  };

  const totalWeeks = enrollment?.program_id === 'HS' ? 18 : 16;
  const completedWeeks = courseProgress.filter(p => p.completed).length;
  const overallProgress = Math.round((completedWeeks / totalWeeks) * 100);
  const currentWeek = completedWeeks + 1;

  const badges = [
    { id: 'financial_rookie', name: 'Financial Rookie', image: financialRookieBadge },
    { id: 'budget_master', name: 'Budget Master', image: budgetMasterBadge },
    { id: 'investment_pro', name: 'Investment Pro', image: investmentProBadge },
    { id: 'streak_legend', name: 'Streak Legend', image: streakLegendBadge },
    { id: 'goal_setter', name: 'Goal Setter', image: goalSetterBadge },
    { id: 'perfect_score', name: 'Perfect Score', image: perfectScoreBadge },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-[#4A5FFF] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-white mb-4">{error}</p>
          <button onClick={loadUserData} className="px-6 py-2 rounded-lg bg-[#4A5FFF] text-white">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 md:space-y-8 pb-6 md:pb-0">
      {/* Welcome + Stats Row - Stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 md:gap-6">
        {/* Welcome Card - takes remaining space */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg md:text-2xl">{getUserName().charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[var(--text-tertiary)] text-xs md:text-sm">Welcome back,</p>
              <h2 className="text-[var(--text-primary)] text-lg md:text-2xl font-bold tracking-tight truncate">{getUserName()}</h2>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {/* XP Card - Primary Glow */}
            <div className="stat-glow text-center p-3 md:p-5 bg-[var(--bg-base)] rounded-xl border border-[var(--primary-500)]/20 cursor-pointer group">
              <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-lg md:rounded-xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] flex items-center justify-center float-icon">
                <span className="text-white text-sm md:text-xl">⚡</span>
              </div>
              <p className="text-xl md:text-[40px] font-black gradient-text-primary tracking-tight leading-none animate-count">{userProfile?.xp || 0}</p>
              <p className="text-[var(--text-tertiary)] text-[10px] md:text-xs mt-1 md:mt-2 uppercase tracking-wider font-semibold">Total XP</p>
            </div>
            {/* Streak Card - Fire Glow */}
            <div className="stat-glow fire-glow text-center p-3 md:p-5 bg-[var(--bg-base)] rounded-xl border border-[var(--secondary-500)]/20 cursor-pointer group">
              <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-lg md:rounded-xl bg-gradient-to-br from-[var(--secondary-400)] to-[#F97316] flex items-center justify-center">
                <Flame className="w-4 h-4 md:w-6 md:h-6 text-white float-icon" />
              </div>
              <p className="text-xl md:text-[40px] font-black gradient-text-fire tracking-tight leading-none animate-count">{userProfile?.streak_days || 0}</p>
              <p className="text-[var(--text-tertiary)] text-[10px] md:text-xs mt-1 md:mt-2 uppercase tracking-wider font-semibold">Streak</p>
            </div>
            {/* Level Card - Success Glow */}
            <div className="stat-glow success-glow text-center p-3 md:p-5 bg-[var(--bg-base)] rounded-xl border border-[var(--success)]/20 cursor-pointer group">
              <div className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-lg md:rounded-xl bg-gradient-to-br from-[var(--success)] to-[var(--success-dark)] flex items-center justify-center float-icon">
                <span className="text-white text-sm md:text-xl">🏆</span>
              </div>
              <p className="text-xl md:text-[40px] font-black gradient-text-success tracking-tight leading-none animate-count">Lv.{userProfile?.level || 1}</p>
              <p className="text-[var(--text-tertiary)] text-[10px] md:text-xs mt-1 md:mt-2 uppercase tracking-wider font-semibold">Level</p>
            </div>
          </div>
        </div>

        {/* Progress Card - fixed width with milestones */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[var(--text-primary)] text-base md:text-lg font-semibold">Your Journey</h3>
            <span className="text-2xl md:text-[32px] font-black gradient-text-success">{overallProgress}%</span>
          </div>
          <p className="text-[var(--text-tertiary)] text-xs md:text-sm mb-3 md:mb-4">
            {completedWeeks} of {totalWeeks} weeks complete
          </p>

          {/* Progress bar with shimmer */}
          <div className="relative w-full bg-white/[0.08] rounded-full h-2 md:h-3 mb-3 md:mb-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--primary-500)] via-[var(--success)] to-[var(--secondary-500)] transition-all duration-500 progress-shimmer"
              style={{ width: `${overallProgress}%` }}
            />
          </div>

          {/* Milestone markers */}
          <div className="flex justify-between items-center px-1">
            {[0, 25, 50, 75, 100].map((milestone) => (
              <div key={milestone} className="flex flex-col items-center">
                <div className={cn(
                  "milestone-marker",
                  overallProgress >= milestone && "completed",
                  overallProgress >= milestone - 10 && overallProgress < milestone && "current"
                )} />
                <span className={cn(
                  "text-[8px] md:text-[10px] mt-1 font-medium",
                  overallProgress >= milestone ? "text-[var(--success)]" : "text-[var(--text-muted)]"
                )}>{milestone}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Continue Learning - HERO TREATMENT WITH IMAGE */}
      <div className="hero-card rounded-xl md:rounded-2xl overflow-hidden">
        {/* Course Image - Full Width on Top */}
        <div className="relative h-32 md:h-40 overflow-hidden">
          <img
            src={weekImages[currentWeek] || weekImages[1]}
            alt={weekTitles[currentWeek] || 'Course'}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />
          {/* Week Badge on Image */}
          <div className="absolute top-3 left-3 md:top-4 md:left-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-[var(--primary-500)]/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-white text-base md:text-lg font-black">{currentWeek}</span>
            </div>
          </div>
          {/* Live indicator */}
          <div className="absolute top-3 right-3 md:top-4 md:right-4 flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="text-white text-[10px] md:text-xs font-semibold">Ready</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="text-[var(--success)] text-xs md:text-sm font-semibold uppercase tracking-wider">Continue Training</span>
          </div>

          <h3 className="text-[var(--text-primary)] text-lg md:text-2xl font-black mb-2">{weekTitles[currentWeek] || 'Getting Started'}</h3>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm mb-3 md:mb-4">
            <span className="flex items-center gap-1 md:gap-1.5 text-[var(--text-tertiary)]">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              ~45 min
            </span>
            <span className="flex items-center gap-1 md:gap-1.5 text-[var(--text-tertiary)]">
              <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
              5 lessons
            </span>
            <span className="flex items-center gap-1 md:gap-1.5 text-[var(--secondary-500)] font-bold">
              <span>⚡</span>
              +250 XP
            </span>
          </div>

          {/* Pulsing CTA Button */}
          <button
            onClick={() => onNavigateToTab?.('courses')}
            className="cta-pulse w-full md:w-auto flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white text-sm md:text-base font-bold hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--primary-500)]/40 transition-all duration-200"
          >
            Let's Go!
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* Recent Weeks Section */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 md:p-6">
        <h3 className="text-[var(--text-primary)] text-base md:text-lg font-semibold mb-3 md:mb-4">Recent Progress</h3>
        <div className="space-y-2">
          {[currentWeek - 2, currentWeek - 1, currentWeek].filter(w => w > 0).map(week => {
            const progress = courseProgress.find(p => p.week_number === week);
            const isComplete = progress?.completed;
            const isCurrent = week === currentWeek;

            return (
              <div
                key={week}
                onClick={() => onNavigateToTab?.('courses')}
                className={cn(
                  "flex items-center justify-between p-3 md:p-4 rounded-lg cursor-pointer transition-all duration-150",
                  "bg-[var(--bg-base)] hover:bg-[var(--bg-subtle)]",
                  isCurrent && "border border-[var(--primary-500)]/30"
                )}
              >
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className={cn(
                    "w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    isComplete ? "bg-[var(--success)]/15" : "bg-[var(--bg-subtle)]"
                  )}>
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[var(--success)]" />
                    ) : (
                      <span className="text-[var(--text-tertiary)] text-xs md:text-sm font-semibold">{week}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-xs md:text-sm font-medium truncate",
                    isComplete ? "text-[var(--text-tertiary)]" : "text-[var(--text-primary)]"
                  )}>
                    {weekTitles[week]}
                  </span>
                </div>
                {isComplete && <span className="text-[var(--success)] text-[10px] md:text-xs font-medium uppercase tracking-wide flex-shrink-0">Complete</span>}
                {isCurrent && !isComplete && <span className="text-[var(--primary-500)] text-[10px] md:text-xs font-medium uppercase tracking-wide flex-shrink-0">In Progress</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column: Goals + Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Weekly Goals */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Target className="w-4 h-4 md:w-5 md:h-5 text-[var(--success)]" />
            <h3 className="text-[var(--text-primary)] text-base md:text-lg font-semibold">Weekly Goals</h3>
          </div>

          <div className="space-y-4 md:space-y-5">
            {[
              { name: 'Complete 3 modules', done: 2, total: 3, color: 'var(--success)' },
              { name: 'Play 2 games', done: 1, total: 2, color: 'var(--secondary-500)' },
              { name: 'Score 80%+ on quiz', done: 0, total: 1, color: 'var(--primary-500)' },
            ].map((goal, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <span className="text-[var(--text-secondary)] text-xs md:text-sm">{goal.name}</span>
                  <span className="text-[var(--text-primary)] text-xs md:text-sm font-semibold">{goal.done}/{goal.total}</span>
                </div>
                <div className="w-full bg-white/[0.08] rounded-full h-1.5 md:h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(goal.done / goal.total) * 100}%`,
                      backgroundColor: goal.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 md:mt-6 pt-4 md:pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[var(--text-secondary)] text-xs md:text-sm">Complete all for bonus</span>
            <span className="text-[var(--secondary-400)] text-sm md:text-base font-bold">+100 XP</span>
          </div>
        </div>

        {/* Achievements - Trophy Case with 3D Badges */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-xl md:text-2xl">🏆</span>
              <h3 className="text-[var(--text-primary)] text-base md:text-lg font-semibold">Trophy Case</h3>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-[var(--secondary-500)]/20">
              <span className="text-[var(--secondary-500)] text-xs md:text-sm font-bold">{userAchievements.length}</span>
              <span className="text-[var(--text-tertiary)] text-xs md:text-sm">/ {badges.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-5">
            {badges.map((badge) => {
              const earned = userAchievements.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "badge-3d flex flex-col items-center p-2 md:p-5 rounded-lg md:rounded-xl cursor-pointer",
                    earned
                      ? "bg-gradient-to-b from-[var(--bg-subtle)] to-[var(--bg-base)] badge-earned-glow"
                      : "bg-[var(--bg-base)]/30"
                  )}
                >
                  <div className={cn(
                    "relative mb-1.5 md:mb-3",
                    !earned && "grayscale opacity-30"
                  )}>
                    <img
                      src={badge.image}
                      alt={badge.name}
                      className="w-12 h-12 md:w-20 md:h-20 object-contain drop-shadow-lg"
                    />
                    {earned && (
                      <div className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-4 h-4 md:w-6 md:h-6 rounded-full bg-[var(--success)] flex items-center justify-center border-2 border-[var(--bg-base)]">
                        <CheckCircle className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] md:text-xs text-center font-semibold line-clamp-2",
                    earned ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                  )}>{badge.name}</span>
                  {!earned && (
                    <span className="text-[8px] md:text-[10px] text-[var(--text-muted)] mt-0.5 md:mt-1">Locked</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 md:p-6">
        <h3 className="text-[var(--text-primary)] text-base md:text-lg font-semibold mb-4 md:mb-6">Recent Activity</h3>
        <div className="space-y-2 md:space-y-3">
          {[
            { icon: BookOpen, text: 'Started your training journey', time: 'Just now', color: 'var(--primary-500)' },
            { icon: CheckCircle, text: 'Enrolled in financial literacy program', time: 'Today', color: 'var(--success)' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-[var(--bg-base)] hover:bg-[var(--bg-subtle)] transition-colors duration-150">
              <div
                className="w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)` }}
              >
                <item.icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] text-xs md:text-sm font-medium truncate">{item.text}</p>
              </div>
              <div className="flex items-center gap-1 md:gap-1.5 text-[var(--text-tertiary)] flex-shrink-0">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="text-[10px] md:text-xs">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
