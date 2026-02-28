import { useState, useEffect } from 'react';
import {
  Users, BookOpen, CheckCircle, TrendingUp,
  ChevronRight, ChevronDown, Plus, Search, Loader2,
  GraduationCap, FileText, Award, BarChart3,
  Copy, RefreshCw, Trash2, X
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button3D } from '../ui/Button3D';
import {
  getTeacherClasses,
  getAllTeacherStudents,
  getClassStudents,
  createClass,
  generateClassCode,
  removeStudentFromClass,
  type Class,
  type StudentWithProgress
} from '@/lib/teacher';

interface TeacherDashboardProps {
  onViewStudent: (studentId: string) => void;
  onViewGrading: () => void;
  onViewStandards: () => void;
  onViewRubrics: () => void;
}

export function TeacherDashboard({
  onViewStudent,
  onViewGrading,
  onViewStandards,
  onViewRubrics
}: TeacherDashboardProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('');
  const [newClassSchool, setNewClassSchool] = useState('');
  const [creating, setCreating] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [classStudents, setClassStudents] = useState<Record<string, StudentWithProgress[]>>({});
  const [loadingClassStudents, setLoadingClassStudents] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [removingStudent, setRemovingStudent] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [classesData, studentsData] = await Promise.all([
        getTeacherClasses(),
        getAllTeacherStudents()
      ]);
      setClasses(classesData);
      setStudents(studentsData);
    } catch (err) {
      console.error('Failed to load teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;

    setCreating(true);
    try {
      const newClass = await createClass(
        newClassName.trim(),
        newClassGrade.trim() || undefined,
        newClassSchool.trim() || undefined
      );
      if (newClass) {
        setClasses(prev => [newClass, ...prev]);
        setNewClassName('');
        setNewClassGrade('');
        setNewClassSchool('');
        setShowCreateClass(false);
      }
    } catch (err) {
      console.error('Failed to create class:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleExpandClass = async (classId: string) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
      return;
    }

    setExpandedClass(classId);

    if (!classStudents[classId]) {
      setLoadingClassStudents(classId);
      try {
        const students = await getClassStudents(classId);
        setClassStudents(prev => ({ ...prev, [classId]: students }));
      } catch (err) {
        console.error('Failed to load class students:', err);
      } finally {
        setLoadingClassStudents(null);
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRegenerateCode = async (classId: string) => {
    setRegenerating(classId);
    try {
      const newCode = await generateClassCode(classId);
      if (newCode) {
        setClasses(prev => prev.map(cls =>
          cls.id === classId ? { ...cls, class_code: newCode } : cls
        ));
      }
    } catch (err) {
      console.error('Failed to regenerate code:', err);
    } finally {
      setRegenerating(null);
    }
  };

  const handleRemoveStudent = async (studentId: string, classId: string) => {
    if (!confirm('Remove this student from the class?')) return;

    setRemovingStudent(studentId);
    try {
      const result = await removeStudentFromClass(studentId, classId);
      if (result.success) {
        // Update local state
        setClassStudents(prev => ({
          ...prev,
          [classId]: (prev[classId] || []).filter(s => s.id !== studentId)
        }));
        setClasses(prev => prev.map(cls =>
          cls.id === classId ? { ...cls, student_count: (cls.student_count || 1) - 1 } : cls
        ));
        // Refresh all students
        const updatedStudents = await getAllTeacherStudents();
        setStudents(updatedStudents);
      }
    } catch (err) {
      console.error('Failed to remove student:', err);
    } finally {
      setRemovingStudent(null);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === '' ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.display_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  // Calculate stats
  const totalStudents = students.length;
  const averageProgress = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.weeks_completed / 18) * 100, 0) / students.length)
    : 0;
  const totalActivities = students.reduce((sum, s) => sum + s.total_activities, 0);
  const averageQuizScore = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.average_quiz_score, 0) / students.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#10B981] animate-spin" />
          <p className="text-white/60">Loading teacher dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-sm">Total Students</p>
              <p className="text-3xl font-bold text-white mt-1">{totalStudents}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#10B981]/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-sm">Avg. Progress</p>
              <p className="text-3xl font-bold text-white mt-1">{averageProgress}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#50D890]/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#50D890]" />
            </div>
          </div>
        </GlassCard>

        <button onClick={onViewGrading} className="text-left">
          <GlassCard className="p-5 hover:bg-white/[0.06] transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/50 text-sm">Activities Submitted</p>
                <p className="text-3xl font-bold text-white mt-1">{totalActivities}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#FF6B35]/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#FF6B35]" />
              </div>
            </div>
          </GlassCard>
        </button>

        <GlassCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/50 text-sm">Avg. Quiz Score</p>
              <p className="text-3xl font-bold text-white mt-1">{averageQuizScore}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-[#FFD700]" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={onViewGrading}
          className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <p className="text-white font-medium">Grade Work</p>
            <p className="text-white/50 text-sm">Review submissions</p>
          </div>
        </button>

        <button
          onClick={onViewStandards}
          className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-[#50D890]/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#50D890]" />
          </div>
          <div>
            <p className="text-white font-medium">Standards</p>
            <p className="text-white/50 text-sm">CA state standards</p>
          </div>
        </button>

        <button
          onClick={onViewRubrics}
          className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <div>
            <p className="text-white font-medium">Rubrics</p>
            <p className="text-white/50 text-sm">Grading criteria</p>
          </div>
        </button>

        <button
          onClick={() => setShowCreateClass(true)}
          className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-[#FFD700]/20 flex items-center justify-center">
            <Plus className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <p className="text-white font-medium">New Class</p>
            <p className="text-white/50 text-sm">Create a class</p>
          </div>
        </button>
      </div>

      {/* Classes Section with Join Codes & Roster */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#10B981]" />
          Your Classes
        </h3>

        {classes.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">No classes yet</p>
            <p className="text-white/30 text-sm mt-1">Create your first class to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map(cls => (
              <div key={cls.id} className="rounded-xl border border-white/[0.06] overflow-hidden">
                {/* Class Header */}
                <button
                  onClick={() => handleExpandClass(cls.id)}
                  className={`w-full flex items-center justify-between p-4 transition-all ${
                    expandedClass === cls.id
                      ? 'bg-[#10B981]/10'
                      : 'bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#10B981]/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">{cls.name}</p>
                      <div className="flex items-center gap-3 text-white/50 text-sm">
                        <span>{cls.student_count || 0} students</span>
                        {cls.grade_level && <span>{cls.grade_level}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Class Code Badge */}
                    {cls.class_code && (
                      <div
                        onClick={(e) => { e.stopPropagation(); handleCopyCode(cls.class_code!); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.1] cursor-pointer hover:bg-white/[0.1] transition-colors"
                      >
                        <span className="text-[#10B981] font-mono text-sm font-bold">{cls.class_code}</span>
                        <Copy className="w-3.5 h-3.5 text-white/40" />
                        {copiedCode === cls.class_code && (
                          <span className="text-[#50D890] text-xs">Copied!</span>
                        )}
                      </div>
                    )}
                    {expandedClass === cls.id ? (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                </button>

                {/* Expanded: Student Roster + Actions */}
                {expandedClass === cls.id && (
                  <div className="border-t border-white/[0.06] p-4 bg-white/[0.01]">
                    {/* Actions Row */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => handleRegenerateCode(cls.id)}
                        disabled={regenerating === cls.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/60 text-xs hover:bg-white/[0.1] transition-colors"
                      >
                        {regenerating === cls.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Regenerate Code
                      </button>
                    </div>

                    {/* Student List */}
                    {loadingClassStudents === cls.id ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 text-[#10B981] animate-spin" />
                        <span className="ml-2 text-white/50 text-sm">Loading students...</span>
                      </div>
                    ) : (classStudents[cls.id] || []).length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-white/40 text-sm">No students in this class yet</p>
                        <p className="text-white/30 text-xs mt-1">Share the class code with your students</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(classStudents[cls.id] || []).map(student => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {student.avatar_url ? (
                                <img src={student.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {(student.display_name || student.email).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-white text-sm font-medium">
                                  {student.display_name || student.email.split('@')[0]}
                                </p>
                                <p className="text-white/40 text-xs">{student.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right text-xs">
                                <span className="text-white/60">{student.weeks_completed}/18 weeks</span>
                              </div>
                              <button
                                onClick={() => onViewStudent(student.id)}
                                className="px-3 py-1 rounded-lg bg-[#10B981]/20 text-[#10B981] text-xs hover:bg-[#10B981]/30 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleRemoveStudent(student.id, cls.id)}
                                disabled={removingStudent === student.id}
                                className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                              >
                                {removingStudent === student.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateClass(false)}>
          <div className="w-full max-w-md p-6 glass-card rounded-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Create New Class</h3>
              <button onClick={() => setShowCreateClass(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Class Name *</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g., Period 1 - Financial Literacy"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#10B981]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">School Name</label>
                <input
                  type="text"
                  value={newClassSchool}
                  onChange={(e) => setNewClassSchool(e.target.value)}
                  placeholder="e.g., Lincoln High School"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Grade Level</label>
                <input
                  type="text"
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  placeholder="e.g., 10th Grade"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <p className="text-white/40 text-xs">A join code will be automatically generated for students.</p>

              <div className="flex gap-3">
                <Button3D
                  variant="secondary"
                  onClick={() => setShowCreateClass(false)}
                  className="flex-1"
                >
                  Cancel
                </Button3D>
                <Button3D
                  variant="primary"
                  onClick={handleCreateClass}
                  disabled={!newClassName.trim() || creating}
                  className="flex-1"
                >
                  {creating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Create Class'
                  )}
                </Button3D>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Students Section */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#10B981]" />
            All Students
          </h3>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students..."
              className="pl-10 pr-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#10B981] text-sm w-64"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">
              {searchQuery ? 'No students found' : 'No students enrolled yet'}
            </p>
            <p className="text-white/30 text-sm mt-1">
              Students join your classes using the class code
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-white/50 text-sm font-medium">
              <div className="col-span-4">Student</div>
              <div className="col-span-2 text-center">Progress</div>
              <div className="col-span-2 text-center">Activities</div>
              <div className="col-span-2 text-center">Quiz Avg</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>

            {/* Student Rows */}
            {filteredStudents.map(student => (
              <div
                key={student.id}
                className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="col-span-4 flex items-center gap-3">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399] flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {(student.display_name || student.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {student.display_name || student.email.split('@')[0]}
                    </p>
                    <p className="text-white/40 text-sm">{student.email}</p>
                  </div>
                </div>

                <div className="col-span-2 text-center">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#50D890] rounded-full transition-all"
                        style={{ width: `${(student.weeks_completed / 18) * 100}%` }}
                      />
                    </div>
                    <span className="text-white/70 text-sm">
                      {student.weeks_completed}/18
                    </span>
                  </div>
                </div>

                <div className="col-span-2 text-center">
                  <span className="text-white/70">{student.total_activities}</span>
                </div>

                <div className="col-span-2 text-center">
                  <span className={`font-medium ${
                    student.average_quiz_score >= 70 ? 'text-[#50D890]' :
                    student.average_quiz_score >= 50 ? 'text-[#FFD700]' :
                    'text-[#FF6B35]'
                  }`}>
                    {student.average_quiz_score}%
                  </span>
                </div>

                <div className="col-span-2 text-center">
                  <button
                    onClick={() => onViewStudent(student.id)}
                    className="px-4 py-1.5 rounded-lg bg-[#10B981]/20 text-[#10B981] text-sm hover:bg-[#10B981]/30 transition-colors"
                  >
                    View Work
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
