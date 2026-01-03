import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { type Enrollment } from '@/lib/enrollment';
import {
  BookOpen, CheckCircle, Play, Clock,
  ChevronRight, Loader2, GraduationCap, Zap,
  FileText, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  week1Image, week2Image, week3Image, week4Image,
  week5Image, week6Image, week7Image, week8Image,
  week9Image, week10Image, week11Image, week12Image,
  week13Image, week14Image, week15Image, week16Image,
  week17Image, week18Image
} from '@/assets';
import { LessonScreen } from './LessonScreen';
import { QuizScreen } from './QuizScreen';

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

interface CoursesScreenProps {
  enrollment: Enrollment | null;
}

interface CourseProgress {
  week_number: number;
  completed: boolean;
  score: number;
}

interface Week {
  number: number;
  title: string;
  description: string;
  modules: number;
  duration: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progress: number;
}

type ViewMode = 'list' | 'lesson' | 'quiz';

export function CoursesScreen({ enrollment }: CoursesScreenProps) {
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeWeek, setActiveWeek] = useState<number>(1);

  const totalWeeks = enrollment?.program_id === 'HS' ? 18 : 16;

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) return;

      const { data } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('week_number', { ascending: true });

      if (data) setCourseProgress(data);
    } catch (err) {
      console.error('Failed to load progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const weekTitles: Record<number, { title: string; description: string }> = {
    1: { title: 'Understanding Income, Expenses & Savings', description: 'Learn to track your money flow' },
    2: { title: 'Increasing Your Income & Reach Your Goal', description: 'Strategies to earn more' },
    3: { title: 'What is Credit?', description: 'How credit works and its importance' },
    4: { title: 'How to Build & Maintain Good Credit', description: 'Building a strong credit history' },
    5: { title: 'How to Build Credit & Avoid Debt Traps', description: 'Staying out of harmful debt' },
    6: { title: 'How to Open & Manage a Bank Account', description: 'Opening and managing accounts' },
    7: { title: 'Create a Personal Budget', description: 'Creating your spending plan' },
    8: { title: 'Create Your Spending Plan', description: 'Making money work for you' },
    9: { title: 'Personal Branding & Professionalism', description: 'Building your professional image' },
    10: { title: 'Resume Building & Job Applications', description: 'Creating an impressive resume' },
    11: { title: 'Career Readiness & Leadership', description: 'Preparing for the workforce' },
    12: { title: 'Networking & Professional Connections', description: 'Building professional connections' },
    13: { title: 'Entrepreneurship & Career Planning', description: 'Starting your own business' },
    14: { title: 'Entrepreneurship Workshop Project', description: 'Apply what you learned' },
    15: { title: 'Community Showcase', description: 'Present your achievements' },
    16: { title: 'Financial Wellness & Future Planning', description: 'Long-term financial success' },
    17: { title: 'Life Skills & Financial Independence', description: 'Achieving true FI' },
    18: { title: 'Graduation & Certification', description: 'Celebrate your success!' },
  };

  const handleStartLesson = (weekNum: number) => {
    setActiveWeek(weekNum);
    setViewMode('lesson');
    setSelectedWeek(null);
  };

  const handleStartQuiz = (weekNum: number) => {
    setActiveWeek(weekNum);
    setViewMode('quiz');
    setSelectedWeek(null);
  };

  const handleLessonComplete = async (completed: boolean) => {
    if (completed) {
      // Update progress in database
      try {
        const user = await getCurrentUser();
        if (user) {
          const existingProgress = courseProgress.find(p => p.week_number === activeWeek);
          if (existingProgress) {
            await supabase
              .from('course_progress')
              .update({ score: 50 })
              .eq('user_id', user.id)
              .eq('week_number', activeWeek);
          } else {
            await supabase
              .from('course_progress')
              .insert({
                user_id: user.id,
                week_number: activeWeek,
                score: 50,
                completed: false
              });
          }
          await loadProgress();
        }
      } catch (err) {
        console.error('Failed to save progress:', err);
      }
    }
    setViewMode('list');
  };

  const handleQuizComplete = async (score: number, passed: boolean) => {
    if (passed) {
      // Update progress in database
      try {
        const user = await getCurrentUser();
        if (user) {
          const percentage = Math.round((score / 10) * 100);
          await supabase
            .from('course_progress')
            .upsert({
              user_id: user.id,
              week_number: activeWeek,
              score: percentage,
              completed: true
            }, { onConflict: 'user_id,week_number' });
          await loadProgress();
        }
      } catch (err) {
        console.error('Failed to save quiz result:', err);
      }
    }
    setViewMode('list');
  };

  const getWeekStatus = (weekNum: number): Week['status'] => {
    const progress = courseProgress.find(p => p.week_number === weekNum);
    if (progress?.completed) return 'completed';
    if (progress) return 'in_progress';

    // DEMO MODE: All courses unlocked for presentation
    // TODO: Remove this for production
    return 'available';
  };

  const getWeekProgress = (weekNum: number): number => {
    const progress = courseProgress.find(p => p.week_number === weekNum);
    if (progress?.completed) return 100;
    return progress?.score || 0;
  };

  const weeks: Week[] = Array.from({ length: totalWeeks }, (_, i) => {
    const num = i + 1;
    const info = weekTitles[num] || { title: `Week ${num}`, description: 'Coming soon' };
    return {
      number: num,
      title: info.title,
      description: info.description,
      modules: 5,
      duration: '45 min',
      status: getWeekStatus(num),
      progress: getWeekProgress(num),
    };
  });

  const completedCount = weeks.filter(w => w.status === 'completed').length;
  const overallProgress = Math.round((completedCount / totalWeeks) * 100);

  // Show LessonScreen
  if (viewMode === 'lesson') {
    const week = weeks.find(w => w.number === activeWeek);
    return (
      <LessonScreen
        weekNumber={activeWeek}
        weekTitle={week?.title || `Week ${activeWeek}`}
        trackLevel={enrollment?.track_level || 'beginner'}
        onBack={() => setViewMode('list')}
        onComplete={handleLessonComplete}
      />
    );
  }

  // Show QuizScreen
  if (viewMode === 'quiz') {
    const week = weeks.find(w => w.number === activeWeek);
    return (
      <QuizScreen
        weekNumber={activeWeek}
        weekTitle={week?.title || `Week ${activeWeek}`}
        onBack={() => setViewMode('list')}
        onComplete={handleQuizComplete}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#4A5FFF] animate-spin" />
          <p className="text-white/60">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Progress Overview - EXCITING VERSION */}
      <div className="hero-card rounded-2xl p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-500)] to-[var(--secondary-500)] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Your Learning Program</h3>
                <p className="text-[var(--text-tertiary)] text-sm">
                  {enrollment?.program_id === 'HS' ? 'High School' : 'College'} Track
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[48px] font-black gradient-text-primary leading-none">{overallProgress}%</p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">{completedCount} of {totalWeeks} weeks complete</p>
          </div>
        </div>

        {/* Progress Bar with Shimmer */}
        <div className="relative w-full bg-white/[0.08] rounded-full h-4 mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary-500)] via-[var(--success)] to-[var(--secondary-500)] transition-all duration-500 progress-shimmer"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Milestone Markers */}
        <div className="flex justify-between items-center px-1">
          {[0, 25, 50, 75, 100].map((milestone) => (
            <div key={milestone} className="flex flex-col items-center">
              <div className={cn(
                "milestone-marker",
                overallProgress >= milestone && "completed",
                overallProgress >= milestone - 10 && overallProgress < milestone && "current"
              )} />
              <span className={cn(
                "text-xs mt-1.5 font-semibold",
                overallProgress >= milestone ? "text-[var(--success)]" : "text-[var(--text-muted)]"
              )}>{milestone}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weeks Grid - EXCITING VERSION WITH IMAGES */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {weeks.map((week) => (
          <div
            key={week.number}
            onClick={() => week.status !== 'locked' && setSelectedWeek(week.number)}
            className={cn(
              "course-card-lift rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group",
              week.status === 'completed'
                ? "bg-gradient-to-br from-[var(--success)]/10 to-[var(--bg-elevated)] border-2 border-[var(--success)]/30"
                : week.status === 'in_progress'
                ? "bg-gradient-to-br from-[var(--primary-500)]/10 to-[var(--bg-elevated)] border-2 border-[var(--primary-500)]/30"
                : "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--primary-500)]/30"
            )}
          >
            {/* Course Image */}
            <div className="relative h-36 overflow-hidden">
              <img
                src={weekImages[week.number]}
                alt={week.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />

              {/* Week Badge on Image */}
              <div className="absolute top-3 left-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm",
                  week.status === 'completed'
                    ? "bg-[var(--success)]/90"
                    : week.status === 'in_progress'
                    ? "bg-[var(--primary-500)]/90"
                    : "bg-black/50"
                )}>
                  {week.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-lg font-black text-white">{week.number}</span>
                  )}
                </div>
              </div>

              {/* Status Badge on Image */}
              <div className="absolute top-3 right-3">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm",
                  week.status === 'completed'
                    ? "bg-[var(--success)]/90 text-white"
                    : week.status === 'in_progress'
                    ? "bg-[var(--primary-500)]/90 text-white"
                    : "bg-black/50 text-white/80"
                )}>
                  {week.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                  {week.status === 'in_progress' && <Zap className="w-3 h-3" />}
                  {week.status === 'completed' ? 'Complete' :
                   week.status === 'in_progress' ? 'In Progress' : 'Ready'}
                </div>
              </div>

              {/* Pulse indicator for in-progress */}
              {week.status === 'in_progress' && (
                <div className="absolute bottom-3 right-3">
                  <div className="w-3 h-3 rounded-full bg-[var(--success)] animate-pulse shadow-lg shadow-[var(--success)]/50" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <h4 className="text-[var(--text-primary)] font-bold text-lg mb-1 group-hover:text-[var(--primary-500)] transition-colors">
                {week.title}
              </h4>
              <p className="text-[var(--text-tertiary)] text-sm mb-4">
                {week.description}
              </p>

              {/* Progress Bar */}
              <div className="relative w-full bg-white/[0.08] rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    week.status === 'completed'
                      ? "bg-gradient-to-r from-[var(--success)] to-[var(--success-dark)]"
                      : "bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] progress-shimmer"
                  )}
                  style={{ width: `${week.progress}%` }}
                />
              </div>

              {/* Footer Stats */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {week.modules} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {week.duration}
                  </span>
                </div>
                <span className={cn(
                  "font-bold",
                  week.status === 'completed' ? "text-[var(--success)]" : "text-[var(--primary-500)]"
                )}>
                  {week.progress}%
                </span>
              </div>

              {/* XP Reward Badge */}
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[var(--text-muted)] text-xs">Complete for</span>
                <div className="flex items-center gap-1.5 text-[var(--secondary-500)] font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  +150 XP
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Week Modal */}
      {selectedWeek && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedWeek(null)}
        >
          <div
            className="bg-[#0A0E27] border border-white/[0.1] rounded-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const week = weeks.find(w => w.number === selectedWeek)!;
              return (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-white/40 text-sm mb-1">Week {week.number}</p>
                      <h3 className="text-xl font-bold text-white">{week.title}</h3>
                      <p className="text-white/60 text-sm mt-1">{week.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedWeek(null)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modules */}
                  <div className="space-y-3 mb-6">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors cursor-pointer"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          i < Math.floor(week.progress / 20) ? "bg-[#50D890]/20" : "bg-white/5"
                        )}>
                          {i < Math.floor(week.progress / 20) ? (
                            <CheckCircle className="w-5 h-5 text-[#50D890]" />
                          ) : (
                            <Play className="w-5 h-5 text-white/40" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">Module {i + 1}</p>
                          <p className="text-white/40 text-sm">Lesson content</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30" />
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleStartLesson(week.number)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] text-white font-semibold hover:opacity-90 transition-opacity"
                    >
                      <FileText className="w-5 h-5" />
                      {week.progress > 0 && week.progress < 100 ? 'Continue Lesson' : 'Start Lesson'}
                    </button>
                    <button
                      onClick={() => handleStartQuiz(week.number)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/[0.1] text-white hover:bg-white/[0.05] transition-colors"
                    >
                      <HelpCircle className="w-5 h-5" />
                      Take Quiz
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
