import { useState, useEffect } from 'react';
import {
  Users, BookOpen, CheckCircle, TrendingUp,
  ChevronRight, Plus, Search, Loader2,
  GraduationCap, FileText, Award, BarChart3
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button3D } from '../ui/Button3D';
import {
  getTeacherClasses,
  getAllTeacherStudents,
  createClass,
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
  const [creating, setCreating] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

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
      const newClass = await createClass(newClassName.trim());
      if (newClass) {
        setClasses(prev => [newClass, ...prev]);
        setNewClassName('');
        setShowCreateClass(false);
      }
    } catch (err) {
      console.error('Failed to create class:', err);
    } finally {
      setCreating(false);
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
          <Loader2 className="h-10 w-10 text-[#4A5FFF] animate-spin" />
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
            <div className="w-12 h-12 rounded-xl bg-[#4A5FFF]/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#4A5FFF]" />
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
          <div className="w-10 h-10 rounded-lg bg-[#4A5FFF]/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-[#4A5FFF]" />
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

      {/* Classes Section */}
      {classes.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#4A5FFF]" />
            Your Classes
          </h3>

          <div className="grid gap-3">
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(selectedClass === cls.id ? null : cls.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  selectedClass === cls.id
                    ? 'bg-[#4A5FFF]/20 border-[#4A5FFF]/50'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                } border`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4A5FFF]/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#4A5FFF]" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{cls.name}</p>
                    <p className="text-white/50 text-sm">
                      Created {new Date(cls.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${
                  selectedClass === cls.id ? 'rotate-90' : ''
                }`} />
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-4">Create New Class</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Class Name</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g., Period 1 - Financial Literacy"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4A5FFF]"
                />
              </div>

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
          </GlassCard>
        </div>
      )}

      {/* Students Section */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#4A5FFF]" />
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
              className="pl-10 pr-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#4A5FFF] text-sm w-64"
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
              Add students to your classes to see them here
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A5FFF] to-[#7B8AFF] flex items-center justify-center">
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
                    className="px-4 py-1.5 rounded-lg bg-[#4A5FFF]/20 text-[#4A5FFF] text-sm hover:bg-[#4A5FFF]/30 transition-colors"
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
