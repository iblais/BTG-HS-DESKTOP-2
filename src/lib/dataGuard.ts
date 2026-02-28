/**
 * DataGuard - Bulletproof Data Persistence Layer
 *
 * Prevents data loss by ensuring every write is confirmed before showing success.
 * Uses write-ahead logging, real connection health checks, retry with backoff+jitter,
 * and a dead letter queue for permanently failed operations.
 */

import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export type WriteStatus = 'pending' | 'writing' | 'confirmed' | 'failed' | 'dead';
export type SyncHealth = 'online' | 'degraded' | 'offline';

export interface WriteOperation {
  id: string;
  table: string;
  operation: 'upsert' | 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  conflictKey?: string;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  status: WriteStatus;
  lastError?: string;
  confirmedAt?: number;
}

interface HealthCheckResult {
  healthy: boolean;
  latencyMs: number;
  timestamp: number;
}

type SyncListener = (health: SyncHealth, pendingCount: number) => void;

// ============================================
// CONSTANTS
// ============================================

const WAL_KEY = 'btg_write_ahead_log';
const DEAD_LETTER_KEY = 'btg_dead_letter_queue';
const HEALTH_KEY = 'btg_connection_health';
const MAX_RETRIES = 8; // More retries before giving up
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 30000;
const HEALTH_CHECK_INTERVAL_MS = 30000; // 30 seconds
const HEALTH_CHECK_TIMEOUT_MS = 5000;

// ============================================
// WRITE-AHEAD LOG (WAL)
// ============================================

