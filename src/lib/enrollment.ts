import { supabase, type ProgramId, type TrackLevel, type Language } from './supabase';
import { getCurrentUser } from './auth';

// Local storage key for offline enrollments
const LOCAL_ENROLLMENT_KEY = 'btg_local_enrollment';

export interface Program {
  id: ProgramId;
  title: string;
  description: string | null;
  weeks_total: number;
  target_audience: string | null;
}

export interface Enrollment {
  id: string;
  user_id: string;
  program_id: ProgramId;
  track_level: TrackLevel;
  language: Language;
  enrolled_at: string;
  completed_at: string | null;
}

// Fallback programs when database is not available
// Note: College track hidden - will be separate build later
const FALLBACK_PROGRAMS: Program[] = [
  {
    id: 'HS' as ProgramId,
    title: 'High School Program',
    description: 'A comprehensive 18-week financial literacy course designed for high school students. Learn budgeting, saving, credit basics, and smart money habits.',
    weeks_total: 18,
    target_audience: 'High School Students'
  }
];

/**
 * Get local enrollment from localStorage
 */
export function getLocalEnrollment(): Enrollment | null {
  try {
    const stored = localStorage.getItem(LOCAL_ENROLLMENT_KEY);
    if (stored) {
      return JSON.parse(stored) as Enrollment;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Create a local-only enrollment when database is unavailable
 */
function createLocalEnrollment(
  userId: string,
  programId: ProgramId,
  trackLevel: TrackLevel,
  language: Language
): Enrollment {
  const enrollment: Enrollment = {
    id: `local_${Date.now()}`,
    user_id: userId,
    program_id: programId,
    track_level: trackLevel,
    language: language,
    enrolled_at: new Date().toISOString(),
    completed_at: null
  };

  localStorage.setItem(LOCAL_ENROLLMENT_KEY, JSON.stringify(enrollment));
  return enrollment;
}

/**
 * Get all available programs
 * Falls back to hardcoded programs if database is unavailable
 */
export async function getPrograms(): Promise<Program[]> {
  try {
    // Only fetch HS program - College track hidden for now
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', 'HS')
      .order('id');

    if (error) {
      console.warn('Failed to fetch programs from database, using fallback:', error.message);
      return FALLBACK_PROGRAMS;
    }

    // If no programs in database, use fallback
    if (!data || data.length === 0) {
      console.warn('No programs in database, using fallback');
      return FALLBACK_PROGRAMS;
    }

    // Filter to only HS program (college track hidden for now)
    const hsPrograms = (data as Program[]).filter(p => p.id === 'HS');
    return hsPrograms.length > 0 ? hsPrograms : FALLBACK_PROGRAMS;
  } catch (err) {
    console.warn('Error fetching programs, using fallback:', err);
    return FALLBACK_PROGRAMS;
  }
}

/**
 * Get user's active enrollment
 * Returns the most recent enrollment for the user
 * Falls back to local storage if database is unavailable
 */
export async function getActiveEnrollment(): Promise<Enrollment | null> {
  const user = await getCurrentUser();
  if (!user) {
    // Check for local enrollment even without user (shouldn't happen, but fallback)
    return getLocalEnrollment();
  }

  // Wrap Supabase query in a real Promise (query builder is not a true Promise)
  const queryPromise = new Promise<{ data: unknown; error: unknown }>((resolve) => {
    supabase
      .from('enrollments')
      .select('id, user_id, program_id, track_level, language, enrolled_at')
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((result) => resolve({ data: result.data, error: result.error }));
  });

  // Timeout promise - resolves with null data after 8 seconds
  const timeoutPromise = new Promise<{ data: unknown; error: unknown }>((resolve) => {
    setTimeout(() => resolve({ data: null, error: null }), 8000);
  });

  try {
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as {
      data: Enrollment | null;
      error: { code?: string; message?: string } | null
    };

    if (error) {
      console.warn('Error fetching enrollment from database, checking local:', error.message);
      // Fall back to local storage
      return getLocalEnrollment();
    }

    if (!data) {
      // No enrollment in database, check local storage
      return getLocalEnrollment();
    }

    // Save to local storage as backup
    const enrollment = { ...data, completed_at: null } as Enrollment;
    localStorage.setItem(LOCAL_ENROLLMENT_KEY, JSON.stringify(enrollment));

    return enrollment;
  } catch (err) {
    console.warn('Error fetching enrollment, checking local:', err);
    // Fall back to local storage
    return getLocalEnrollment();
  }
}

/**
 * Create a new enrollment for the user
 * If user already has an enrollment for this program, return it.
 * Otherwise, create a new enrollment.
 * Falls back to local storage if database is unavailable.
 */
export async function createEnrollment(
  programId: ProgramId,
  trackLevel: TrackLevel = 'beginner',
  language: Language = 'en'
): Promise<Enrollment> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // First, check if an enrollment already exists for this user/program
    const { data: existingEnrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('id, user_id, program_id, track_level, language, enrolled_at')
      .eq('user_id', user.id)
      .eq('program_id', programId)
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!fetchError && existingEnrollment) {
      // Save to local storage as backup
      const enrollment = { ...existingEnrollment, completed_at: null } as Enrollment;
      localStorage.setItem(LOCAL_ENROLLMENT_KEY, JSON.stringify(enrollment));
      return enrollment;
    }

    // Create new enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: user.id,
        program_id: programId,
        track_level: trackLevel,
        language: language
      })
      .select('id, user_id, program_id, track_level, language, enrolled_at')
      .single();

    if (!error && data) {
      const enrollment = { ...data, completed_at: null } as Enrollment;
      // Save to local storage as backup
      localStorage.setItem(LOCAL_ENROLLMENT_KEY, JSON.stringify(enrollment));
      return enrollment;
    }

    // If database fails, create local enrollment
    console.warn('Database enrollment failed, creating local enrollment:', error?.message);
    return createLocalEnrollment(user.id, programId, trackLevel, language);
  } catch (err) {
    console.warn('Error creating enrollment, using local storage:', err);
    return createLocalEnrollment(user.id, programId, trackLevel, language);
  }
}

