import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { type Enrollment } from "@/lib/enrollment";
import {
  onSyncStatusChange,
  getSyncHealth,
  getPendingWriteCount,
  type SyncHealth,
} from "@/lib/dataGuard";
import {
  CheckCircle,
  BookOpen,
  Clock,
  ChevronRight,
  Loader2,
  Flame,
  Target,
  Wifi,
  WifiOff,
  CloudOff,
  Shield,
  Zap,
  TrendingUp,
  Star,
  Users,
} from "lucide-react";
import { JoinClassModal } from "./JoinClassModal";
import { cn } from "@/lib/utils";
import {
  financialRookieBadge,
  budgetMasterBadge,
  investmentProBadge,
  streakLegendBadge,
  goalSetterBadge,
  perfectScoreBadge,
  week1Image,
  week2Image,
  week3Image,
  week4Image,
  week5Image,
  week6Image,
  week7Image,
  week8Image,
  week9Image,
  week10Image,
  week11Image,
  week12Image,
  week13Image,
  week14Image,
  week15Image,
  week16Image,
  week17Image,
  week18Image,
} from "@/assets";

// Map week numbers to images
const weekImages: Record<number, string> = {
  1: week1Image,
  2: week2Image,
  3: week3Image,
  4: week4Image,
  5: week5Image,
  6: week6Image,
  7: week7Image,
  8: week8Image,
  9: week9Image,
  10: week10Image,
  11: week11Image,
  12: week12Image,
  13: week13Image,
  14: week14Image,
  15: week15Image,
  16: week16Image,
  17: week17Image,
  18: week18Image,
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

export function DashboardScreen({
  enrollment,
  onNavigateToTab,
}: DashboardScreenProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [syncHealth, setSyncHealth] = useState<SyncHealth>(getSyncHealth());
  const [pendingWrites, setPendingWrites] = useState<number>(
    getPendingWriteCount(),
  );
  const [showJoinClass, setShowJoinClass] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = onSyncStatusChange(
      (health: SyncHealth, pendingCount: number) => {
        setSyncHealth(health);
        setPendingWrites(pendingCount);
      },
    );
    return unsubscribe;
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user) {
        // No user session - show dashboard with minimal data
        setUserProfile({
          id: "",
          email: "",
          display_name: "Guest",
          xp: 0,
          level: 1,
          streak_days: 0,
          last_active: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      // Try to fetch user profile
      let profile: UserProfile | null = null;
      try {
        const { data, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (fetchError && fetchError.code === "PGRST116") {
          // User doesn't exist - create profile
          const newProfile = {
            id: user.id,
            email: user.email || "",
            display_name: null,
            xp: 0,
            level: 1,
            streak_days: 0,
            last_active: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { data: insertedData } = await supabase
            .from("users")
            .insert([newProfile])
            .select()
            .single();

          profile = insertedData || newProfile;
        } else if (!fetchError && data) {
          profile = data;
          // Update last_active in background
          supabase
            .from("users")
            .update({ last_active: new Date().toISOString() })
            .eq("id", user.id)
            .then(() => {});
        }
      } catch (err) {
        console.warn("Could not fetch/create user profile:", err);
      }

      // Set profile (use fallback if fetch failed)
      setUserProfile(
        profile || {
          id: user.id,
          email: user.email || "",
          display_name: null,
          xp: 0,
          level: 1,
          streak_days: 0,
          last_active: new Date().toISOString(),
        },
      );

      // Fetch progress and achievements (don't let failures block the dashboard)
      try {
        const [progressRes, achievementsRes] = await Promise.all([
          supabase
            .from("course_progress")
            .select("*")
            .eq("user_id", user.id)
            .order("week_number", { ascending: true }),
          supabase
            .from("achievements")
            .select("achievement_type")
            .eq("user_id", user.id),
        ]);

        if (progressRes.data) setCourseProgress(progressRes.data);
        if (achievementsRes.data) {
          setUserAchievements(
            achievementsRes.data.map((a) => a.achievement_type),
          );
        }
      } catch (err) {
        console.warn("Could not fetch progress/achievements:", err);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      // Don't show error - just use defaults
    } finally {
      setLoading(false);
    }
  };

  const getUserName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (userProfile?.email) return userProfile.email.split("@")[0];
    return "User";
  };

  const weekTitles: Record<number, string> = {
    1: "Income & Expenses",
    2: "Increasing Your Income",
    3: "What is Credit?",
    4: "Build & Maintain Credit",
    5: "Avoid Debt Traps",
    6: "Bank Account Basics",
    7: "Personal Budget",
    8: "Smart Spending",
    9: "Personal Branding",
    10: "Resume Building",
    11: "Career Readiness",
    12: "Networking",
    13: "Entrepreneurship",
    14: "Workshop Project",
    15: "Community Showcase",
    16: "Graduation",
    17: "Advanced Investing",
    18: "Final Review",
  };

  const totalWeeks = enrollment?.program_id === "HS" ? 18 : 16;
  const completedWeeks = courseProgress.filter((p) => p.completed).length;
  const overallProgress = Math.round((completedWeeks / totalWeeks) * 100);
  const currentWeek = completedWeeks + 1;

  const badges = [
    {
      id: "financial_rookie",
      name: "Financial Rookie",
      image: financialRookieBadge,
    },
    { id: "budget_master", name: "Budget Master", image: budgetMasterBadge },
    { id: "investment_pro", name: "Investment Pro", image: investmentProBadge },
    { id: "streak_legend", name: "Streak Legend", image: streakLegendBadge },
    { id: "goal_setter", name: "Goal Setter", image: goalSetterBadge },
    { id: "perfect_score", name: "Perfect Score", image: perfectScoreBadge },
  ];

  // Sync status helper
  const getSyncIcon = () => {
    switch (syncHealth) {
      case "online":
        return <Wifi className="w-3 h-3" />;
      case "degraded":
        return <CloudOff className="w-3 h-3" />;
      case "offline":
        return <WifiOff className="w-3 h-3" />;
    }
  };

  const getSyncLabel = () => {
    if (syncHealth === "offline") return "Offline";
    if (pendingWrites > 0) return `Syncing ${pendingWrites}`;
    if (syncHealth === "degraded") return "Degraded";
    return "Synced";
  };

  const getSyncClass = () => {
    if (syncHealth === "offline") return "sync-offline";
    if (pendingWrites > 0 || syncHealth === "degraded") return "sync-pending";
    return "sync-confirmed";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-500)] flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--accent-500)] opacity-30 blur-xl" />
          </div>
          <p className="text-[var(--text-tertiary)] text-sm font-medium animate-pulse">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center frost-card p-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[var(--danger)]/15 flex items-center justify-center">
            <CloudOff className="w-7 h-7 text-[var(--danger)]" />
          </div>
          <p className="text-[var(--text-primary)] font-semibold mb-2">
            Something went wrong
          </p>
          <p className="text-[var(--text-tertiary)] text-sm mb-6">{error}</p>
          <button
            onClick={loadUserData}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--primary-500)]/30 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 md:space-y-8 pb-6 md:pb-0">
      {/* ========== SYNC STATUS PILL + JOIN CLASS ========== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold transition-all duration-300",
              syncHealth === "offline"
                ? "bg-[var(--danger)]/15 text-[var(--danger)]"
                : pendingWrites > 0 || syncHealth === "degraded"
                  ? "bg-[var(--warning)]/15 text-[var(--secondary-400)]"
                  : "bg-[var(--success)]/15 text-[var(--success-light)]",
            )}
          >
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                getSyncClass(),
              )}
            />
            {getSyncIcon()}
            <span>{getSyncLabel()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJoinClass(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold bg-[var(--primary-500)]/15 text-[var(--primary-400)] hover:bg-[var(--primary-500)]/25 transition-colors"
          >
            <Users className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span>Join Class</span>
          </button>
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Shield className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="text-[10px] md:text-xs font-medium">DataGuard</span>
          </div>
        </div>
      </div>

      {/* Join Class Modal */}
      {showJoinClass && (
        <JoinClassModal
          onClose={() => setShowJoinClass(false)}
          onJoined={() => setShowJoinClass(false)}
        />
      )}

      {/* ========== WELCOME + STATS ROW ========== */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 md:gap-6">
        {/* Welcome Card -- frost-card treatment */}
        <div className="frost-card p-5 md:p-7">
          {/* User identity row */}
          <div className="flex items-center gap-3 md:gap-5 mb-5 md:mb-7">
            {/* Avatar with gradient ring */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 md:w-[72px] md:h-[72px] rounded-2xl bg-gradient-to-br from-[var(--primary-500)] via-[var(--accent-500)] to-[var(--secondary-400)] p-[2px]">
                <div className="w-full h-full rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center">
                  <span className="text-white font-black text-xl md:text-2xl gradient-text-hero">
                    {getUserName().charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              {/* Online dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium uppercase tracking-wider">
                Welcome back,
              </p>
              <h2 className="text-[var(--text-primary)] text-xl md:text-[28px] font-black tracking-tight truncate leading-tight">
                {getUserName()}
              </h2>
            </div>
          </div>

          {/* Stat trio */}
          <div className="grid grid-cols-3 gap-2.5 md:gap-4">
            {/* XP Card */}
            <div className="stat-glow relative text-center p-3 md:p-5 bg-[var(--bg-base)] rounded-xl md:rounded-2xl border border-[var(--primary-500)]/20 cursor-pointer group overflow-hidden">
              {/* Subtle mesh overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[var(--primary-500)]/5 to-transparent" />
              <div className="relative z-10">
                <div className="w-9 h-9 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center shadow-lg shadow-[var(--primary-500)]/20 float-icon">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <p className="text-2xl md:text-[42px] font-black gradient-text-primary tracking-tight leading-none animate-count">
                  {userProfile?.xp || 0}
                </p>
                <p className="text-[var(--text-muted)] text-[9px] md:text-[11px] mt-1.5 md:mt-2.5 uppercase tracking-[0.15em] font-bold">
                  Total XP
                </p>
              </div>
            </div>

            {/* Streak Card */}
            <div className="stat-glow fire-glow relative text-center p-3 md:p-5 bg-[var(--bg-base)] rounded-xl md:rounded-2xl border border-[var(--secondary-500)]/20 cursor-pointer group overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[var(--secondary-400)]/5 to-transparent" />
              <div className="relative z-10">
                <div className="w-9 h-9 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-xl bg-gradient-to-br from-[var(--secondary-400)] to-[#F97316] flex items-center justify-center shadow-lg shadow-[var(--secondary-500)]/20 float-icon">
                  <Flame className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <p className="text-2xl md:text-[42px] font-black gradient-text-fire tracking-tight leading-none animate-count">
                  {userProfile?.streak_days || 0}
                </p>
                <p className="text-[var(--text-muted)] text-[9px] md:text-[11px] mt-1.5 md:mt-2.5 uppercase tracking-[0.15em] font-bold">
                  Day Streak
                </p>
              </div>
            </div>

            {/* Level Card */}
            <div className="stat-glow success-glow relative text-center p-3 md:p-5 bg-[var(--bg-base)] rounded-xl md:rounded-2xl border border-[var(--success)]/20 cursor-pointer group overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-[var(--success)]/5 to-transparent" />
              <div className="relative z-10">
                <div className="w-9 h-9 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 rounded-xl bg-gradient-to-br from-[var(--success)] to-[var(--accent-500)] flex items-center justify-center shadow-lg shadow-[var(--success)]/20 float-icon">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <p className="text-2xl md:text-[42px] font-black gradient-text-success tracking-tight leading-none animate-count">
                  Lv.{userProfile?.level || 1}
                </p>
                <p className="text-[var(--text-muted)] text-[9px] md:text-[11px] mt-1.5 md:mt-2.5 uppercase tracking-[0.15em] font-bold">
                  Level
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card -- glow-card treatment */}
        <div className="glow-card p-5 md:p-7">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[var(--text-primary)] text-base md:text-lg font-bold tracking-tight">
                Your Journey
              </h3>
              <span className="text-3xl md:text-[36px] font-black gradient-text-success leading-none">
                {overallProgress}%
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-xs md:text-sm mb-4 md:mb-5 font-medium">
              {completedWeeks} of {totalWeeks} weeks complete
            </p>

            {/* Progress bar with shimmer */}
            <div className="relative w-full bg-[var(--bg-subtle)] rounded-full h-2.5 md:h-3.5 mb-4 md:mb-5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--primary-500)] via-[var(--success)] to-[var(--secondary-400)] transition-all duration-700 ease-out progress-shimmer"
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            {/* Milestone markers */}
            <div className="flex justify-between items-center px-1">
              {[0, 25, 50, 75, 100].map((milestone) => (
                <div key={milestone} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "milestone-marker",
                      overallProgress >= milestone && "completed",
                      overallProgress >= milestone - 10 &&
                        overallProgress < milestone &&
                        "current",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[8px] md:text-[10px] mt-1 font-semibold",
                      overallProgress >= milestone
                        ? "text-[var(--success)]"
                        : "text-[var(--text-muted)]",
                    )}
                  >
                    {milestone}%
                  </span>
                </div>
              ))}
            </div>

            {/* Next milestone callout */}
            {overallProgress < 100 && (
              <div className="mt-4 md:mt-5 pt-4 md:pt-5 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-[var(--secondary-400)]" />
                  <span className="text-[var(--text-tertiary)] text-[11px] md:text-xs font-medium">
                    Next milestone:{" "}
                    <span className="text-[var(--secondary-400)] font-bold">
                      {Math.ceil(overallProgress / 25) * 25}%
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== CONTINUE LEARNING - HERO MISSION BRIEFING ========== */}
      <div className="hero-card rounded-2xl md:rounded-[24px] overflow-hidden">
        {/* Course image -- cinematic crop */}
        <div className="relative h-36 md:h-48 overflow-hidden">
          <img
            src={weekImages[currentWeek] || weekImages[1]}
            alt={weekTitles[currentWeek] || "Course"}
            className="w-full h-full object-cover"
          />
          {/* Multiple gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-surface)] via-[var(--bg-surface)]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-surface)]/40 to-transparent" />

          {/* Week badge on image */}
          <div className="absolute top-3 left-3 md:top-5 md:left-5">
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] flex items-center justify-center shadow-xl shadow-[var(--primary-500)]/30">
              <span className="text-white text-lg md:text-xl font-black">
                {currentWeek}
              </span>
            </div>
          </div>

          {/* Mission status indicator */}
          <div className="absolute top-3 right-3 md:top-5 md:right-5 flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1 md:py-2 rounded-full bg-[var(--bg-elevated)] shadow-md border border-[var(--border-subtle)]">
            <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse shadow-lg shadow-[var(--success)]/50" />
            <span className="text-[var(--text-primary)] text-[10px] md:text-xs font-bold uppercase tracking-wider">
              Ready
            </span>
          </div>

          {/* Bottom XP reward floating badge */}
          <div className="absolute bottom-3 right-3 md:bottom-5 md:right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--secondary-100)] shadow-sm border border-[var(--secondary-400)]/30">
            <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-[var(--secondary-400)]" />
            <span className="text-[var(--secondary-400)] text-xs md:text-sm font-bold">
              +250 XP
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="relative z-10 p-5 md:p-8 -mt-4">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-[var(--success)] animate-pulse" />
            <span className="text-[var(--success-light)] text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">
              Continue Mission
            </span>
          </div>

          <h3 className="text-[var(--text-primary)] text-xl md:text-3xl font-black mb-1.5 md:mb-2 tracking-tight leading-tight">
            {weekTitles[currentWeek] || "Getting Started"}
          </h3>
          <p className="text-[var(--text-muted)] text-xs md:text-sm mb-4 md:mb-5 max-w-lg">
            Week {currentWeek} of {totalWeeks} -- Complete this module to unlock
            the next stage of your financial training.
          </p>

          <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs md:text-sm mb-5 md:mb-6">
            <span className="flex items-center gap-1.5 text-[var(--text-tertiary)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--accent-400)]" />
              ~45 min
            </span>
            <span className="flex items-center gap-1.5 text-[var(--text-tertiary)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-lg">
              <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--primary-400)]" />5
              lessons
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => onNavigateToTab?.("courses")}
            className="cta-pulse w-full md:w-auto flex items-center justify-center gap-2.5 md:gap-3 px-7 md:px-10 py-3 md:py-3.5 rounded-xl md:rounded-2xl bg-gradient-to-r from-[var(--primary-500)] via-[var(--primary-600)] to-[var(--accent-500)] text-white text-sm md:text-base font-bold hover:-translate-y-1 hover:shadow-2xl hover:shadow-[var(--primary-500)]/40 transition-all duration-300"
          >
            Launch Mission
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* ========== RECENT PROGRESS ========== */}
      <div className="frost-card p-5 md:p-7">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-500)]/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[var(--accent-400)]" />
            </div>
            <h3 className="text-[var(--text-primary)] text-base md:text-lg font-bold tracking-tight">
              Recent Progress
            </h3>
          </div>
          <span className="text-[var(--text-muted)] text-[10px] md:text-xs font-medium uppercase tracking-wider">
            Last 3 weeks
          </span>
        </div>
        <div className="space-y-2">
          {[currentWeek - 2, currentWeek - 1, currentWeek]
            .filter((w) => w > 0)
            .map((week) => {
              const progress = courseProgress.find(
                (p) => p.week_number === week,
              );
              const isComplete = progress?.completed;
              const isCurrent = week === currentWeek;

              return (
                <div
                  key={week}
                  onClick={() => onNavigateToTab?.("courses")}
                  className={cn(
                    "flex items-center justify-between p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200",
                    "bg-[var(--bg-base)]/60 hover:bg-[var(--bg-subtle)] group",
                    isCurrent &&
                      "border border-[var(--primary-500)]/25 bg-[var(--primary-500)]/[0.04]",
                  )}
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200",
                        isComplete
                          ? "bg-[var(--success)]/15 shadow-sm shadow-[var(--success)]/10"
                          : isCurrent
                            ? "bg-[var(--primary-500)]/15"
                            : "bg-[var(--bg-subtle)]",
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[var(--success)]" />
                      ) : (
                        <span
                          className={cn(
                            "text-xs md:text-sm font-bold",
                            isCurrent
                              ? "text-[var(--primary-400)]"
                              : "text-[var(--text-muted)]",
                          )}
                        >
                          {week}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span
                        className={cn(
                          "text-xs md:text-sm font-semibold truncate block",
                          isComplete
                            ? "text-[var(--text-tertiary)]"
                            : "text-[var(--text-primary)]",
                        )}
                      >
                        {weekTitles[week]}
                      </span>
                      {isCurrent && !isComplete && (
                        <span className="text-[var(--primary-400)] text-[10px] font-medium">
                          Week {week}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isComplete && (
                      <span className="text-[var(--success)] text-[10px] md:text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[var(--success)]/10">
                        Complete
                      </span>
                    )}
                    {isCurrent && !isComplete && (
                      <span className="text-[var(--primary-400)] text-[10px] md:text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-[var(--primary-500)]/10">
                        In Progress
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ========== TWO COLUMN: GOALS + TROPHY CASE ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Weekly Goals */}
        <div className="frost-card p-5 md:p-7">
          <div className="flex items-center gap-2.5 mb-5 md:mb-7">
            <div className="w-8 h-8 rounded-lg bg-[var(--success)]/15 flex items-center justify-center">
              <Target className="w-4 h-4 text-[var(--success-light)]" />
            </div>
            <h3 className="text-[var(--text-primary)] text-base md:text-lg font-bold tracking-tight">
              Weekly Goals
            </h3>
          </div>

          <div className="space-y-5 md:space-y-6">
            {[
              {
                name: "Complete 3 modules",
                done: 2,
                total: 3,
                gradient: "from-[var(--success)] to-[var(--accent-500)]",
                color: "var(--success)",
              },
              {
                name: "Play 2 games",
                done: 1,
                total: 2,
                gradient: "from-[var(--secondary-400)] to-[#F97316]",
                color: "var(--secondary-500)",
              },
              {
                name: "Score 80%+ on quiz",
                done: 0,
                total: 1,
                gradient: "from-[var(--primary-500)] to-[var(--primary-700)]",
                color: "var(--primary-500)",
              },
            ].map((goal, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2 md:mb-2.5">
                  <span className="text-[var(--text-secondary)] text-xs md:text-sm font-medium">
                    {goal.name}
                  </span>
                  <span className="text-[var(--text-primary)] text-xs md:text-sm font-bold tabular-nums">
                    {goal.done}/{goal.total}
                  </span>
                </div>
                <div className="w-full bg-[var(--bg-subtle)] rounded-full h-2 md:h-2.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
                      goal.gradient,
                    )}
                    style={{
                      width: `${(goal.done / goal.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 md:mt-7 pt-4 md:pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[var(--text-muted)] text-xs md:text-sm font-medium">
              Complete all for bonus
            </span>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[var(--secondary-400)]" />
              <span className="text-[var(--secondary-400)] text-sm md:text-base font-black">
                +100 XP
              </span>
            </div>
          </div>
        </div>

        {/* Trophy Case */}
        <div className="frost-card p-5 md:p-7">
          <div className="flex items-center justify-between mb-5 md:mb-7">
            <div className="flex items-center gap-2.5 md:gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--secondary-400)]/15 flex items-center justify-center">
                <Star className="w-4 h-4 text-[var(--secondary-400)]" />
              </div>
              <h3 className="text-[var(--text-primary)] text-base md:text-lg font-bold tracking-tight">
                Trophy Case
              </h3>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-full bg-gradient-to-r from-[var(--secondary-500)]/20 to-[var(--secondary-400)]/10 border border-[var(--secondary-400)]/20">
              <span className="text-[var(--secondary-400)] text-xs md:text-sm font-black">
                {userAchievements.length}
              </span>
              <span className="text-[var(--text-muted)] text-xs md:text-sm font-medium">
                / {badges.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 md:gap-5">
            {badges.map((badge) => {
              const earned = userAchievements.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "badge-3d flex flex-col items-center p-2.5 md:p-5 rounded-xl md:rounded-2xl cursor-pointer",
                    earned
                      ? "bg-gradient-to-b from-[var(--bg-subtle)] to-[var(--bg-base)] badge-earned-glow border border-[var(--secondary-400)]/15"
                      : "bg-[var(--bg-base)]/40 border border-[var(--border-subtle)] hover:border-[var(--border-default)]",
                  )}
                >
                  <div
                    className={cn(
                      "relative mb-2 md:mb-3",
                      !earned && "grayscale opacity-25",
                    )}
                  >
                    <img
                      src={badge.image}
                      alt={badge.name}
                      className="w-12 h-12 md:w-20 md:h-20 object-contain drop-shadow-lg"
                    />
                    {earned && (
                      <div className="absolute -bottom-0.5 -right-0.5 md:-bottom-1 md:-right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[var(--success)] flex items-center justify-center border-2 border-[var(--bg-base)] shadow-lg shadow-[var(--success)]/30">
                        <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] md:text-xs text-center font-semibold line-clamp-2 leading-tight",
                      earned
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-muted)]",
                    )}
                  >
                    {badge.name}
                  </span>
                  {!earned && (
                    <span className="text-[8px] md:text-[10px] text-[var(--text-muted)] mt-0.5 md:mt-1 uppercase tracking-wider font-medium">
                      Locked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========== RECENT ACTIVITY ========== */}
      <div className="frost-card p-5 md:p-7">
        <div className="flex items-center gap-2.5 mb-5 md:mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-500)]/15 flex items-center justify-center">
            <Clock className="w-4 h-4 text-[var(--primary-400)]" />
          </div>
          <h3 className="text-[var(--text-primary)] text-base md:text-lg font-bold tracking-tight">
            Recent Activity
          </h3>
        </div>
        <div className="space-y-2 md:space-y-3">
          {[
            {
              icon: BookOpen,
              text: "Started your training journey",
              time: "Just now",
              color: "var(--primary-400)",
              bgColor: "var(--primary-500)",
            },
            {
              icon: CheckCircle,
              text: "Enrolled in financial literacy program",
              time: "Today",
              color: "var(--success-light)",
              bgColor: "var(--success)",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 md:gap-4 p-3.5 md:p-4 rounded-xl bg-[var(--bg-base)]/60 hover:bg-[var(--bg-subtle)] transition-all duration-200 group cursor-default"
            >
              <div
                className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: `color-mix(in srgb, ${item.bgColor} 12%, transparent)`,
                }}
              >
                <item.icon
                  className="w-4 h-4 md:w-5 md:h-5"
                  style={{ color: item.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] text-xs md:text-sm font-medium truncate">
                  {item.text}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--text-muted)] flex-shrink-0 bg-[var(--bg-subtle)] px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span className="text-[10px] md:text-xs font-medium">
                  {item.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
