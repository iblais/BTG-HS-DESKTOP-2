/**
 * Assignment Submission Modal for BTG Platform
 * Allows students to submit assignments and view AI feedback
 */

import { useState } from 'react';
import {
  X, Send, Loader2, CheckCircle, AlertTriangle,
  Star, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { submitAssignment, type Assignment } from '@/lib/assignments';

interface AssignmentSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekNumber: number;
  weekTitle: string;
  moduleId: string;
  assignmentPrompt: string;
  previousAttempts?: Assignment[];
}

export function AssignmentSubmissionModal({
  isOpen,
  onClose,
  weekNumber,
  weekTitle,
  moduleId,
  assignmentPrompt,
  previousAttempts = [],
}: AssignmentSubmissionModalProps) {
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Assignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!response.trim()) {
      setError('Please write a response before submitting.');
      return;
    }

    if (response.trim().split(/\s+/).length < 10) {
      setError('Your response is too short. Please write at least 10 words.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    const { success, assignment, error: submitError } = await submitAssignment({
      moduleId,
      responseText: response,
      timeSpentSeconds: timeSpent,
    });

    setSubmitting(false);

    if (success && assignment) {
      setResult(assignment);
    } else {
      setError(submitError || 'Failed to submit. Please try again.');
    }
  };

  const handleRetry = () => {
    setResponse('');
    setResult(null);
    setError(null);
  };

  const getScoreDisplay = (score: 'full' | 'half' | 'none' | null) => {
    switch (score) {
      case 'full':
        return {
          label: 'Full Credit',
          color: 'text-[#50D890]',
          bg: 'bg-[#50D890]/20',
          icon: CheckCircle,
          stars: 3,
        };
      case 'half':
        return {
          label: 'Half Credit',
          color: 'text-[#FFD700]',
          bg: 'bg-[#FFD700]/20',
          icon: AlertTriangle,
          stars: 2,
        };
      case 'none':
      default:
        return {
          label: 'Needs Improvement',
          color: 'text-[#FF6B35]',
          bg: 'bg-[#FF6B35]/20',
          icon: RotateCcw,
          stars: 0,
        };
    }
  };

  // Result view
  if (result) {
    const scoreInfo = getScoreDisplay(result.ai_score);
    const ScoreIcon = scoreInfo.icon;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#0A0E27] border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Assignment Graded</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Score Display */}
          <div className="p-6">
            <div className={cn('rounded-xl p-6 text-center mb-6', scoreInfo.bg)}>
              <ScoreIcon className={cn('w-12 h-12 mx-auto mb-3', scoreInfo.color)} />
              <h3 className={cn('text-2xl font-bold mb-2', scoreInfo.color)}>
                {scoreInfo.label}
              </h3>
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-6 h-6',
                      star <= scoreInfo.stars
                        ? 'text-[#FFD700] fill-[#FFD700]'
                        : 'text-white/20'
                    )}
                  />
                ))}
              </div>
              <p className="text-white/60 text-sm">
                Attempt #{result.attempt_number}
              </p>
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-2">Feedback</h4>
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/80 text-sm leading-relaxed">
                  {result.ai_feedback}
                </p>
              </div>
            </div>

            {/* Your Response */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-2">Your Response</h4>
              <div className="bg-white/5 rounded-lg p-4 max-h-32 overflow-y-auto">
                <p className="text-white/60 text-sm leading-relaxed">
                  {result.response_text}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {result.ai_score !== 'full' && (
                <button
                  onClick={handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#4A5FFF] text-white hover:bg-[#3A4FEF] transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Submission form
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0E27] border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">Assignment</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          <p className="text-white/60 text-sm">Week {weekNumber}: {weekTitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Prompt */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-2">Your Task</h3>
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/80 text-sm leading-relaxed">
                {assignmentPrompt}
              </p>
            </div>
          </div>

          {/* Previous Attempts */}
          {previousAttempts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-white/60 text-sm mb-2">
                Previous Attempts: {previousAttempts.length}
              </h4>
              <div className="flex gap-2">
                {previousAttempts.slice(0, 3).map((attempt, i) => {
                  const info = getScoreDisplay(attempt.ai_score);
                  return (
                    <div
                      key={attempt.id}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        info.bg,
                        info.color
                      )}
                    >
                      #{i + 1}: {info.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Response Input */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-medium">Your Response</h3>
              <span className="text-white/40 text-xs">
                {response.split(/\s+/).filter(w => w.length > 0).length} words
              </span>
            </div>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your response here... Be specific and include examples from your own experience."
              className="w-full h-48 bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#4A5FFF] transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Tips */}
          <div className="mb-6 p-3 rounded-lg bg-white/5">
            <p className="text-white/60 text-xs">
              <strong className="text-white/80">Tips for full credit:</strong> Include specific examples, explain your reasoning, and connect concepts to real-life situations.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !response.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all',
              submitting || !response.trim()
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] text-white hover:opacity-90'
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Grading...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Assignment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignmentSubmissionModal;
