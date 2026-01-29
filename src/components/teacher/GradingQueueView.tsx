import { useState, useEffect } from 'react';
import {
  ArrowLeft, FileText, CheckCircle, Clock,
  ChevronRight, Loader2, User, Calendar
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { supabase } from '@/lib/supabase';
import { type ActivityResponse, WEEK_TITLES, getAllGrades } from '@/lib/teacher';

interface ActivityWithStudent extends ActivityResponse {
  student_email: string;
  student_name: string | null;
  is_graded: boolean;
}

interface GradingQueueViewProps {
  onBack: () => void;
  onGradeActivity: (activity: ActivityResponse, studentName: string) => void;
}

export function GradingQueueView({ onBack, onGradeActivity }: GradingQueueViewProps) {
  const [activities, setActivities] = useState<ActivityWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ungraded' | 'graded'>('all');

  useEffect(() => {
    loadAllActivities();
  }, []);

  const loadAllActivities = async () => {
    setLoading(true);
    try {
      console.log('[GradingQueue] Loading all activities...');

      // First check auth status
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[GradingQueue] Current session:', session?.user?.email || 'NO SESSION');

      // Get all activity responses (without JOIN - foreign key not set up)
      const { data: activitiesData, error } = await supabase
        .from('activity_responses')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('[GradingQueue] Error loading activities:', error.message, error.details, error.hint);
        setActivities([]);
        return;
      }

      if (!activitiesData || activitiesData.length === 0) {
        console.log('[GradingQueue] No activities found');
        setActivities([]);
        return;
      }

      console.log('[GradingQueue] Found activities:', activitiesData.length);

      // Get unique user IDs
      const userIds = [...new Set(activitiesData.map(a => a.user_id))];
      console.log('[GradingQueue] Fetching info for', userIds.length, 'users');

      // Fetch user info separately
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, display_name')
        .in('id', userIds);

      // Create a map of user info
      const usersMap = new Map<string, { email: string; display_name: string | null }>();
      if (usersData) {
        usersData.forEach(user => {
          usersMap.set(user.id, { email: user.email, display_name: user.display_name });
        });
      }

      // Get all grades at once (efficient batch query)
      const gradesMap = await getAllGrades();
      console.log('[GradingQueue] Loaded grades:', gradesMap.size);

      // Combine activities with user info and grade status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activitiesWithGrades: ActivityWithStudent[] = activitiesData.map((activity: any) => {
        const gradeKey = `${activity.user_id}-${activity.week_number}-${activity.day_number}`;
        const grade = gradesMap.get(gradeKey);
        const userInfo = usersMap.get(activity.user_id);
        return {
          ...activity,
          student_email: userInfo?.email || 'Unknown',
          student_name: userInfo?.display_name || null,
          is_graded: !!grade,
        };
      });

      setActivities(activitiesWithGrades);
      console.log('[GradingQueue] Activities loaded successfully:', activitiesWithGrades.length);
    } catch (err) {
      console.error('[GradingQueue] Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'ungraded') return !activity.is_graded;
    if (filter === 'graded') return activity.is_graded;
    return true;
  });

  const ungradedCount = activities.filter(a => !a.is_graded).length;
  const gradedCount = activities.filter(a => a.is_graded).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#4A5FFF] animate-spin" />
          <p className="text-white/60">Loading all submissions...</p>
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
          <h2 className="text-xl font-bold text-white">Grading Queue</h2>
          <p className="text-white/50 text-sm">Review and grade all student submissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4A5FFF]/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#4A5FFF]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activities.length}</p>
              <p className="text-white/50 text-sm">Total</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{ungradedCount}</p>
              <p className="text-white/50 text-sm">Need Grading</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#50D890]/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#50D890]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{gradedCount}</p>
              <p className="text-white/50 text-sm">Graded</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-lg bg-white/[0.05] p-1 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            filter === 'all'
              ? 'bg-[#4A5FFF] text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          All ({activities.length})
        </button>
        <button
          onClick={() => setFilter('ungraded')}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            filter === 'ungraded'
              ? 'bg-[#FF6B35] text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Need Grading ({ungradedCount})
        </button>
        <button
          onClick={() => setFilter('graded')}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            filter === 'graded'
              ? 'bg-[#50D890] text-white'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Graded ({gradedCount})
        </button>
      </div>

      {/* Activities List */}
      <GlassCard className="p-6">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50">
              {filter === 'ungraded'
                ? 'No submissions need grading'
                : filter === 'graded'
                ? 'No graded submissions yet'
                : 'No submissions yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map(activity => (
              <button
                key={activity.id}
                onClick={() => onGradeActivity(activity, activity.student_name || activity.student_email.split('@')[0])}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-left"
              >
                {/* Status Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.is_graded
                    ? 'bg-[#50D890]/20'
                    : 'bg-[#FF6B35]/20'
                }`}>
                  {activity.is_graded ? (
                    <CheckCircle className="w-5 h-5 text-[#50D890]" />
                  ) : (
                    <Clock className="w-5 h-5 text-[#FF6B35]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-white/40" />
                    <span className="text-white font-medium">
                      {activity.student_name || activity.student_email.split('@')[0]}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/50 text-sm">
                      Week {activity.week_number}, Module {activity.day_number}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm truncate">
                    {WEEK_TITLES[activity.week_number] || 'Financial Literacy'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                    <Calendar className="w-3 h-3" />
                    {new Date(activity.submitted_at).toLocaleDateString()} at{' '}
                    {new Date(activity.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Preview of response */}
                <div className="hidden md:block w-48 text-white/40 text-sm truncate">
                  {activity.response_text.substring(0, 50)}...
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-white/30" />
              </button>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