function getWAL(): WriteOperation[] {
  try {
    const raw = localStorage.getItem(WAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWAL(wal: WriteOperation[]): void {
  try {
    localStorage.setItem(WAL_KEY, JSON.stringify(wal));
  } catch (e) {
    console.error('[DataGuard] Failed to save WAL:', e);
  }
}

function addToWAL(op: WriteOperation): void {
  const wal = getWAL();
  // Deduplicate: replace existing operation for same table+id combo
  const existingIdx = wal.findIndex(
    w => w.table === op.table &&
    w.data?.id === op.data?.id &&
    w.data?.user_id === op.data?.user_id &&
    w.status === 'pending'
  );
  if (existingIdx >= 0) {
    wal[existingIdx] = op;
  } else {
    wal.push(op);
  }
  saveWAL(wal);
}

function removeFromWAL(id: string): void {
  const wal = getWAL().filter(op => op.id !== id);
  saveWAL(wal);
}

function updateWALEntry(id: string, updates: Partial<WriteOperation>): void {
  const wal = getWAL();
  const idx = wal.findIndex(op => op.id === id);
  if (idx >= 0) {
    wal[idx] = { ...wal[idx], ...updates };
    saveWAL(wal);
  }
}

// ============================================
// DEAD LETTER QUEUE
// ============================================

function getDeadLetterQueue(): WriteOperation[] {
  try {
    const raw = localStorage.getItem(DEAD_LETTER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToDeadLetter(op: WriteOperation): void {
  try {
    const dlq = getDeadLetterQueue();
    dlq.push({ ...op, status: 'dead' });
    localStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(dlq));
  } catch (e) {
    console.error('[DataGuard] Failed to save to dead letter queue:', e);
  }
}

// ============================================
// CONNECTION HEALTH MONITORING
// ============================================

let currentHealth: SyncHealth = navigator.onLine ? 'online' : 'offline';
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;
const listeners: Set<SyncListener> = new Set();

function notifyListeners(): void {
  const pendingCount = getWAL().filter(op => op.status === 'pending' || op.status === 'writing').length;
  listeners.forEach(fn => fn(currentHealth, pendingCount));
}

/**
 * Real connection health check - actually pings Supabase
 */
async function checkConnectionHealth(): Promise<HealthCheckResult> {
  const start = Date.now();

  try {
    // Use a lightweight query to check connection
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    const { error } = await supabase
      .from('programs')
      .select('id')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeout);
    const latency = Date.now() - start;

    if (error) {
      // Auth errors are still "connected"
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        return { healthy: true, latencyMs: latency, timestamp: Date.now() };
      }
      return { healthy: false, latencyMs: latency, timestamp: Date.now() };
    }

    return { healthy: true, latencyMs: latency, timestamp: Date.now() };
  } catch {
    return { healthy: false, latencyMs: Date.now() - start, timestamp: Date.now() };
  }
}

async function updateHealthStatus(): Promise<void> {
  if (!navigator.onLine) {
    currentHealth = 'offline';
    notifyListeners();
    return;
  }

  const result = await checkConnectionHealth();

  try {
    localStorage.setItem(HEALTH_KEY, JSON.stringify(result));
  } catch { /* ignore */ }

  if (!result.healthy) {
    currentHealth = 'degraded';
  } else if (result.latencyMs > 3000) {
    currentHealth = 'degraded';
  } else {
    currentHealth = 'online';
  }

  notifyListeners();
}

// ============================================
// RETRY ENGINE
// ============================================

/**
 * Calculate delay with exponential backoff + jitter to prevent thundering herd
 */
function getRetryDelay(retryCount: number): number {
  const exponential = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
  // Add 0-50% jitter
  const jitter = exponential * Math.random() * 0.5;
  return exponential + jitter;
}

/**
 * Execute a single write operation with confirmation
 */
async function executeWrite(op: WriteOperation): Promise<boolean> {
  try {
    updateWALEntry(op.id, { status: 'writing' });

    let result: { error: { message: string; code?: string } | null };

    switch (op.operation) {
      case 'upsert':
        result = await supabase
          .from(op.table)
          .upsert(op.data, op.conflictKey ? { onConflict: op.conflictKey } : undefined);
        break;
      case 'insert':
        result = await supabase
          .from(op.table)
          .insert(op.data);
        break;
      case 'update': {
        const { id: rowId, ...updates } = op.data;
        result = await supabase
          .from(op.table)
          .update(updates)
          .eq('id', rowId as string);
        break;
      }
      case 'delete':
        result = await supabase
          .from(op.table)
          .delete()
          .eq('id', op.data.id as string);
        break;
      default:
        return false;
    }

    if (result.error) {
      // Check if this is a non-retryable error (constraint violation, etc.)
      const code = result.error.code;
      if (code === '23505' || code === '23503' || code === '42P01') {
        // Unique violation, foreign key violation, or table not found
        // These won't succeed on retry
        console.warn(`[DataGuard] Non-retryable error for ${op.table}:`, result.error.message);
        updateWALEntry(op.id, {
          status: 'failed',
          lastError: result.error.message
        });
        return false;
      }
      throw new Error(result.error.message);
    }

    // Write confirmed!
    updateWALEntry(op.id, {
      status: 'confirmed',
      confirmedAt: Date.now()
    });

    // Remove from WAL after confirmation
    removeFromWAL(op.id);
    return true;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    updateWALEntry(op.id, {
      status: 'pending',
      retryCount: op.retryCount + 1,
      lastError: errorMsg
    });
    return false;
  }
}

// ============================================
// FLUSH ENGINE - Process pending writes
// ============================================

let flushInProgress = false;

async function flushWAL(): Promise<void> {
  if (flushInProgress) return;
  if (currentHealth === 'offline') return;

  flushInProgress = true;

  try {
    const wal = getWAL();
    const pending = wal.filter(op => op.status === 'pending');

    for (const op of pending) {
      // Check if max retries exceeded
      if (op.retryCount >= op.maxRetries) {
        console.error(`[DataGuard] Moving to dead letter queue: ${op.table} (${op.id})`);
        addToDeadLetter(op);
        removeFromWAL(op.id);
        notifyListeners();
        continue;
      }

      // Wait for appropriate retry delay
      if (op.retryCount > 0) {
        const delay = getRetryDelay(op.retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Check health before attempting (re-read as it may change during async ops)
      if ((currentHealth as SyncHealth) === 'offline') break;

      const success = await executeWrite(op);

      if (!success && op.retryCount + 1 >= op.maxRetries) {
        addToDeadLetter({ ...op, retryCount: op.retryCount + 1 });
        removeFromWAL(op.id);
      }

      notifyListeners();
    }
  } finally {
    flushInProgress = false;
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Write data to Supabase with guaranteed delivery.
 * Returns true if confirmed, false if queued for retry.
 * NEVER silently drops data.
 */
export async function guardedWrite(
  table: string,
  operation: WriteOperation['operation'],
  data: Record<string, unknown>,
  options?: {
    conflictKey?: string;
    maxRetries?: number;
    /** If true, waits for server confirmation before returning. Default: true */
    awaitConfirmation?: boolean;
  }
): Promise<{ confirmed: boolean; operationId: string }> {
  const op: WriteOperation = {
    id: `dg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    table,
    operation,
    data,
    conflictKey: options?.conflictKey,
    createdAt: Date.now(),
    retryCount: 0,
    maxRetries: options?.maxRetries ?? MAX_RETRIES,
    status: 'pending',
  };

  // Write to WAL first (crash-safe)
  addToWAL(op);
  notifyListeners();

  const awaitConfirmation = options?.awaitConfirmation !== false;

  if (awaitConfirmation && currentHealth !== 'offline') {
    // Try to write immediately and wait for confirmation
    const success = await executeWrite(op);
    notifyListeners();

    if (success) {
      return { confirmed: true, operationId: op.id };
    }
  }

  // Queued for background retry
  if (currentHealth !== 'offline') {
    // Schedule background flush
    setTimeout(() => flushWAL(), 1000);
  }

  return { confirmed: false, operationId: op.id };
}

/**
 * Convenience: Guarded upsert
 */
export async function guardedUpsert(
  table: string,
  data: Record<string, unknown>,
  conflictKey?: string
): Promise<{ confirmed: boolean; operationId: string }> {
  return guardedWrite(table, 'upsert', data, { conflictKey });
}

/**
 * Convenience: Guarded insert
 */
export async function guardedInsert(
  table: string,
  data: Record<string, unknown>
): Promise<{ confirmed: boolean; operationId: string }> {
  return guardedWrite(table, 'insert', data);
}

/**
 * Get current sync health status
 */
export function getSyncHealth(): SyncHealth {
  return currentHealth;
}

/**
 * Get count of pending writes
 */
export function getPendingWriteCount(): number {
  return getWAL().filter(op => op.status === 'pending' || op.status === 'writing').length;
}

/**
 * Get dead letter queue items (for admin/debug display)
 */
export function getDeadLetterItems(): WriteOperation[] {
  return getDeadLetterQueue();
}

/**
 * Retry all dead letter items (manual recovery)
 */
export async function retryDeadLetterQueue(): Promise<number> {
  const dlq = getDeadLetterQueue();
  let recovered = 0;

  for (const op of dlq) {
    addToWAL({ ...op, status: 'pending', retryCount: 0 });
    recovered++;
  }

  // Clear dead letter queue
  localStorage.setItem(DEAD_LETTER_KEY, '[]');

  // Trigger flush
  await flushWAL();

  return recovered;
}

/**
 * Subscribe to sync status changes
 */
export function onSyncStatusChange(listener: SyncListener): () => void {
  listeners.add(listener);
  // Immediately call with current status
  const pendingCount = getPendingWriteCount();
  listener(currentHealth, pendingCount);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Initialize DataGuard - call once at app startup
 */
export function initDataGuard(): () => void {
  // Start health monitoring
  updateHealthStatus();
  healthCheckTimer = setInterval(updateHealthStatus, HEALTH_CHECK_INTERVAL_MS);

  // Listen for online/offline events
  const handleOnline = () => {
    updateHealthStatus();
    // Flush pending writes when coming back online
    setTimeout(() => flushWAL(), 2000);
  };

  const handleOffline = () => {
    currentHealth = 'offline';
    notifyListeners();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Flush any pending writes from previous session
  if (navigator.onLine) {
    setTimeout(() => flushWAL(), 3000);
  }

  // Periodic flush check
  const flushTimer = setInterval(() => {
    if (currentHealth !== 'offline') {
      flushWAL();
    }
  }, 60000); // Every minute

  // Cleanup function
  return () => {
    if (healthCheckTimer) clearInterval(healthCheckTimer);
    clearInterval(flushTimer);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Force flush all pending writes now
 */
export async function forceFlush(): Promise<void> {
  await updateHealthStatus();
  await flushWAL();
}
