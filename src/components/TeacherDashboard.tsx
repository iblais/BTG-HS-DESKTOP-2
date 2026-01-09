/**
 * TeacherDashboard Component
 * Main dashboard for teachers to manage classes, view progress, and grade assignments
 */

import { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  FileCheck,
  TrendingUp,
  ChevronRight,
  Plus,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Loader2,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useFeatureFlag } from '@/lib/featureFlags';
import { teacherGradeAssignment } from '@/lib/aiGrading';
import type { Class, Teacher, Assignment, GradeScore, StudentProgress } from '@/lib/types';

// ============================================
// TYPES
// ============================================

interface TeacherDashboardProps {
  teacher: Teacher;
  onLogout?: () => void;
}

interface PendingAssignment extends Assignment {
  student_name: string;
  student_email: string;
  module_title: string;
  week_number: number;
  rubric_name?: string;
  rubric_full_criteria?: string;
  rubric_half_criteria?: string;
  rubric_no_criteria?: string;
}

interface ClassWithStats extends Class {
  student_count: number;
  average_progress: number;
  pending_assignments: number;
}

type TabId = 'overview' | 'grading' | 'students' | 'analytics';

// ============================================
// COMPONENT
// ============================================

export function TeacherDashboard({ teacher, onLogout }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassWithStats | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingAssignment, setGradingAssignment] = useState<PendingAssignment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const teacherDashboardEnabled = useFeatureFlag('teacherDashboard');

  // Load initial data
  useEffect(() => {
    loadClasses();
  }, [teacher.id]);

  // Load class-specific data when selected
  useEffect(() => {
    if (selectedClass) {
      loadPendingAssignments(selectedClass.id);
      loadStudents(selectedClass.id);
    }
  }, [selectedClass?.id]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          class_enrollments (count)
        `)
        .eq('teacher_id', teacher.id)
        .eq('is_active', true);

      if (error) throw error;

      // Transform data with stats
      const classesWithStats: ClassWithStats[] = (data || []).map((c: any) => ({
        ...c,
        student_count: c.class_enrollments?.[0]?.count || 0,
        average_progress: 0, // TODO: Calculate from progress
        pending_assignments: 0, // TODO: Count pending
      }));

      setClasses(classesWithStats);

      // Auto-select first class if available
      if (classesWithStats.length > 0 && !selectedClass) {
        setSelectedClass(classesWithStats[0]);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingAssignments = async (_classId: string) => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          users!assignments_user_id_fkey (display_name, email),
          modules (title, week_number),
          grading_rubrics (rubric_name, full_credit_criteria, half_credit_criteria, no_credit_criteria)
        `)
        .not('ai_score', 'is', null)
        .is('teacher_score', null)
        .order('response_submitted_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      const pending: PendingAssignment[] = (data || []).map((a: any) => ({
        ...a,
        student_name: a.users?.display_name || 'Unknown Student',
        student_email: a.users?.email || '',
        module_title: a.modules?.title || 'Unknown Module',
        week_number: a.modules?.week_number || 0,
        rubric_name: a.grading_rubrics?.rubric_name,
        rubric_full_criteria: a.grading_rubrics?.full_credit_criteria,
        rubric_half_criteria: a.grading_rubrics?.half_credit_criteria,
        rubric_no_criteria: a.grading_rubrics?.no_credit_criteria,
      }));

      setPendingAssignments(pending);
    } catch (error) {
      console.error('Failed to load pending assignments:', error);
    }
  };

  const loadStudents = async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          *,
          users!class_enrollments_student_id_fkey (id, display_name, email)
        `)
        .eq('class_id', classId);

      if (error) throw error;

      // Transform to StudentProgress
      const studentProgress: StudentProgress[] = (data || []).map((e: any) => ({
        student_id: e.users?.id || '',
        student_name: e.users?.display_name || 'Unknown',
        student_email: e.users?.email || '',
        current_week: 1,
        current_day: 1 as const,
        modules_completed: 0,
        total_modules: 0,
        completion_percentage: 0,
        assignments_submitted: 0,
        assignments_graded: 0,
        average_score: 0,
        quizzes_passed: 0,
        total_quizzes: 0,
        average_quiz_score: 0,
        last_activity: null,
      }));

      setStudents(studentProgress);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const handleGradeSubmit = async (score: GradeScore, feedback: string) => {
    if (!gradingAssignment) return;

    try {
      await teacherGradeAssignment(
        gradingAssignment.id,
        teacher.id,
        score,
        feedback
      );

      // Remove from pending list
      setPendingAssignments((prev) =>
        prev.filter((a) => a.id !== gradingAssignment.id)
      );

      setGradingAssignment(null);
    } catch (error) {
      console.error('Failed to save grade:', error);
    }
  };

  const handleCopyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Feature flag check
  if (!teacherDashboardEnabled) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Teacher Dashboard Coming Soon</h2>
          <p className="text-white/40">This feature is not yet enabled.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#4A5FFF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      {/* Header */}
      <header className="bg-[#0A0E27]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-xl">Teacher Dashboard</h1>
              <p className="text-white/40 text-sm">
                Welcome back, {teacher.display_name || teacher.email}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadClasses()}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-white/60 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-4 py-2 rounded-lg border border-white/[0.1] text-white/60 hover:bg-white/[0.05] transition-colors text-sm"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {[
              { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
              { id: 'grading' as const, label: 'Grading Queue', icon: FileCheck, badge: pendingAssignments.length },
              { id: 'students' as const, label: 'Students', icon: Users },
              { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-[#4A5FFF] text-white"
                    : "bg-white/[0.03] text-white/60 hover:bg-white/[0.06]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: students.length, icon: Users, color: '#4A5FFF' },
                { label: 'Active Classes', value: classes.length, icon: BookOpen, color: '#50D890' },
                { label: 'Pending Grades', value: pendingAssignments.length, icon: FileCheck, color: '#FF6B35' },
                { label: 'Avg Completion', value: '78%', icon: TrendingUp, color: '#00BFFF' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <span className="text-white/40 text-sm">{stat.label}</span>
                  </div>
                  <p className="text-white text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Classes List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-lg">Your Classes</h2>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4A5FFF] text-white text-sm font-medium hover:bg-[#5B6FFF] transition-colors">
                  <Plus className="w-4 h-4" />
                  Create Class
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {classes.map((classItem) => (
                  <button
                    key={classItem.id}
                    onClick={() => setSelectedClass(classItem)}
                    className={cn(
                      "w-full text-left p-5 rounded-2xl border transition-all",
                      selectedClass?.id === classItem.id
                        ? "bg-[#4A5FFF]/10 border-[#4A5FFF]/50"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{classItem.name}</h3>
                        <p className="text-white/40 text-sm">{classItem.school_year}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/20" />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{classItem.student_count} students</span>
                      </div>
                    </div>

                    {/* Join Code */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-white/40 text-xs">Join Code:</span>
                      <code className="px-2 py-1 bg-white/[0.05] rounded text-white font-mono text-sm">
                        {classItem.join_code}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyJoinCode(classItem.join_code);
                        }}
                        className="p-1 rounded hover:bg-white/[0.05] transition-colors"
                      >
                        {copiedCode === classItem.join_code ? (
                          <CheckCircle2 className="w-4 h-4 text-[#50D890]" />
                        ) : (
                          <Copy className="w-4 h-4 text-white/40" />
                        )}
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grading Queue Tab */}
        {activeTab === 'grading' && (
          <div className="space-y-4">
            {pendingAssignments.length === 0 ? (
              <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                <CheckCircle2 className="w-16 h-16 text-[#50D890] mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">All Caught Up!</h3>
                <p className="text-white/40">No assignments waiting for review.</p>
              </div>
            ) : (
              pendingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5"
                >
                  {/* Header with student info and metadata */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold">{assignment.student_name}</h3>
                      <p className="text-white/40 text-sm">
                        Week {assignment.week_number} • {assignment.module_title}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Attempt number badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05]">
                        <span className="text-white/40 text-xs">Attempt</span>
                        <span className="text-white font-medium text-sm">#{assignment.attempt_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/40 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(assignment.response_submitted_at || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rubric Reference (collapsible) */}
                  {assignment.rubric_name && (
                    <details className="mb-4 bg-white/[0.02] rounded-lg">
                      <summary className="px-3 py-2 cursor-pointer text-white/60 text-sm hover:text-white/80 transition-colors">
                        📋 {assignment.rubric_name} - View Rubric Criteria
                      </summary>
                      <div className="px-3 pb-3 grid grid-cols-3 gap-3 text-xs">
                        <div className="p-2 rounded bg-[#50D890]/10">
                          <p className="text-[#50D890] font-medium mb-1">Full Credit</p>
                          <p className="text-white/60">{assignment.rubric_full_criteria || 'Complete and thorough response'}</p>
                        </div>
                        <div className="p-2 rounded bg-yellow-500/10">
                          <p className="text-yellow-500 font-medium mb-1">Half Credit</p>
                          <p className="text-white/60">{assignment.rubric_half_criteria || 'Partial understanding shown'}</p>
                        </div>
                        <div className="p-2 rounded bg-red-500/10">
                          <p className="text-red-400 font-medium mb-1">No Credit</p>
                          <p className="text-white/60">{assignment.rubric_no_criteria || 'Incomplete or incorrect'}</p>
                        </div>
                      </div>
                    </details>
                  )}

                  {/* AI Grade with detailed feedback */}
                  <div className={cn(
                    "p-4 rounded-lg mb-4 border",
                    assignment.ai_score === 'full'
                      ? "bg-[#50D890]/10 border-[#50D890]/20"
                      : assignment.ai_score === 'half'
                        ? "bg-yellow-500/10 border-yellow-500/20"
                        : "bg-red-500/10 border-red-500/20"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">AI Recommendation:</span>
                        <span className={cn(
                          "font-semibold text-sm px-2 py-0.5 rounded",
                          assignment.ai_score === 'full'
                            ? "text-[#50D890] bg-[#50D890]/20"
                            : assignment.ai_score === 'half'
                              ? "text-yellow-500 bg-yellow-500/20"
                              : "text-red-400 bg-red-500/20"
                        )}>
                          {assignment.ai_score === 'full' && 'Full Credit'}
                          {assignment.ai_score === 'half' && 'Half Credit'}
                          {assignment.ai_score === 'none' && 'No Credit'}
                        </span>
                      </div>
                      {assignment.ai_model_used && (
                        <span className="text-white/30 text-xs">
                          via {assignment.ai_model_used}
                        </span>
                      )}
                    </div>
                    <p className="text-white/70 text-sm leading-relaxed">{assignment.ai_feedback}</p>
                  </div>

                  {/* Student Response */}
                  <div className="bg-white/[0.03] rounded-lg p-4 mb-4 border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white/40 text-xs font-medium uppercase tracking-wide">Student Response</p>
                      <span className="text-white/30 text-xs">
                        {assignment.time_spent_seconds ? `${Math.round(assignment.time_spent_seconds / 60)} min spent` : ''}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{assignment.response_text}</p>
                  </div>

                  {/* Grade Buttons with feedback input */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setGradingAssignment(assignment);
                          handleGradeSubmit('full', 'Excellent work! Your response demonstrates a strong understanding of the concepts.');
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-[#50D890] text-[#0A0E27] font-medium hover:bg-[#40C878] transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Full Credit
                      </button>
                      <button
                        onClick={() => {
                          setGradingAssignment(assignment);
                          handleGradeSubmit('half', 'Good effort! Consider adding more detail or examples to strengthen your response.');
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-yellow-500 text-[#0A0E27] font-medium hover:bg-yellow-400 transition-colors"
                      >
                        Half Credit
                      </button>
                      <button
                        onClick={() => {
                          setGradingAssignment(assignment);
                          handleGradeSubmit('none', 'Please review the lesson material and resubmit with a more complete response.');
                        }}
                        className="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-400 transition-colors"
                      >
                        No Credit
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#4A5FFF]"
              />
            </div>

            {/* Students Table - Enhanced with module/activity/quiz visibility */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-white/40 text-sm font-medium">Student</th>
                    <th className="text-left px-4 py-3 text-white/40 text-sm font-medium">Current Week</th>
                    <th className="text-left px-4 py-3 text-white/40 text-sm font-medium">Modules (4)</th>
                    <th className="text-left px-4 py-3 text-white/40 text-sm font-medium">Activities</th>
                    <th className="text-left px-4 py-3 text-white/40 text-sm font-medium">Quiz</th>
                    <th className="text-left px-4 py-3 text-white/40 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    // Determine if student is stuck (no activity in 3+ days)
                    const isStuck = student.last_activity
                      ? (Date.now() - new Date(student.last_activity).getTime()) > 3 * 24 * 60 * 60 * 1000
                      : true;

                    return (
                      <tr
                        key={student.student_id}
                        className={cn(
                          "border-b border-white/[0.04] hover:bg-white/[0.02]",
                          isStuck && "bg-red-500/5"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isStuck && (
                              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-white font-medium">{student.student_name}</p>
                              <p className="text-white/40 text-sm">{student.student_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">Week {student.current_week}</span>
                            <span className="text-white/40 text-sm">Day {student.current_day}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {/* Module completion dots: Days 1-4 */}
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map((day) => {
                              // Approximate module completion from percentage
                              const dayComplete = student.completion_percentage >= (day * 20);
                              return (
                                <div
                                  key={day}
                                  className={cn(
                                    "w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center",
                                    dayComplete
                                      ? "bg-[#50D890]/20 text-[#50D890]"
                                      : "bg-white/[0.06] text-white/30"
                                  )}
                                >
                                  {day}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "text-sm",
                            student.assignments_submitted >= 4 ? "text-[#50D890]" : "text-white/60"
                          )}>
                            {student.assignments_submitted}/4 submitted
                          </span>
                          {student.assignments_graded > 0 && (
                            <div className="text-xs text-white/40 mt-1">
                              Avg: {Math.round(student.average_score * 100)}%
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {student.quizzes_passed > 0 ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-[#50D890]" />
                                <span className="text-[#50D890] text-sm">
                                  {Math.round(student.average_quiz_score)}%
                                </span>
                              </>
                            ) : (
                              <span className="text-white/40 text-sm">
                                Not taken
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isStuck ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                              <AlertCircle className="w-3 h-3" />
                              Stuck
                            </span>
                          ) : student.completion_percentage >= 100 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#50D890]/20 text-[#50D890] rounded text-xs font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#4A5FFF]/20 text-[#4A5FFF] rounded text-xs font-medium">
                              <Clock className="w-3 h-3" />
                              In Progress
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Summary for stuck students */}
              {filteredStudents.filter(s => {
                const isStuck = s.last_activity
                  ? (Date.now() - new Date(s.last_activity).getTime()) > 3 * 24 * 60 * 60 * 1000
                  : true;
                return isStuck;
              }).length > 0 && (
                <div className="px-4 py-3 bg-red-500/5 border-t border-red-500/20">
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      {filteredStudents.filter(s => {
                        const isStuck = s.last_activity
                          ? (Date.now() - new Date(s.last_activity).getTime()) > 3 * 24 * 60 * 60 * 1000
                          : true;
                        return isStuck;
                      }).length} student(s) haven't been active in 3+ days
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
            <BarChart3 className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Analytics Coming Soon</h3>
            <p className="text-white/40">
              Detailed class analytics and reports will be available here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherDashboard;
