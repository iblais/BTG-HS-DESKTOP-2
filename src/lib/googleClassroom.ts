/**
 * Google Classroom Integration for BTG Platform
 * Provides hooks for syncing with Google Classroom
 *
 * NOTE: Full integration requires OAuth setup in Google Cloud Console.
 * This file provides the structure and placeholder functions.
 *
 * Setup Requirements:
 * 1. Create project in Google Cloud Console
 * 2. Enable Google Classroom API
 * 3. Configure OAuth consent screen
 * 4. Create OAuth 2.0 credentials
 * 5. Set VITE_GOOGLE_CLIENT_ID in .env
 */

import { isFeatureEnabled } from './featureFlags';
import type { Class, Module } from './types';

// ============================================
// TYPES
// ============================================

interface GoogleClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  room?: string;
  ownerId: string;
  creationTime: string;
  updateTime: string;
  enrollmentCode?: string;
  courseState: 'ACTIVE' | 'ARCHIVED' | 'PROVISIONED' | 'DECLINED' | 'SUSPENDED';
  alternateLink: string;
}

interface GoogleClassroomStudent {
  courseId: string;
  userId: string;
  profile: {
    id: string;
    name: {
      givenName: string;
      familyName: string;
      fullName: string;
    };
    emailAddress: string;
    photoUrl?: string;
  };
}

interface GoogleClassroomAssignment {
  courseId: string;
  id: string;
  title: string;
  description?: string;
  materials?: Array<{
    link?: { url: string; title?: string };
    driveFile?: { driveFile: { id: string; title: string; alternateLink: string } };
  }>;
  state: 'PUBLISHED' | 'DRAFT' | 'DELETED';
  alternateLink: string;
  creationTime: string;
  updateTime: string;
  dueDate?: { year: number; month: number; day: number };
  dueTime?: { hours: number; minutes: number };
  maxPoints?: number;
  workType: 'ASSIGNMENT' | 'SHORT_ANSWER_QUESTION' | 'MULTIPLE_CHOICE_QUESTION';
}

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
}

// ============================================
// CONFIGURATION
// ============================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students',
];

// ============================================
// AUTH HELPERS
// ============================================

let googleAccessToken: string | null = null;

/**
 * Check if Google Classroom integration is available
 */
export function isGoogleClassroomAvailable(): boolean {
  return isFeatureEnabled('googleClassroom') && !!GOOGLE_CLIENT_ID;
}

/**
 * Initialize Google Sign-In
 */
export async function initGoogleAuth(): Promise<boolean> {
  if (!isGoogleClassroomAvailable()) {
    console.warn('[GoogleClassroom] Integration not available');
    return false;
  }

  // Load Google Identity Services library
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Request Google Classroom access
 */
export async function requestGoogleAccess(): Promise<string | null> {
  if (!isGoogleClassroomAvailable()) {
    throw new Error('Google Classroom integration not available');
  }

  return new Promise((resolve, reject) => {
    // @ts-ignore - google.accounts.oauth2 from GIS
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPES.join(' '),
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description));
        } else {
          googleAccessToken = response.access_token;
          resolve(response.access_token);
        }
      },
    });

    tokenClient.requestAccessToken();
  });
}

/**
 * Revoke Google access
 */
export function revokeGoogleAccess(): void {
  if (googleAccessToken) {
    // @ts-ignore
    google.accounts.oauth2.revoke(googleAccessToken);
    googleAccessToken = null;
  }
}

// ============================================
// API HELPERS
// ============================================

