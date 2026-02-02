import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2, ChevronDown, ChevronUp, Bot } from 'lucide-react';
import { getAutoGrade, type AutoGrade } from '@/lib/autoGrading';
import { getCurrentUser } from '@/lib/auth';

interface AutoGradeDisplayProps {
  weekNumber: number;
  dayNumber: number;
  showDetailed?: boolean;
  className?: string;
}

export function AutoGradeDisplay({
  weekNumber,
  dayNumber,
  showDetailed = true,
  className = ''
}: AutoGradeDisplayProps) {
  const [autoGrade, setAutoGrade] = useState<AutoGrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadAutoGrade();
  }, [weekNumber, dayNumber]);

  const loadAutoGrade = async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const grade = await getAutoGrade(user.id, weekNumber, dayNumber);
      setAutoGrade(grade);
    } catch (err) {
      console.error('Error loading auto-grade:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 p-4 rounded-xl bg-[#4A5FFF]/10 border border-[#4A5FFF]/20 ${className}`}>
        <Loader2 className="w-5 h-5 text-[#4A5FFF] animate-spin" />
        <span className="text-white/60 text-sm">Checking for grade...</span>
      </div>
    );
  }

  if (!autoGrade) {
    return null; // No grade available yet
  }

  const getGradeColor = (pct: number): string => {
    if (pct >= 90) return 'text-[#50D890]';
    if (pct >= 80) return 'text-[#4ADE80]';
    if (pct >= 70) return 'text-[#FFD700]';
    if (pct >= 60) return 'text-[#FFA500]';
    return 'text-[#FF6B35]';
  };

  const getGradeLetter = (pct: number): string => {
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  const finalScore = autoGrade.teacher_adjusted_score ?? autoGrade.total_score;
  const finalPercentage = Math.round((finalScore / (autoGrade.max_score || 100)) * 100);

  return (
    <div className={`rounded-xl bg-gradient-to-br from-[#4A5FFF]/10 to-[#50D890]/5 border border-[#4A5FFF]/30 overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#4A5FFF]/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#4A5FFF]" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">Your Grade</span>
              <Sparkles className="w-4 h-4 text-[#FFD700]" />
              {autoGrade.teacher_reviewed && (
                <span className="px-2 py-0.5 rounded-full bg-[#50D890]/20 text-[#50D890] text-xs">
                  Teacher Reviewed
                </span>
              )}
            </div>
            <span className="text-white/50 text-sm">
              Week {weekNumber}, Module {dayNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-2xl font-bold ${getGradeColor(finalPercentage)}`}>
              {finalPercentage}%
            </p>
            <p className="text-white/50 text-xs">
              Grade: {getGradeLetter(finalPercentage)}
            </p>
          </div>
          {showDetailed && (
            expanded ? (
              <ChevronUp className="w-5 h-5 text-white/40" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/40" />
            )
          )}
        </div>
      </button>

      {/* Detailed View */}
      {showDetailed && expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06]">
          {/* Score Breakdown */}
          {autoGrade.rubric_scores && (
            <div className="pt-3">
              <p className="text-white/60 text-xs mb-2">Score Breakdown:</p>
              <div className="space-y-1">
                {Object.entries(autoGrade.rubric_scores).map(([criterion, score]) => (
                  <div key={criterion} className="flex justify-between items-center p-2 rounded bg-white/[0.03]">
                    <span className="text-white/70 text-sm">{criterion}</span>
                    <span className="text-[#4A5FFF] font-semibold text-sm">{score as number}/25</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Feedback */}
          {autoGrade.ai_feedback && (
            <div className="p-3 rounded-lg bg-white/[0.03]">
              <p className="text-white/60 text-xs mb-1">Feedback:</p>
              <p className="text-white/80 text-sm">{autoGrade.ai_feedback}</p>
            </div>
          )}

          {/* Teacher Feedback (if any) */}
          {autoGrade.teacher_feedback && (
            <div className="p-3 rounded-lg bg-[#50D890]/10 border border-[#50D890]/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#50D890]" />
                <p className="text-[#50D890] text-xs font-medium">Teacher Feedback:</p>
              </div>
              <p className="text-white/80 text-sm">{autoGrade.teacher_feedback}</p>
            </div>
          )}

          {/* Score Comparison if teacher adjusted */}
          {autoGrade.teacher_adjusted_score !== null && autoGrade.teacher_adjusted_score !== autoGrade.total_score && (
            <div className="flex items-center justify-between p-2 rounded bg-white/[0.03] text-sm">
              <span className="text-white/60">AI Score:</span>
              <span className="text-white/40 line-through">{autoGrade.total_score}</span>
              <span className="text-white/60">→</span>
              <span className="text-[#50D890] font-semibold">Final: {autoGrade.teacher_adjusted_score}</span>
            </div>
          )}

          {/* Timestamp */}
          <p className="text-white/30 text-xs text-right">
            Graded: {new Date(autoGrade.graded_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

// Export a hook for programmatic access
export function useAutoGrade(weekNumber: number, dayNumber: number) {
  const [autoGrade, setAutoGrade] = useState<AutoGrade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        if (!user) {
          setLoading(false);
          return;
        }
        const grade = await getAutoGrade(user.id, weekNumber, dayNumber);
        setAutoGrade(grade);
      } catch (err) {
        console.error('Error loading auto-grade:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [weekNumber, dayNumber]);

  return { autoGrade, loading };
}
