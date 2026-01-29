import { useState, useEffect } from 'react';
import {
  ArrowLeft, FileText, Save,
  Loader2, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button3D } from '../ui/Button3D';
import {
  gradeActivity,
  getActivityGrade,
  DEFAULT_WRITING_RUBRIC,
  type ActivityResponse,
  type GradingRubric,
  WEEK_TITLES
} from '@/lib/teacher';

interface GradingInterfaceProps {
  activity: ActivityResponse;
  studentName: string;
  onBack: () => void;
  onGradeComplete: () => void;
}

export function GradingInterface({
  activity,
  studentName,
  onBack,
  onGradeComplete
}: GradingInterfaceProps) {
  const [rubric] = useState<GradingRubric>(DEFAULT_WRITING_RUBRIC);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [showRubric, setShowRubric] = useState(true);
  const [existingGrade, setExistingGrade] = useState<{
    grade: number;
    feedback?: string;
    rubric_scores?: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    loadExistingGrade();
  }, [activity]);

  const loadExistingGrade = async () => {
    const grade = await getActivityGrade(
      activity.user_id,
      activity.week_number,
      activity.day_number
    );

    if (grade) {
      setExistingGrade({
        grade: grade.grade,
        feedback: grade.feedback,
        rubric_scores: grade.rubric_scores
      });
      setFeedback(grade.feedback || '');
      if (grade.rubric_scores) {
        setRubricScores(grade.rubric_scores);
      }
    }
  };

  const handleRubricScoreChange = (criterionName: string, score: number, maxScore: number) => {
    setRubricScores(prev => ({
      ...prev,
      [criterionName]: Math.min(Math.max(0, score), maxScore)
    }));
  };

  const calculateTotalScore = (): number => {
    return Object.values(rubricScores).reduce((sum, score) => sum + score, 0);
  };

  const calculatePercentage = (): number => {
    const total = calculateTotalScore();
    return Math.round((total / rubric.total_points) * 100);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('[GradingInterface] Saving grade...', {
        activityId: activity.id,
        userId: activity.user_id,
        week: activity.week_number,
        day: activity.day_number,
        score: calculateTotalScore()
      });

      const result = await gradeActivity(
        activity.id,
        activity.user_id,
        activity.week_number,
        activity.day_number,
        calculateTotalScore(),
        rubric.total_points,
        feedback,
        rubric.id,
        rubricScores
      );

      if (result.success) {
        console.log('[GradingInterface] Grade saved successfully!');
        // Small delay to ensure database write completes
        await new Promise(resolve => setTimeout(resolve, 500));
        onGradeComplete();
      } else {
        console.error('[GradingInterface] Failed to save grade:', result.error);
        alert('Failed to save grade: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('[GradingInterface] Error saving grade:', err);
      alert('Error saving grade. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-[#50D890]';
    if (percentage >= 80) return 'text-[#4ADE80]';
    if (percentage >= 70) return 'text-[#FFD700]';
    if (percentage >= 60) return 'text-[#FFA500]';
    return 'text-[#FF6B35]';
  };

  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

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
          <h2 className="text-xl font-bold text-white">Grade Assignment</h2>
          <p className="text-white/50 text-sm">
            Week {activity.week_number}, Module {activity.day_number} - {studentName}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Student Response */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#4A5FFF]" />
            Student Response
          </h3>

          <div className="mb-4">
            <p className="text-white/50 text-sm mb-2">
              Week {activity.week_number}: {WEEK_TITLES[activity.week_number] || 'Financial Literacy'}
            </p>
            <p className="text-white/40 text-xs">
              Submitted {new Date(activity.submitted_at).toLocaleString()}
            </p>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
              {activity.response_text}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 text-white/40 text-sm">
            <span>{activity.response_text.length} characters</span>
            <span>|</span>
            <span>{activity.response_text.split(/\s+/).length} words</span>
          </div>
        </GlassCard>

        {/* Grading Panel */}
        <div className="space-y-6">
          {/* Score Summary */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Score</h3>
              {existingGrade && (
                <span className="px-3 py-1 rounded-full bg-[#50D890]/20 text-[#50D890] text-sm">
                  Previously Graded
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 py-4">
              <div className="text-center">
                <p className={`text-5xl font-bold ${getScoreColor(calculatePercentage())}`}>
                  {calculateTotalScore()}
                </p>
                <p className="text-white/50 text-sm mt-1">/ {rubric.total_points} points</p>
              </div>
              <div className="w-px h-16 bg-white/10" />
              <div className="text-center">
                <p className={`text-5xl font-bold ${getScoreColor(calculatePercentage())}`}>
                  {calculatePercentage()}%
                </p>
                <p className="text-white/50 text-sm mt-1">
                  Grade: {getGradeLetter(calculatePercentage())}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Rubric */}
          <GlassCard className="p-6">
            <button
              onClick={() => setShowRubric(!showRubric)}
              className="w-full flex items-center justify-between mb-4"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-[#FFD700]" />
                Grading Rubric
              </h3>
              {showRubric ? (
                <ChevronUp className="w-5 h-5 text-white/40" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/40" />
              )}
            </button>

            {showRubric && (
              <div className="space-y-4">
                {rubric.criteria.map((criterion) => (
                  <div
                    key={criterion.name}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-medium">{criterion.name}</p>
                        <p className="text-white/50 text-sm">{criterion.description}</p>
                      </div>
                      <span className="text-white/40 text-sm whitespace-nowrap ml-4">
                        Max: {criterion.max_points}
                      </span>
                    </div>

                    {/* Score Slider */}
                    <div className="mt-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max={criterion.max_points}
                          value={rubricScores[criterion.name] || 0}
                          onChange={(e) => handleRubricScoreChange(
                            criterion.name,
                            Number(e.target.value),
                            criterion.max_points
                          )}
                          className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#4A5FFF]"
                        />
                        <input
                          type="number"
                          min="0"
                          max={criterion.max_points}
                          value={rubricScores[criterion.name] || 0}
                          onChange={(e) => handleRubricScoreChange(
                            criterion.name,
                            Number(e.target.value),
                            criterion.max_points
                          )}
                          className="w-16 px-2 py-1 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white text-center focus:outline-none focus:border-[#4A5FFF]"
                        />
                      </div>

                      {/* Quick Score Buttons */}
                      <div className="flex gap-2 mt-2">
                        {[0, 0.25, 0.5, 0.75, 1].map((multiplier) => {
                          const score = Math.round(criterion.max_points * multiplier);
                          const isSelected = rubricScores[criterion.name] === score;
                          return (
                            <button
                              key={multiplier}
                              onClick={() => handleRubricScoreChange(
                                criterion.name,
                                score,
                                criterion.max_points
                              )}
                              className={`px-3 py-1 rounded text-xs transition-colors ${
                                isSelected
                                  ? 'bg-[#4A5FFF] text-white'
                                  : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1]'
                              }`}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Feedback */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Teacher Feedback</h3>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback for the student..."
              rows={4}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#4A5FFF] resize-none"
            />

            {/* Quick Feedback Templates */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                'Great understanding of the concept!',
                'Good effort, but needs more detail.',
                'Please review the lesson material.',
                'Excellent real-world application!',
              ].map((template) => (
                <button
                  key={template}
                  onClick={() => setFeedback(prev =>
                    prev ? `${prev}\n\n${template}` : template
                  )}
                  className="px-3 py-1 rounded-full bg-white/[0.05] text-white/60 text-xs hover:bg-white/[0.1] transition-colors"
                >
                  + {template}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Save Button */}
          <Button3D
            variant="primary"
            onClick={handleSave}
            disabled={saving || Object.keys(rubricScores).length === 0}
            className="w-full"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />
                {existingGrade ? 'Update Grade' : 'Save Grade'}
              </span>
            )}
          </Button3D>
        </div>
      </div>
    </div>
  );
}