async function googleApiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: object
): Promise<T> {
  if (!googleAccessToken) {
    throw new Error('Not authenticated with Google');
  }

  const response = await fetch(`https://classroom.googleapis.com/v1/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Google API request failed');
  }

  return response.json();
}

// ============================================
// COURSE FUNCTIONS
// ============================================

/**
 * List teacher's Google Classroom courses
 */
export async function listCourses(): Promise<GoogleClassroomCourse[]> {
  const response = await googleApiRequest<{ courses: GoogleClassroomCourse[] }>(
    'courses?teacherId=me&courseStates=ACTIVE'
  );
  return response.courses || [];
}

/**
 * Get a specific course
 */
export async function getCourse(courseId: string): Promise<GoogleClassroomCourse> {
  return googleApiRequest<GoogleClassroomCourse>(`courses/${courseId}`);
}

/**
 * Get students in a course
 */
export async function getStudents(courseId: string): Promise<GoogleClassroomStudent[]> {
  const response = await googleApiRequest<{ students: GoogleClassroomStudent[] }>(
    `courses/${courseId}/students`
  );
  return response.students || [];
}

// ============================================
// COURSEWORK FUNCTIONS
// ============================================

/**
 * Create an assignment in Google Classroom
 */
export async function createAssignment(
  courseId: string,
  module: Module,
  dueDate?: Date
): Promise<GoogleClassroomAssignment> {
  const assignment = {
    title: `Week ${module.week_number} Day ${module.day_number}: ${module.title}`,
    description: module.assignment_prompt || module.intro_story || '',
    workType: 'ASSIGNMENT',
    state: 'PUBLISHED',
    maxPoints: 100,
    ...(dueDate && {
      dueDate: {
        year: dueDate.getFullYear(),
        month: dueDate.getMonth() + 1,
        day: dueDate.getDate(),
      },
      dueTime: { hours: 23, minutes: 59 },
    }),
  };

  return googleApiRequest<GoogleClassroomAssignment>(
    `courses/${courseId}/courseWork`,
    'POST',
    assignment
  );
}

/**
 * List assignments in a course
 */
export async function listAssignments(
  courseId: string
): Promise<GoogleClassroomAssignment[]> {
  const response = await googleApiRequest<{ courseWork: GoogleClassroomAssignment[] }>(
    `courses/${courseId}/courseWork`
  );
  return response.courseWork || [];
}

// ============================================
// SYNC FUNCTIONS
// ============================================

/**
 * Sync a BTG class with a Google Classroom course
 */
export async function syncClassWithGoogleCourse(
  _btgClass: Class,
  googleCourseId: string
): Promise<SyncResult> {
  try {
    // Get course info
    const course = await getCourse(googleCourseId);

    // Get students
    const students = await getStudents(googleCourseId);

    return {
      success: true,
      message: `Synced with "${course.name}" (${students.length} students)`,
      data: { course, students },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to sync with Google Classroom',
    };
  }
}

/**
 * Post a module as an assignment to Google Classroom
 */
export async function postModuleToGoogleClassroom(
  googleCourseId: string,
  module: Module,
  dueDate?: Date
): Promise<SyncResult> {
  try {
    const assignment = await createAssignment(googleCourseId, module, dueDate);

    return {
      success: true,
      message: `Posted "${module.title}" to Google Classroom`,
      data: { assignment },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to post to Google Classroom',
    };
  }
}

/**
 * Batch post a week's worth of modules to Google Classroom
 */
export async function postWeekToGoogleClassroom(
  googleCourseId: string,
  modules: Module[],
  startDate: Date
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const dayMillis = 24 * 60 * 60 * 1000;

  for (let i = 0; i < modules.length; i++) {
    const dueDate = new Date(startDate.getTime() + i * dayMillis);
    const result = await postModuleToGoogleClassroom(
      googleCourseId,
      modules[i],
      dueDate
    );
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  return results;
}

// ============================================
// PLACEHOLDER EXPORTS
// ============================================

export default {
  isGoogleClassroomAvailable,
  initGoogleAuth,
  requestGoogleAccess,
  revokeGoogleAccess,
  listCourses,
  getCourse,
  getStudents,
  createAssignment,
  listAssignments,
  syncClassWithGoogleCourse,
  postModuleToGoogleClassroom,
  postWeekToGoogleClassroom,
};
