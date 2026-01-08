/**
 * ModuleView Component
 * Displays a single module's content including video, lesson, vocabulary, and assignment
 * Part of the new 5-day × 4-module structure
 */

import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  BookOpen,
  FileText,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  Loader2,
  ExternalLink,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeatureFlag } from '@/lib/featureFlags';
import type { Module, ModuleProgress, GradeScore } from '@/lib/types';

// ============================================
// TYPES
// ============================================

interface ModuleViewProps {
  module: Module;
  progress?: ModuleProgress | null;
  onProgressUpdate?: (progress: Partial<ModuleProgress>) => void;
  onAssignmentSubmit?: (response: string) => Promise<void>;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onBack?: () => void;
  assignmentGrade?: GradeScore | null;
  assignmentFeedback?: string | null;
}

type TabId = 'video' | 'lesson' | 'vocabulary' | 'activity' | 'assignment';

// ============================================
// COMPONENT
// ============================================

export function ModuleView({
  module,
  progress,
  onProgressUpdate,
  onAssignmentSubmit,
  onNavigate,
  hasPrev = false,
  hasNext = false,
  onBack,
  assignmentGrade,
  assignmentFeedback,
}: ModuleViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('lesson');
  const [assignmentText, setAssignmentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  const videoContainersEnabled = useFeatureFlag('videoContainers');

  // Determine starting tab based on content
  useEffect(() => {
    if (module.video_url && videoContainersEnabled) {
      setActiveTab('video');
    } else if (module.lesson_content) {
      setActiveTab('lesson');
    }
  }, [module.id, videoContainersEnabled]);

  // Mark lesson as read after viewing
  useEffect(() => {
    if (activeTab === 'lesson' && !progress?.lesson_read) {
      const timer = setTimeout(() => {
        onProgressUpdate?.({ lesson_read: true });
      }, 5000); // Mark as read after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [activeTab, progress?.lesson_read, onProgressUpdate]);

  const handleAssignmentSubmit = async () => {
    if (!assignmentText.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onAssignmentSubmit?.(assignmentText);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { id: TabId; label: string; icon: typeof BookOpen; available: boolean }[] = [
    {
      id: 'video',
      label: 'Video',
      icon: Play,
      available: videoContainersEnabled && !!module.video_url,
    },
    {
      id: 'lesson',
      label: 'Lesson',
      icon: BookOpen,
      available: !!module.lesson_content,
    },
    {
      id: 'vocabulary',
      label: 'Vocab',
      icon: ListChecks,
      available: module.vocabulary && module.vocabulary.length > 0,
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: FileText,
      available: !!module.activity_description,
    },
    {
      id: 'assignment',
      label: 'Assignment',
      icon: Send,
      available: !!module.assignment_prompt,
    },
  ];

  const visibleTabs = tabs.filter(t => t.available);

  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col">
      {/* Header */}
      <header className="bg-[#0A0E27]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back & Title */}
            <div className="flex items-center gap-3 min-w-0">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white/60" />
                </button>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-white/40 text-xs mb-0.5">
                  <span>Week {module.week_number}</span>
                  <span>•</span>
                  <span>Day {module.day_number}</span>
                  <span>•</span>
                  <span>Module {module.module_number}</span>
                </div>
                <h1 className="text-white font-bold truncate">{module.title}</h1>
              </div>
            </div>

            {/* Progress & Nav */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-white/40 text-xs">
                <Clock className="w-4 h-4" />
                <span>{module.estimated_duration_minutes} min</span>
              </div>

              {(hasPrev || hasNext) && (
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => onNavigate?.('prev')}
                    disabled={!hasPrev}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      hasPrev ? "hover:bg-white/[0.05] text-white/60" : "text-white/20 cursor-not-allowed"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate?.('next')}
                    disabled={!hasNext}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      hasNext ? "hover:bg-white/[0.05] text-white/60" : "text-white/20 cursor-not-allowed"
                    )}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    isActive
                      ? "bg-[#4A5FFF] text-white"
                      : "bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-24">
        {/* Video Tab */}
        {activeTab === 'video' && module.video_url && (
          <div className="space-y-6">
            {/* Video Container */}
            <div className="relative aspect-video bg-black/40 rounded-2xl overflow-hidden border border-white/[0.06]">
              {/* Placeholder - Replace with actual video player */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/20 transition-colors">
                    {videoPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </div>
                  <p className="text-white/40 text-sm">Video player coming soon</p>
                </div>
              </div>

              {/* Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setVideoPlaying(!videoPlaying)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {videoPlaying ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setVideoMuted(!videoMuted)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {videoMuted ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  {module.video_duration_seconds && (
                    <span className="text-white/60 text-sm">
                      {Math.floor(module.video_duration_seconds / 60)}:{String(module.video_duration_seconds % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Video Transcript (if available) */}
            {module.video_transcript && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Transcript
                </h3>
                <p className="text-white/70 leading-relaxed whitespace-pre-wrap">
                  {module.video_transcript}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Lesson Tab */}
        {activeTab === 'lesson' && (
          <div className="space-y-6">
            {/* Mike's Hook / Intro Story */}
            {module.intro_story && (
              <div className="bg-gradient-to-br from-[#4A5FFF]/10 to-[#00BFFF]/10 border border-[#4A5FFF]/20 rounded-xl p-6">
                <p className="text-white/90 text-lg italic leading-relaxed">
                  "{module.intro_story}"
                </p>
                <p className="text-white/40 text-sm mt-3">— Mike Wash</p>
              </div>
            )}

            {/* Main Lesson Content */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
              <div
                className="text-white/80 leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: module.lesson_content }}
              />
            </div>

            {/* Key Points */}
            {module.key_points && module.key_points.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#50D890]" />
                  Key Takeaways
                </h3>
                <ul className="space-y-3">
                  {module.key_points.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#50D890]/20 text-[#50D890] flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-white/70">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* References */}
            {module.references && module.references.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Learn More</h3>
                <div className="space-y-2">
                  {module.references.map((ref, index) => (
                    <a
                      key={index}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#4A5FFF] hover:text-[#6B7FFF] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{ref.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vocabulary Tab */}
        {activeTab === 'vocabulary' && module.vocabulary && (
          <div className="grid gap-4 sm:grid-cols-2">
            {module.vocabulary.map((item, index) => (
              <div
                key={index}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5"
              >
                <h4 className="text-white font-semibold text-lg mb-2">{item.term}</h4>
                <p className="text-white/60 leading-relaxed">{item.definition}</p>
              </div>
            ))}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && module.activity_description && (
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Class Activity</h3>
                <span className="text-white/40 text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {module.activity_duration_minutes} min
                </span>
              </div>
              <div
                className="text-white/80 leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: module.activity_description }}
              />
            </div>

            {/* Mark Activity Complete */}
            <button
              onClick={() => onProgressUpdate?.({ activity_completed: true })}
              disabled={progress?.activity_completed}
              className={cn(
                "w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                progress?.activity_completed
                  ? "bg-[#50D890]/20 text-[#50D890] cursor-default"
                  : "bg-[#4A5FFF] text-white hover:bg-[#5B6FFF]"
              )}
            >
              {progress?.activity_completed ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Activity Completed
                </>
              ) : (
                'Mark Activity as Complete'
              )}
            </button>
          </div>
        )}

        {/* Assignment Tab */}
        {activeTab === 'assignment' && module.assignment_prompt && (
          <div className="space-y-6">
            {/* Assignment Prompt */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Assignment</h3>
              <p className="text-white/70 leading-relaxed">{module.assignment_prompt}</p>
            </div>

            {/* Response Input */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
              <label className="block text-white/60 text-sm mb-3">Your Response</label>
              <textarea
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
                placeholder="Type your response here..."
                rows={6}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#4A5FFF] transition-colors"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-white/40 text-sm">
                  {assignmentText.length} characters
                </span>
                <button
                  onClick={handleAssignmentSubmit}
                  disabled={!assignmentText.trim() || submitting}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2",
                    assignmentText.trim() && !submitting
                      ? "bg-[#4A5FFF] text-white hover:bg-[#5B6FFF]"
                      : "bg-white/[0.05] text-white/30 cursor-not-allowed"
                  )}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit
                </button>
              </div>
            </div>

            {/* Grade & Feedback (if available) */}
            {assignmentGrade && (
              <div className={cn(
                "border rounded-xl p-6",
                assignmentGrade === 'full'
                  ? "bg-[#50D890]/10 border-[#50D890]/20"
                  : assignmentGrade === 'half'
                    ? "bg-yellow-500/10 border-yellow-500/20"
                    : "bg-red-500/10 border-red-500/20"
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className={cn(
                    "w-5 h-5",
                    assignmentGrade === 'full'
                      ? "text-[#50D890]"
                      : assignmentGrade === 'half'
                        ? "text-yellow-500"
                        : "text-red-500"
                  )} />
                  <span className={cn(
                    "font-semibold",
                    assignmentGrade === 'full'
                      ? "text-[#50D890]"
                      : assignmentGrade === 'half'
                        ? "text-yellow-500"
                        : "text-red-500"
                  )}>
                    {assignmentGrade === 'full' && 'Full Credit'}
                    {assignmentGrade === 'half' && 'Half Credit'}
                    {assignmentGrade === 'none' && 'Needs Improvement'}
                  </span>
                </div>
                {assignmentFeedback && (
                  <p className="text-white/70 leading-relaxed">{assignmentFeedback}</p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default ModuleView;