/**
 * Check if user has any enrollment
 * Pass userId directly to avoid extra auth calls
 * Also checks local storage as fallback
 */
export async function hasEnrollment(userId?: string): Promise<boolean> {
  // First check local storage
  const localEnrollment = getLocalEnrollment();
  if (localEnrollment) {
    return true;
  }

  // Get user ID if not provided
  let uid = userId;
  if (!uid) {
    const user = await getCurrentUser();
    if (!user) return false;
    uid = user.id;
  }

  // Wrap Supabase query in a real Promise (query builder is not a true Promise)
  const queryPromise = new Promise<{ count: number | null; error: unknown }>((resolve) => {
    supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .then((result) => resolve({ count: result.count, error: result.error }));
  });

  // Timeout promise - resolves with count: 0 after 5 seconds
  const timeoutPromise = new Promise<{ count: number | null; error: unknown }>((resolve) => {
    setTimeout(() => resolve({ count: 0, error: null }), 5000);
  });

  try {
    const { count, error } = await Promise.race([queryPromise, timeoutPromise]) as {
      count: number | null;
      error: { code?: string } | null;
    };

    if (error) {
      // If table doesn't exist or RLS blocks, check local storage
      return localEnrollment !== null;
    }

    return (count ?? 0) > 0;
  } catch {
    // On any error, check local storage
    return localEnrollment !== null;
  }
}

/**
 * Get program details by ID
 */
export async function getProgramById(programId: ProgramId): Promise<Program | null> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', programId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch program: ${error.message}`);
  }

  return data as Program;
}

/**
 * Update enrollment track level or language
 */
export async function updateEnrollment(
  enrollmentId: string,
  updates: { track_level?: TrackLevel; language?: Language }
): Promise<void> {
  const { error } = await supabase
    .from('enrollments')
    .update(updates)
    .eq('id', enrollmentId);

  if (error) {
    throw new Error(`Failed to update enrollment: ${error.message}`);
  }
}

/**
 * Complete an enrollment (mark as finished)
 * Note: This is a no-op if completed_at column doesn't exist
 */
export async function completeEnrollment(enrollmentId: string): Promise<void> {
  try {
    await supabase
      .from('enrollments')
      .update({
        completed_at: new Date().toISOString()
      })
      .eq('id', enrollmentId);
  } catch {
    // Silently ignore if completed_at column doesn't exist
  }
}

/**
 * Get all user's enrollments
 */
export async function getAllEnrollments(): Promise<Enrollment[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('enrollments')
    .select('id, user_id, program_id, track_level, language, enrolled_at')
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch enrollments: ${error.message}`);
  }

  return (data || []).map(e => ({ ...e, completed_at: null })) as Enrollment[];
}
