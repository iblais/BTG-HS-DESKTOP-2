import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { type Enrollment } from '@/lib/enrollment';
import {
  BookOpen, CheckCircle, Play, Clock,
  ChevronRight, Loader2, GraduationCap, Zap,
  FileText, HelpCircle, Award, Lock
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
import { FinalExamScreen } from './FinalExamScreen';

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
  quiz_completed: boolean;
  lesson_completed: boolean;
  score: number;
  best_quiz_score?: number;
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

type ViewMode = 'list' | 'lesson' | 'quiz' | 'final_exam';

export function CoursesScreen({ enrollment }: CoursesScreenProps) {
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [startSection, setStartSection] = useState<number>(0);
  // Track which modules have activities completed per week: { weekNumber: [day1Complete, day2Complete, ...] }
  const [weekActivities, setWeekActivities] = useState<Record<number, boolean[]>>({});
  // Locked week message
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);

  const totalWeeks = enrollment?.program_id === 'HS' ? 18 : 16;

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000); // Max 5 seconds loading

    Promise.all([loadProgress(), loadActivityProgress()])
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => clearTimeout(timeout);
  }, []);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

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

  // Load activity completions to determine quiz lock status
  const loadActivityProgress = async () => {
    const activities: Record<number, boolean[]> = {};

    // 1. First check localStorage for all weeks (1-18)
    for (let week = 1; week <= 18; week++) {
      for (let section = 0; section < 5; section++) {
        const localKey = `btg_activity_${week}_${section}`;
        if (localStorage.getItem(localKey)) {
          if (!activities[week]) {
            activities[week] = [false, false, false, false, false];
          }
          activities[week][section] = true;
        }
      }
      // Also check quiz completion in localStorage
      const quizKey = `btg_quiz_complete_${week}`;
      if (localStorage.getItem(quizKey)) {
        if (!activities[week]) {
          activities[week] = [false, false, false, false, false];
        }
        // Mark all activities as complete if quiz is done
        activities[week] = [true, true, true, true, true];
      }
    }

    // 2. Then try database (will merge with localStorage data)
    try {
      const user = await getCurrentUser();
      if (user) {
        const { data } = await supabase
          .from('activity_responses')
          .select('week_number, day_number')
          .eq('user_id', user.id);

        if (data && data.length > 0) {
          data.forEach((item: { week_number: number; day_number: number }) => {
            if (!activities[item.week_number]) {
              activities[item.week_number] = [false, false, false, false, false];
            }
            if (item.day_number >= 1 && item.day_number <= 5) {
              activities[item.week_number][item.day_number - 1] = true;
            }
          });
        }
      }
    } catch (err) {
      console.error('Error loading activity progress from database:', err);
    }

    setWeekActivities(activities);
  };

  // Check if quiz is unlocked for a week - all quizzes are now unlocked
  const isQuizUnlocked = (_weekNum: number): boolean => {
    // All quizzes are unlocked - students can take any quiz at any time
    return true;
  };

  // Get count of completed modules for a week
  const getCompletedModuleCount = (weekNum: number): number => {
    const activities = weekActivities[weekNum];
    if (!activities) return 0;
    return activities.filter(completed => completed === true).length;
  };

  // High School week titles (18 weeks)
  const hsWeekTitles: Record<number, { title: string; description: string }> = {
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

  // College week titles (16 weeks) - More advanced topics
  const collegeWeekTitles: Record<number, { title: string; description: string }> = {
    1: { title: 'Student Loans Mastery', description: 'Understanding federal vs private loans' },
    2: { title: 'Credit Building Fundamentals', description: 'Your first credit card and credit score' },
    3: { title: 'Smart Budgeting for College Life', description: 'Meal plans, textbooks, and real scenarios' },
    4: { title: 'Banking Essentials', description: 'Accounts, apps, and avoiding fees' },
    5: { title: 'Taxes & Financial Aid', description: 'W-2s, FAFSA, and education credits' },
    6: { title: 'Maximizing Your Income', description: 'Part-time jobs, internships, side hustles' },
    7: { title: 'Debt Management Strategies', description: 'Prioritizing payments and avoiding traps' },
    8: { title: 'Introduction to Investing', description: 'Stocks, ETFs, and compound interest' },
    9: { title: 'Retirement Planning 101', description: '401k, Roth IRA, and starting early' },
    10: { title: 'Career Preparation', description: 'Salary negotiation and understanding benefits' },
    11: { title: 'Housing & Renting', description: 'Leases, roommates, and utilities' },
    12: { title: 'Insurance Fundamentals', description: 'Health, auto, and renters insurance' },
    13: { title: 'Advanced Credit Strategies', description: 'Building excellent credit and rewards' },
    14: { title: 'Wealth Building Foundations', description: 'Long-term strategies and diversification' },
    15: { title: 'Entrepreneurship & Freelancing', description: 'Starting your own business or side gig' },
    16: { title: 'Financial Independence Planning', description: 'Your roadmap to FI' },
  };

  // Select the right week titles based on program
  const weekTitles = enrollment?.program_id === 'COLLEGE' ? collegeWeekTitles : hsWeekTitles;

  const handleStartLesson = (weekNum: number, section: number = 0) => {
    setActiveWeek(weekNum);
    setStartSection(section);
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
      // Save lesson completion to localStorage for offline support
      const lessonKey = `btg_lesson_complete_${activeWeek}`;
      localStorage.setItem(lessonKey, JSON.stringify({ completed: true, timestamp: Date.now() }));

      // Update progress in database
      try {
        const user = await getCurrentUser();
        if (user) {
          const enrollmentId = enrollment?.id || null;

          await supabase
            .from('course_progress')
            .upsert({
              user_id: user.id,
              enrollment_id: enrollmentId,
              week_number: activeWeek,
              score: 50,
              completed: false,
              lesson_completed: true
            }, { onConflict: 'user_id,week_number' });

          await loadProgress();
        }
      } catch (err) {
        console.error('Failed to save progress:', err);
      }
    }
    setViewMode('list');
  };

  const handleQuizComplete = async (score: number, passed: boolean, answers: number[] = [], timeTaken: number = 0, writingResponses?: string[]) => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const percentage = Math.round((score / 10) * 100);
        const enrollmentId = enrollment?.id || null;

        // Always save quiz attempt to quiz_attempts table (pass or fail)
        const answersObject: Record<number, number> = {};
        answers.forEach((answer, index) => {
          answersObject[index] = answer;
        });

        // Only insert if we have a valid enrollment
        if (enrollmentId) {
          await supabase
            .from('quiz_attempts')
            .insert({
              user_id: user.id,
              enrollment_id: enrollmentId,
              week_number: activeWeek,
              score: score,
              total_questions: 10,
              passed: passed,
              time_taken_seconds: timeTaken,
              answers: answersObject,
              completed_at: new Date().toISOString()
            });
        }

        // Save writing prompt responses to activity_grades table
        if (writingResponses && writingResponses.length > 0) {
          try {
            for (let i = 0; i < writingResponses.length; i++) {
              await supabase
                .from('activity_grades')
                .insert({
                  user_id: user.id,
                  enrollment_id: enrollmentId,
                  week_number: activeWeek,
                  activity_type: `writing_prompt_${i + 1}`,
                  response_text: writingResponses[i]
                });
            }
          } catch (err) {
            console.warn('Could not save writing responses:', err);
          }
        }

        // Update course_progress if passed
        if (passed) {
          await supabase
            .from('course_progress')
            .upsert({
              user_id: user.id,
              enrollment_id: enrollmentId,
              week_number: activeWeek,
              score: percentage,
              completed: true,
              quiz_completed: true,
              best_quiz_score: percentage,
              completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,week_number' });

          // Save quiz completion to localStorage for offline support
          const quizKey = `btg_quiz_complete_${activeWeek}`;
          localStorage.setItem(quizKey, JSON.stringify({ passed: true, score: percentage, timestamp: Date.now() }));
        }

        await loadProgress();
      }
    } catch (err) {
      console.error('Failed to save quiz result:', err);
    }
    setViewMode('list');
  };

  // Save progress when each section is completed (fire and forget - don't block UI)
  const handleSectionComplete = (sectionIndex: number, totalSections: number) => {
    // Save activity to localStorage immediately for offline support
    const activityKey = `btg_activity_${activeWeek}_${sectionIndex}`;
    localStorage.setItem(activityKey, JSON.stringify({ completed: true, timestamp: Date.now() }));

    // If all sections done, mark lesson complete in localStorage
    if (sectionIndex + 1 >= totalSections) {
      const lessonKey = `btg_lesson_complete_${activeWeek}`;
      localStorage.setItem(lessonKey, JSON.stringify({ completed: true, timestamp: Date.now() }));
    }

    // Run async database save without blocking
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;

        const enrollmentId = enrollment?.id || null;

        // Calculate progress percentage based on sections completed
        const progressPercent = Math.round(((sectionIndex + 1) / totalSections) * 50);

        // Save to course_progress for overall tracking
        await supabase
          .from('course_progress')
          .upsert({
            user_id: user.id,
            enrollment_id: enrollmentId,
            week_number: activeWeek,
            score: progressPercent,
            completed: false,
            lesson_completed: sectionIndex + 1 >= totalSections
          }, { onConflict: 'user_id,week_number' });

        // Save to lesson_progress for detailed section tracking
        if (enrollmentId) {
          await supabase
            .from('lesson_progress')
            .upsert({
              user_id: user.id,
              enrollment_id: enrollmentId,
              week_number: activeWeek,
              section_index: sectionIndex,
              completed: true,
              completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,week_number,section_index' });
        }
      } catch (err) {
        console.error('Failed to save section progress:', err);
      }
    })();
  };

  const getWeekStatus = (weekNum: number): Week['status'] => {
    // Check database progress
    const progress = courseProgress.find(p => p.week_number === weekNum);

    // Check localStorage for quiz completion (offline support)
    const localQuizKey = `btg_quiz_complete_${weekNum}`;
    const localQuiz = localStorage.getItem(localQuizKey);

    // Week is completed if database says so OR localStorage has quiz completion
    if (progress?.completed || progress?.quiz_completed || localQuiz) return 'completed';

    // Check localStorage for lesson progress
    const localLessonKey = `btg_lesson_complete_${weekNum}`;
    const localLesson = localStorage.getItem(localLessonKey);

    if (progress || localLesson) return 'in_progress';

    // All courses are unlocked - students can access any course at any time
    return 'available';
  };

  const getWeekProgress = (weekNum: number): number => {
    const progress = courseProgress.find(p => p.week_number === weekNum);

    // Check localStorage for quiz completion
    const localQuiz = localStorage.getItem(`btg_quiz_complete_${weekNum}`);
    if (progress?.completed || progress?.quiz_completed || localQuiz) return 100;

    // Calculate from activities completed
    const activities = weekActivities[weekNum];
    if (activities) {
      const completedCount = activities.filter(a => a).length;
      // 5 activities = 50% (lesson), quiz adds another 50%
      return Math.round((completedCount / 5) * 50);
    }

    return progress?.score || 0;
  };

  // Handle week card click - block if locked
  const handleWeekClick = (week: Week) => {
    if (week.status === 'locked') {
      setLockedMessage(`Complete Week ${week.number - 1} to unlock Week ${week.number}`);
      // Auto-dismiss after 3 seconds
      setTimeout(() => setLockedMessage(null), 3000);
      return;
    }
    setSelectedWeek(week.number);
  };

  const weeks: Week[] = Array.from({ length: totalWeeks }, (_, i) => {
    const num = i + 1;
    const info = weekTitles[num] || { title: `Week ${num}`, description: 'Coming soon' };
    return {
      number: num,
      title: info.title,
      description: info.description,
      modules: 4,
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
        programId={enrollment?.program_id || 'HS'}
        startSection={startSection}
        enrollmentId={enrollment?.id || null}
        onBack={() => setViewMode('list')}
        onComplete={handleLessonComplete}
        onSectionComplete={handleSectionComplete}
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
        programId={enrollment?.program_id || 'HS'}
        onBack={() => setViewMode('list')}
        onComplete={handleQuizComplete}
      />
    );
  }

  // Show FinalExamScreen
  if (viewMode === 'final_exam') {
    return (
      <FinalExamScreen
        onBack={() => setViewMode('list')}
        onComplete={async (score, passed) => {
          if (passed) {
            try {
              const user = await getCurrentUser();
              if (user) {
                // Save final exam result
                await supabase
                  .from('course_progress')
                  .upsert({
                    user_id: user.id,
                    week_number: 999, // Special week number for final exam
                    score: Math.round((score / 50) * 100),
                    completed: true
                  }, { onConflict: 'user_id,week_number' });
              }
            } catch (err) {
              console.error('Failed to save final exam result:', err);
            }
          }
          setViewMode('list');
        }}
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
    <div className="w-full space-y-8 pb-6 md:pb-0">
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

      {/* Final Exam Card */}
      <div
        onClick={() => setViewMode('final_exam')}
        className="hero-card rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-all duration-300 group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] flex items-center justify-center shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white group-hover:text-[#9B59B6] transition-colors">
                Final Certification Exam
              </h3>
              <p className="text-[var(--text-tertiary)] text-sm mt-1">
                50 questions covering all course material - 70% to pass
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-white/60 text-sm">Earn your</p>
              <p className="text-[#9B59B6] font-bold">Financial Literacy Certificate</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-[#9B59B6] transition-colors" />
          </div>
        </div>
      </div>

      {/* Locked Week Message */}
      {lockedMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#FF6B35] text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <Lock className="w-5 h-5" />
            <span className="font-medium">{lockedMessage}</span>
          </div>
        </div>
      )}

      {/* Weeks Grid - EXCITING VERSION WITH IMAGES */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {weeks.map((week) => (
          <div
            key={week.number}
            onClick={() => handleWeekClick(week)}
            className={cn(
              "course-card-lift rounded-2xl overflow-hidden transition-all duration-300 group",
              week.status === 'locked'
                ? "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] opacity-60 cursor-not-allowed"
                : "cursor-pointer",
              week.status === 'completed'
                ? "bg-gradient-to-br from-[var(--success)]/10 to-[var(--bg-elevated)] border-2 border-[var(--success)]/30"
                : week.status === 'in_progress'
                ? "bg-gradient-to-br from-[var(--primary-500)]/10 to-[var(--bg-elevated)] border-2 border-[var(--primary-500)]/30"
                : week.status === 'available'
                ? "bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--primary-500)]/30"
                : ""
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
                    : week.status === 'locked'
                    ? "bg-black/70"
                    : "bg-black/50"
                )}>
                  {week.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : week.status === 'locked' ? (
                    <Lock className="w-5 h-5 text-white/60" />
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
                    : week.status === 'locked'
                    ? "bg-black/70 text-white/60"
                    : "bg-black/50 text-white/80"
                )}>
                  {week.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                  {week.status === 'in_progress' && <Zap className="w-3 h-3" />}
                  {week.status === 'locked' && <Lock className="w-3 h-3" />}
                  {week.status === 'completed' ? 'Complete' :
                   week.status === 'in_progress' ? 'In Progress' :
                   week.status === 'locked' ? 'Locked' : 'Ready'}
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6"
          onClick={() => setSelectedWeek(null)}
        >
          <div
            className="bg-[#0A0E27] border border-white/[0.1] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const week = weeks.find(w => w.number === selectedWeek)!;
              return (
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-white/40 text-sm mb-1">Week {week.number}</p>
                      <h3 className="text-xl font-bold text-white">{week.title}</h3>
                      <p className="text-white/60 text-sm mt-1">{week.description}</p>
                    </div>
                    <button
                      onClick={() => setSelectedWeek(null)}
                      className="text-white/40 hover:text-white transition-colors flex-shrink-0 ml-4"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Modules - Clickable with locking */}
                  <div className="space-y-3 mb-6">
                    {Array.from({ length: 4 }, (_, i) => {
                      const activities = weekActivities[week.number] || [false, false, false, false];
                      const isModuleComplete = activities[i] === true;
                      // All modules are unlocked - students can access any module at any time
                      const isModuleUnlocked = true;

                      return (
                        <div
                          key={i}
                          onClick={() => isModuleUnlocked && handleStartLesson(week.number, i)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-xl transition-all",
                            isModuleUnlocked
                              ? "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-[#4A5FFF]/30 cursor-pointer active:scale-[0.98]"
                              : "bg-white/[0.02] border border-white/[0.03] cursor-not-allowed opacity-50"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            isModuleComplete ? "bg-[#50D890]/20" : !isModuleUnlocked ? "bg-white/5" : "bg-white/5"
                          )}>
                            {isModuleComplete ? (
                              <CheckCircle className="w-5 h-5 text-[#50D890]" />
                            ) : !isModuleUnlocked ? (
                              <Lock className="w-5 h-5 text-white/30" />
                            ) : (
                              <Play className="w-5 h-5 text-white/40" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={cn("font-medium", isModuleUnlocked ? "text-white" : "text-white/50")}>
                              Module {i + 1}
                            </p>
                            <p className="text-white/40 text-sm">
                              {isModuleComplete ? 'Completed' : !isModuleUnlocked ? 'Complete previous module' : 'Tap to start'}
                            </p>
                          </div>
                          <ChevronRight className={cn("w-5 h-5", isModuleUnlocked ? "text-white/30" : "text-white/20")} />
                        </div>
                      );
                    })}
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
                      onClick={() => isQuizUnlocked(week.number) && handleStartQuiz(week.number)}
                      disabled={!isQuizUnlocked(week.number)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                        isQuizUnlocked(week.number)
                          ? 'border-white/[0.1] text-white hover:bg-white/[0.05]'
                          : 'border-white/[0.05] text-white/40 cursor-not-allowed'
                      }`}
                    >
                      {isQuizUnlocked(week.number) ? (
                        <>
                          <HelpCircle className="w-5 h-5" />
                          Take Quiz
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          <span className="text-xs">Complete all modules ({getCompletedModuleCount(week.number)}/4)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
