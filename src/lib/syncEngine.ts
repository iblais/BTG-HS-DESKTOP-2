import { supabase } from './supabase';
import {
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueRetry,
  getPendingProgressSync,
  getPendingQuizSync,
  saveCourseProgress,
  saveQuizAttempt,
  type SyncQueueItem,
  type OfflineCourseProgress,
  type OfflineQuizAttempt,
} from './offlineStorage';
import { syncUtils } from './storage';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Check if the app is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Process a single sync queue item
 */
async function processSyncItem(item: SyncQueueItem): Promise<boolean> {
  try {
    const { table, operation, data } = item;

    switch (operation) {
      case 'INSERT': {
        const { error } = await supabase.from(table).insert(data as Record<string, unknown>);
        if (error) throw error;
        break;
      }
      case 'UPDATE': {
        const updateData = data as { id: string; updates: Record<string, unknown> };
        const { error } = await supabase
          .from(table)
          .update(updateData.updates)
          .eq('id', updateData.id);
        if (error) throw error;
        break;
      }
      case 'DELETE': {
        const deleteData = data as { id: string };
        const { error } = await supabase.from(table).delete().eq('id', deleteData.id);
        if (error) throw error;
        break;
      }
    }

    return true;
  } catch (error) {
    console.error('Sync item failed:', error);
    return false;
  }
}

/**
 * Sync course progress to server
 */
async function syncCourseProgress(progress: OfflineCourseProgress): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('course_progress')
      .upsert({
        id: progress.id,
        week_number: progress.weekNumber,
        lesson_completed: progress.lessonCompleted,
        quiz_completed: progress.quizCompleted,
        quiz_attempts: progress.quizAttempts,
        best_quiz_score: progress.bestQuizScore,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Mark as synced
    await saveCourseProgress({
      ...progress,
      pendingSync: false,
      lastSyncedAt: Date.now(),
    });

    return true;
  } catch (error) {
    console.error('Failed to sync course progress:', error);
    return false;
  }
}

/**
 * Sync quiz attempt to server
 */
async function syncQuizAttempt(attempt: OfflineQuizAttempt): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quiz_attempts')
      .upsert({
        id: attempt.id,
        week_number: attempt.weekNumber,
        score: attempt.score,
        total_questions: attempt.totalQuestions,
        passed: attempt.passed,
        answers: attempt.answers,
        completed_at: attempt.completedAt,
      });

    if (error) throw error;

    // Mark as synced
    await saveQuizAttempt({
      ...attempt,
      pendingSync: false,
    });

    return true;
  } catch (error) {
    console.error('Failed to sync quiz attempt:', error);
    return false;
  }
}

/**
 * Process all pending sync items
 */
export async function syncAll(onProgress?: (status: string) => void): Promise<SyncResult> {
  if (!isOnline()) {
    return {
      success: false,
      syncedCount: 0,
      failedCount: 0,
      errors: ['No internet connection'],
    };
  }

  const result: SyncResult = {
    success: true,
    syncedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // 1. Process sync queue
    onProgress?.('Processing sync queue...');
    const queue = await getSyncQueue();

    for (const item of queue) {
      if (item.retryCount >= MAX_RETRIES) {
        result.errors.push(`Max retries exceeded for ${item.table} operation`);
        await removeSyncQueueItem(item.id);
        result.failedCount++;
        continue;
      }

      const success = await processSyncItem(item);

      if (success) {
        await removeSyncQueueItem(item.id);
        result.syncedCount++;
      } else {
        await updateSyncQueueRetry(item.id);
        result.failedCount++;
        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, item.retryCount))
        );
      }
    }

    // 2. Sync pending course progress
    onProgress?.('Syncing course progress...');
    const pendingProgress = await getPendingProgressSync();

    for (const progress of pendingProgress) {
      const success = await syncCourseProgress(progress);
      if (success) {
        result.syncedCount++;
      } else {
        result.failedCount++;
      }
    }

    // 3. Sync pending quiz attempts
    onProgress?.('Syncing quiz attempts...');
    const pendingQuizzes = await getPendingQuizSync();

    for (const quiz of pendingQuizzes) {
      const success = await syncQuizAttempt(quiz);
      if (success) {
        result.syncedCount++;
      } else {
        result.failedCount++;
      }
    }

    // 4. Sync cloud storage data (Bitcoin simulator, games, etc.)
    onProgress?.('Syncing cloud storage...');
    try {
      await syncUtils.syncAllToCloud();
      result.syncedCount++;
    } catch (error) {
      console.error('Cloud storage sync failed:', error);
      result.failedCount++;
      result.errors.push('Cloud storage sync failed');
    }

    result.success = result.failedCount === 0;
    onProgress?.('Sync complete');

  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
  }

  return result;
}

/**
 * Background sync handler for service worker
 */
export async function backgroundSync(): Promise<void> {
  if (!isOnline()) return;

  try {
    await syncAll();
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * Register for periodic background sync (if supported)
 */
export async function registerPeriodicSync(): Promise<boolean> {
  if ('serviceWorker' in navigator && 'periodicSync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-expect-error - periodicSync is not in all TypeScript definitions yet
      await registration.periodicSync.register('btg-sync', {
        minInterval: 60 * 60 * 1000, // 1 hour
      });
      return true;
    } catch (error) {
      console.error('Periodic sync registration failed:', error);
      return false;
    }
  }
  return false;
}

/**
 * Listen for online/offline events and trigger sync
 */
export function setupAutoSync(onStatusChange?: (online: boolean) => void): () => void {
  const handleOnline = () => {
    onStatusChange?.(true);
    // Delay sync slightly to ensure stable connection
    setTimeout(() => {
      syncAll().catch(console.error);
    }, 2000);
  };

  const handleOffline = () => {
    onStatusChange?.(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
