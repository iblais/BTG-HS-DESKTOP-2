/**
 * DayView Component
 * Displays the 4 modules for a specific day within a week
 * Part of the new 5-day × 4-module structure
 */

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Play,
  BookOpen,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModuleView } from './ModuleView';
import type { Module, ModuleProgress, DayNumber } from '@/lib/types';

// ============================================
// TYPES
// ============================================

interface DayViewProps {
  weekNumber: number;
  weekTitle: string;
  dayNumber: DayNumber;
  modules: Module[];
  moduleProgress: Map<string, ModuleProgress>;
  onProgressUpdate?: (moduleId: string, progress: Partial<ModuleProgress>) => void;
  onAssignmentSubmit?: (moduleId: string, response: string) => Promise<void>;
  onBack: () => void;
  onDayChange?: (day: DayNumber) => void;
  onComplete?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const DAY_NAMES: Record<DayNumber, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
};

// ============================================
// COMPONENT
// ============================================

export function DayView({
  weekNumber,
  weekTitle,
  dayNumber,
  modules,
  moduleProgress,
  onProgressUpdate,
  onAssignmentSubmit,
  onBack,
  onDayChange,
  onComplete,
}: DayViewProps) {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'module'>('list');

  // Sort modules by module_number
  const sortedModules = [...modules].sort((a, b) => a.module_number - b.module_number);
  const currentModule = sortedModules[currentModuleIndex];

  // Calculate day progress
  const completedModules = sortedModules.filter((m) => {
    const progress = moduleProgress.get(m.id);
    return progress?.lesson_read && progress?.activity_completed;
  }).length;

  const dayProgress = sortedModules.length > 0
    ? Math.round((completedModules / sortedModules.length) * 100)
    : 0;

  const isDayComplete = completedModules === sortedModules.length && sortedModules.length > 0;

  // Handle module navigation
  const handleModuleSelect = (index: number) => {
    setCurrentModuleIndex(index);
    setViewMode('module');
  };

  const handleModuleNav = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    } else if (direction === 'next' && currentModuleIndex < sortedModules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const handleDayNav = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && dayNumber > 1) {
      onDayChange?.((dayNumber - 1) as DayNumber);
    } else if (direction === 'next' && dayNumber < 4) {
      onDayChange?.((dayNumber + 1) as DayNumber);
    }
  };

  // Show individual module view
  if (viewMode === 'module' && currentModule) {
    const progress = moduleProgress.get(currentModule.id);

    return (
      <ModuleView
        module={currentModule}
        progress={progress}
        onProgressUpdate={(update) => onProgressUpdate?.(currentModule.id, update)}
        onAssignmentSubmit={onAssignmentSubmit ? (response) => onAssignmentSubmit(currentModule.id, response) : undefined}
        onNavigate={handleModuleNav}
        hasPrev={currentModuleIndex > 0}
        hasNext={currentModuleIndex < sortedModules.length - 1}
        onBack={() => setViewMode('list')}
      />
    );
  }

  // Show day overview with module list
  return (
    <div className="min-h-screen bg-[#0A0E27] flex flex-col">
      {/* Header */}
      <header className="bg-[#0A0E27]/80 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Back & Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white/60" />
              </button>
              <div className="min-w-0">
                <div className="text-white/40 text-xs mb-0.5">
                  Week {weekNumber} • {weekTitle}
                </div>
                <h1 className="text-white font-bold text-lg">
                  Day {dayNumber}: {DAY_NAMES[dayNumber]}
                </h1>
              </div>
            </div>

            {/* Day Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDayNav('prev')}
                disabled={dayNumber === 1}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  dayNumber > 1 ? "hover:bg-white/[0.05] text-white/60" : "text-white/20 cursor-not-allowed"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((d) => (
                  <button
                    key={d}
                    onClick={() => onDayChange?.(d as DayNumber)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                      d === dayNumber
                        ? "bg-[#4A5FFF] text-white"
                        : "bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/60"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleDayNav('next')}
                disabled={dayNumber === 4}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  dayNumber < 4 ? "hover:bg-white/[0.05] text-white/60" : "text-white/20 cursor-not-allowed"
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/40 text-sm">
                {completedModules} of {sortedModules.length} modules complete
              </span>
              <span className="text-white/60 text-sm font-medium">
                {dayProgress}%
              </span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isDayComplete
                    ? "bg-gradient-to-r from-[#50D890] to-[#40C878]"
                    : "bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF]"
                )}
                style={{ width: `${dayProgress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Module List */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24">
        {sortedModules.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40">No modules available for this day yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedModules.map((module, index) => {
              const progress = moduleProgress.get(module.id);
              const isComplete = progress?.lesson_read && progress?.activity_completed;
              const isStarted = progress?.started_at != null;

              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleSelect(index)}
                  className={cn(
                    "w-full text-left p-5 rounded-2xl border transition-all duration-300",
                    "bg-white/[0.02] hover:bg-white/[0.04]",
                    isComplete
                      ? "border-[#50D890]/30 bg-[#50D890]/[0.05]"
                      : "border-white/[0.06] hover:border-white/[0.12]"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Module Number / Status */}
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      isComplete
                        ? "bg-[#50D890]/20"
                        : isStarted
                          ? "bg-[#4A5FFF]/20"
                          : "bg-white/[0.05]"
                    )}>
                      {isComplete ? (
                        <CheckCircle2 className="w-6 h-6 text-[#50D890]" />
                      ) : isStarted ? (
                        <Play className="w-5 h-5 text-[#4A5FFF]" />
                      ) : (
                        <span className="text-white/40 font-bold">{module.module_number}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-white font-semibold truncate">
                          {module.title}
                        </h3>
                        <div className="flex items-center gap-1 text-white/40 text-xs flex-shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{module.estimated_duration_minutes} min</span>
                        </div>
                      </div>

                      {/* Module summary */}
                      <p className="text-white/50 text-sm line-clamp-2 mb-3">
                        {module.intro_story || module.lesson_content.slice(0, 150).replace(/<[^>]*>/g, '')}...
                      </p>

                      {/* Progress indicators */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className={cn(
                          "flex items-center gap-1.5",
                          progress?.lesson_read ? "text-[#50D890]" : "text-white/30"
                        )}>
                          {progress?.lesson_read ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Circle className="w-3.5 h-3.5" />
                          )}
                          <span>Lesson</span>
                        </div>

                        {module.activity_description && (
                          <div className={cn(
                            "flex items-center gap-1.5",
                            progress?.activity_completed ? "text-[#50D890]" : "text-white/30"
                          )}>
                            {progress?.activity_completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                            <span>Activity</span>
                          </div>
                        )}

                        {module.video_url && (
                          <div className={cn(
                            "flex items-center gap-1.5",
                            progress?.video_watched ? "text-[#50D890]" : "text-white/30"
                          )}>
                            {progress?.video_watched ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                            <span>Video</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-5 h-5 text-white/20 flex-shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Day Complete Banner */}
        {isDayComplete && (
          <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-[#50D890]/10 to-[#40C878]/10 border border-[#50D890]/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#50D890]/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[#50D890]" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">
                  Day {dayNumber} Complete!
                </h3>
                <p className="text-white/60 text-sm">
                  {dayNumber < 4
                    ? `Continue to Day ${dayNumber + 1} to keep your streak going.`
                    : 'All daily lessons complete! Take the Friday Quiz when ready.'
                  }
                </p>
              </div>
            </div>

            {dayNumber < 4 ? (
              <button
                onClick={() => onDayChange?.((dayNumber + 1) as DayNumber)}
                className="mt-4 w-full py-3 rounded-xl bg-[#50D890] text-[#0A0E27] font-semibold hover:bg-[#40C878] transition-colors"
              >
                Continue to Day {dayNumber + 1}
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-[#4A5FFF] to-[#00BFFF] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Take Friday Quiz
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DayView;
