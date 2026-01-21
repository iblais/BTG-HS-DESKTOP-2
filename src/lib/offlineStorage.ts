import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Database schema version
const DB_VERSION = 1;
const DB_NAME = 'btg-desktop';

// Types for offline storage
export interface OfflineUserSession {
  id: 'current';
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface OfflineEnrollment {
  id: string;
  programId: 'HS' | 'COLLEGE';
  trackLevel: 'beginner' | 'advanced';
  language: 'en' | 'es';
  enrolledAt: string;
}

export interface OfflineLessonContent {
  weekNumber: number;
  programId: string;
  title: string;
  description: string;
  sections: LessonSection[];
  downloadedAt: number;
}

export interface LessonSection {
  title: string;
  type: 'reading' | 'video' | 'interactive';
  duration: string;
  content: string;
  keyPoints: string[];
}

export interface OfflineCourseProgress {
  id: string;
  weekNumber: number;
  lessonCompleted: boolean;
  quizCompleted: boolean;
  quizAttempts: number;
  bestQuizScore: number | null;
  lastSyncedAt: number;
  pendingSync: boolean;
}

export interface OfflineQuizAttempt {
  id: string;
  weekNumber: number;
  score: number;
  totalQuestions: number;
  passed: boolean;
  answers: number[];
  completedAt: string;
  pendingSync: boolean;
}

export interface SyncQueueItem {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: unknown;
  createdAt: number;
  retryCount: number;
}

// IndexedDB Schema
interface BTGDatabase extends DBSchema {
  userSession: {
    key: 'current';
    value: OfflineUserSession;
  };
  enrollment: {
    key: string;
    value: OfflineEnrollment;
  };
  lessonContent: {
    key: number;
    value: OfflineLessonContent;
    indexes: { 'by-program': string };
  };
  courseProgress: {
    key: number;
    value: OfflineCourseProgress;
    indexes: { 'by-pending': number };
  };
  quizAttempts: {
    key: string;
    value: OfflineQuizAttempt;
    indexes: { 'by-week': number; 'by-pending': number };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-created': number };
  };
}

let dbInstance: IDBPDatabase<BTGDatabase> | null = null;

/**
 * Initialize and get the database instance
 */
export async function getDB(): Promise<IDBPDatabase<BTGDatabase>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BTGDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // User session store
      if (!db.objectStoreNames.contains('userSession')) {
        db.createObjectStore('userSession', { keyPath: 'id' });
      }

      // Enrollment store
      if (!db.objectStoreNames.contains('enrollment')) {
        db.createObjectStore('enrollment', { keyPath: 'id' });
      }

      // Lesson content store
      if (!db.objectStoreNames.contains('lessonContent')) {
        const lessonStore = db.createObjectStore('lessonContent', { keyPath: 'weekNumber' });
        lessonStore.createIndex('by-program', 'programId');
      }

      // Course progress store
      if (!db.objectStoreNames.contains('courseProgress')) {
        const progressStore = db.createObjectStore('courseProgress', { keyPath: 'weekNumber' });
        progressStore.createIndex('by-pending', 'pendingSync');
      }

      // Quiz attempts store
      if (!db.objectStoreNames.contains('quizAttempts')) {
        const quizStore = db.createObjectStore('quizAttempts', { keyPath: 'id' });
        quizStore.createIndex('by-week', 'weekNumber');
        quizStore.createIndex('by-pending', 'pendingSync');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-created', 'createdAt');
      }
    },
  });

  return dbInstance;
}

// ============ User Session ============

export async function saveUserSession(session: OfflineUserSession): Promise<void> {
  const db = await getDB();
  await db.put('userSession', session);
}

export async function getUserSession(): Promise<OfflineUserSession | undefined> {
  const db = await getDB();
  return db.get('userSession', 'current');
}

export async function clearUserSession(): Promise<void> {
  const db = await getDB();
  await db.delete('userSession', 'current');
}

// ============ Enrollment ============

export async function saveEnrollment(enrollment: OfflineEnrollment): Promise<void> {
  const db = await getDB();
  await db.put('enrollment', enrollment);
}

