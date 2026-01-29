import { useState, useEffect } from 'react';
import {
  ArrowLeft, FileText, CheckCircle,
  Award, TrendingUp, Calendar, Loader2, ChevronDown,
  ChevronRight, Star, BookOpen
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button3D } from '../ui/Button3D';
import { supabase } from '@/lib/supabase';
import {
  getStudentActivities,
  getStudentQuizScores,
  getActivityGrade,
  type ActivityResponse,
  WEEK_TITLES
} from '@/lib/teacher';

interface StudentWorkViewProps {
  studentId: string;
  onBack: () => void;
  onGradeActivity: (activity: ActivityResponse) => void;
}

interface StudentProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  xp: number;
  level: number;
  streak_days: number;
}

export function StudentWorkView({ studentId, onBack, onGradeActivity }: StudentWorkViewProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [quizScores, setQuizScores] = useState<{ week_number: number; score: number; passed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [grades, setGrades] = useState<Record<string, { grade: number; feedback?: string }>>({});

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      // Load student profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', studentId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load activities and quiz scores
      const [activitiesData, quizData] = await Promise.all([
        getStudentActivities(studentId),
        getStudentQuizScores(studentId)
      ]);

      setActivities(activitiesData);
      setQuizScores(quizData);

      // Load grades for activities
      const gradePromises = activitiesData.map(async (activity) => {
        const grade = await getActivityGrade(studentId, activity.week_number, activity.day_number);
        if (grade) {
          return { key: `${activity.week_number}-${activity.day_number}`, grade };
        }
        return null;
      });

      const gradeResults = await Promise.all(gradePromises);
      const gradesMap: Record<string, { grade: number; feedback?: string }> = {};
      gradeResults.forEach(result => {
        if (result) {
          gradesMap[result.key] = {
            grade: result.grade.grade,
            feedback: result.grade.feedback
          };
        }
      });
      setGrades(gradesMap);

    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group activities by week
  const activitiesByWeek = activities.reduce((acc, activity) => {
    const week = activity.week_number;
    if (!acc[week]) acc[week] = [];
    acc[week].push(activity);
    return acc;
  }, {} as Record<number, ActivityResponse[]>);

  // Calculate overall stats
  const totalActivities = activities.length;
  const gradedActivities = Object.keys(grades).length;
  const weeksWithWork = Object.keys(activitiesByWeek).length;
  const averageQuizScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((sum, q) => sum + q.score, 0) / quizScores.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#4A5FFF] animate-spin" />
          <p className="text-white/60">Loading student work...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Student Work</h2>
          <p className="text-white/50 text-sm">Review and grade submissions</p>
        </div>
      </div>

      {/* Student Profile Card */}
      {profile && (
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#4A5FFF] to-[#7B8AFF] flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {(profile.display_name || profile.email).charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">
                {profile.display_name || profile.email.split('@')[0]}
              </h3>
              <p className="text-white/50">{profile.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1 text-[#FFD700]">
                  <Star className="w-4 h-4" />
                  Level {profile.level}
                </span>
                <span className="flex items-center gap-1 text-[#50D890]">
                  <TrendingUp className="w-4 h-4" />
                  {profile.xp} XP
                </span>
                <span className="flex items-center gap-1 text-white/50">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4A5FFF]/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#4A5FFF]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalActivities}</p>
              <p className="text-white/50 text-sm">Activities</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#50D890]/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#50D890]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{gradedActivities}</p>
              <p className="text-white/50 text-sm">Graded</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{weeksWithWork}</p>
              <p className="text-white/50 text-sm">Weeks</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{averageQuizScore}%</p>
              <p className="text-white/50 text-sm">Quiz Avg</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quiz Scores */}
      {quizScores.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FFD700]" />
            Quiz Scores
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {quizScores.map(quiz => (
              <div
                key={quiz.week_number}
                className={`p-4 rounded-xl text-center ${
                  quiz.passed
                    ? 'bg-[#50D890]/10 border border-[#50D890]/30'
                    : 'bg-[#FF6B35]/10 border border-[#FF6B35]/30'
                }`}
              >
                <p className="text-white/50 text-xs mb-1">Week {quiz.week_number}</p>
                <p className={`text-2xl font-bold ${
                  quiz.passed ? 'text-[#50D890]' : 'text-[#FF6B35]'
                }`}>
                  {quiz.score}%
                </p>
                <p className={`text-xs ${
                  quiz.passed ? 'text-[#50D890]/70' : 'text-[#FF6B35]/70'
                }`}>
                  {quiz.passed ? 'Passed' : 'Not Passed'}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Activities by Week */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#4A5FFF]" />
          Writing Assignments
        </h3>

        {Object.keys(activitiesByWeek).length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No writing assignments submitted yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(activitiesByWeek)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([week, weekActivities]) => {
                const weekNum = Number(week);
                const isExpanded = expandedWeek === weekNum;
                const weekQuiz = quizScores.find(q => q.week_number === weekNum);

                return (
                  <div key={week} className="rounded-xl border border-white/[0.06] overflow-hidden">
                    {/* Week Header */}
                    <button
                      onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                      className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#4A5FFF]/20 flex items-center justify-center">
                          <span className="text-[#4A5FFF] font-bold">{week}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">
                            Week {week}: {WEEK_TITLES[weekNum] || 'Financial Literacy'}
                          </p>
                          <p className="text-white/50 text-sm">
                            {weekActivities.length} activit{weekActivities.length === 1 ? 'y' : 'ies'}
                            {weekQuiz && ` | Quiz: ${weekQuiz.score}%`}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-white/40" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/40" />
                      )}
                    </button>

                    {/* Expanded Activities */}
                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-white/[0.01]">
                        {weekActivities
                          .sort((a, b) => a.day_number - b.day_number)
                          .map(activity => {
                            const gradeKey = `${activity.week_number}-${activity.day_number}`;
                            const activityGrade = grades[gradeKey];

                            return (
                              <div
                                key={activity.id}
                                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <p className="text-white font-medium">
                                      Module {activity.day_number}
                                    </p>
                                    <p className="text-white/50 text-sm">
                                      Submitted {new Date(activity.submitted_at).toLocaleDateString()}
                                    </p>
                                  </div>

                                  {activityGrade ? (
                                    <div className="flex items-center gap-2">
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        activityGrade.grade >= 80 ? 'bg-[#50D890]/20 text-[#50D890]' :
                                        activityGrade.grade >= 60 ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                                        'bg-[#FF6B35]/20 text-[#FF6B35]'
                                      }`}>
                                        {activityGrade.grade}/100
                                      </span>
                                      <CheckCircle className="w-5 h-5 text-[#50D890]" />
                                    </div>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/50 text-sm">
                                      Not Graded
                                    </span>
                                  )}
                                </div>

                                {/* Response Text */}
                                <div className="bg-white/[0.02] rounded-lg p-4 mb-3">
                                  <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">
                                    {activity.response_text}
                                  </p>
                                </div>

                                {/* Feedback if graded */}
                                {activityGrade?.feedback && (
                                  <div className="bg-[#4A5FFF]/10 rounded-lg p-3 mb-3">
                                    <p className="text-[#4A5FFF] text-xs font-medium mb-1">Teacher Feedback</p>
                                    <p className="text-white/70 text-sm">{activityGrade.feedback}</p>
                                  </div>
                                )}

                                {/* Grade Button */}
                                <Button3D
                                  variant={activityGrade ? 'secondary' : 'primary'}
                                  size="sm"
                                  onClick={() => onGradeActivity(activity)}
                                >
                                  {activityGrade ? 'Update Grade' : 'Grade This Work'}
                                </Button3D>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
