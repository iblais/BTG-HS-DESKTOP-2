import { useState, useEffect, useCallback } from 'react';
import { syncAll, type SyncResult } from '@/lib/syncEngine';

export interface OnlineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  syncNow: () => Promise<void>;
}

/**
 * Hook to track online/offline status and manage sync
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Manual sync function
  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncAll();
      setLastSyncResult(result);
    } catch (error) {
      setLastSyncResult({
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: [error instanceof Error ? error.message : 'Sync failed'],
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  return {
    isOnline,
    isSyncing,
    lastSyncResult,
    syncNow,
  };
}

/**
 * Simple hook that just returns online status
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