export async function getEnrollment(id: string): Promise<OfflineEnrollment | undefined> {
  const db = await getDB();
  return db.get('enrollment', id);
}

export async function getActiveEnrollmentOffline(): Promise<OfflineEnrollment | undefined> {
  const db = await getDB();
  const enrollments = await db.getAll('enrollment');
  return enrollments[0]; // Return first enrollment
}

export async function clearEnrollments(): Promise<void> {
  const db = await getDB();
  await db.clear('enrollment');
}

// ============ Lesson Content ============

export async function saveLessonContent(lesson: OfflineLessonContent): Promise<void> {
  const db = await getDB();
  await db.put('lessonContent', lesson);
}

export async function getLessonContent(weekNumber: number): Promise<OfflineLessonContent | undefined> {
  const db = await getDB();
  return db.get('lessonContent', weekNumber);
}

export async function getAllLessonContent(): Promise<OfflineLessonContent[]> {
  const db = await getDB();
  return db.getAll('lessonContent');
}

export async function getLessonsByProgram(programId: string): Promise<OfflineLessonContent[]> {
  const db = await getDB();
  return db.getAllFromIndex('lessonContent', 'by-program', programId);
}

export async function clearLessonContent(): Promise<void> {
  const db = await getDB();
  await db.clear('lessonContent');
}

// ============ Course Progress ============

export async function saveCourseProgress(progress: OfflineCourseProgress): Promise<void> {
  const db = await getDB();
  await db.put('courseProgress', progress);
}

export async function getCourseProgress(weekNumber: number): Promise<OfflineCourseProgress | undefined> {
  const db = await getDB();
  return db.get('courseProgress', weekNumber);
}

export async function getAllCourseProgress(): Promise<OfflineCourseProgress[]> {
  const db = await getDB();
  return db.getAll('courseProgress');
}

export async function getPendingProgressSync(): Promise<OfflineCourseProgress[]> {
  const db = await getDB();
  return db.getAllFromIndex('courseProgress', 'by-pending', 1);
}

export async function clearCourseProgress(): Promise<void> {
  const db = await getDB();
  await db.clear('courseProgress');
}

// ============ Quiz Attempts ============

export async function saveQuizAttempt(attempt: OfflineQuizAttempt): Promise<void> {
  const db = await getDB();
  await db.put('quizAttempts', attempt);
}

export async function getQuizAttempts(weekNumber: number): Promise<OfflineQuizAttempt[]> {
  const db = await getDB();
  return db.getAllFromIndex('quizAttempts', 'by-week', weekNumber);
}

export async function getPendingQuizSync(): Promise<OfflineQuizAttempt[]> {
  const db = await getDB();
  return db.getAllFromIndex('quizAttempts', 'by-pending', 1);
}

export async function clearQuizAttempts(): Promise<void> {
  const db = await getDB();
  await db.clear('quizAttempts');
}

// ============ Sync Queue ============

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
  const db = await getDB();
  const queueItem: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retryCount: 0,
  };
  await db.put('syncQueue', queueItem);
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('syncQueue', 'by-created');
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function updateSyncQueueRetry(id: string): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    item.retryCount += 1;
    await db.put('syncQueue', item);
  }
}

export async function clearSyncQueue(): Promise<void> {
  const db = await getDB();
  await db.clear('syncQueue');
}

// ============ Utilities ============

/**
 * Clear all offline data (for logout)
 */
export async function clearAllOfflineData(): Promise<void> {
  await clearUserSession();
  await clearEnrollments();
  await clearLessonContent();
  await clearCourseProgress();
  await clearQuizAttempts();
  await clearSyncQueue();
}

/**
 * Get storage usage estimate
 */
export async function getStorageUsage(): Promise<{ used: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { used: 0, quota: 0 };
}

/**
 * Check if content for a week is downloaded
 */
export async function isWeekDownloaded(weekNumber: number): Promise<boolean> {
  const content = await getLessonContent(weekNumber);
  return content !== undefined;
}

/**
 * Get download progress (how many weeks are cached)
 */
export async function getDownloadProgress(totalWeeks: number): Promise<number> {
  const content = await getAllLessonContent();
  return (content.length / totalWeeks) * 100;
}
