import { supabase, type ProgramId, type TrackLevel, type Language } from './supabase';
import { getCurrentUser } from './auth';

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

/**
 * Get all available programs
 */
export async function getPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('id');

  if (error) {
    // Check for RLS policy errors
    if (error.code === '42501' || error.message?.includes('policy')) {
      throw new Error('Database permissions not configured. Please run migrations 001 and 003 in Supabase.');
    }
    // Check for missing table
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      throw new Error('Programs table does not exist. Please run migration 003 in Supabase to create and seed it.');
    }
    throw new Error(`Failed to fetch programs: ${error.message}`);
  }

  return data as Program[];
}

/**
 * Get user's active enrollment
 * Returns the most recent enrollment for the user
 */
export async function getActiveEnrollment(): Promise<Enrollment | null> {
  const user = await getCurrentUser();
  if (!user) return null;

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
      // Check for RLS policy errors
      if (error.code === '42501' || error.message?.includes('policy')) {
        throw new Error('Database permissions not configured. Please run migrations 001 and 004 in Supabase.');
      }
      // Check for missing column/table errors
      if (error.code === '42703' || error.code === '42P01' || error.message?.includes('does not exist')) {
        throw new Error(`Database schema issue: ${error.message}`);
      }
      throw new Error(`Failed to fetch enrollment: ${error.message}`);
    }

    if (!data) return null;

    return {
      ...data,
      completed_at: null
    } as Enrollment;
  } catch (err) {
    throw err;
  }
}

/**
 * Create a new enrollment for the user
 * If user already has an enrollment for this program, return it.
 * Otherwise, create a new enrollment.
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

  // First, check if an enrollment already exists for this user/program
  const { data: existingEnrollment, error: fetchError } = await supabase
    .from('enrollments')
    .select('id, user_id, program_id, track_level, language, enrolled_at')
    .eq('user_id', user.id)
    .eq('program_id', programId)
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  // If an enrollment exists, return it
  if (existingEnrollment) {
    return { ...existingEnrollment, completed_at: null } as Enrollment;
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

  if (error) {
    // Check for RLS policy errors
    if (error.code === '42501' || error.message?.includes('policy')) {
      throw new Error('Database permissions not configured. Please run migration 004 in Supabase to enable RLS policies.');
    }
    // Check for foreign key errors (program doesn't exist)
    if (error.code === '23503') {
      throw new Error('Selected program does not exist. Please run migration 003 to seed programs table.');
    }
    // Check for unique constraint violations
    if (error.code === '23505') {
      throw new Error('You already have an enrollment for this program.');
    }
    throw error;
  }

  return { ...data, completed_at: null } as Enrollment;
}

/**
 * Check if user has any enrollment
 * Pass userId directly to avoid extra auth calls
 */
export async function hasEnrollment(userId?: string): Promise<boolean> {
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
      // If table doesn't exist or RLS blocks, treat as no enrollment
      if (error.code === '42P01' || error.code === '42501') {
        return false;
      }
      // On other errors, let user proceed to program selection
      return false;
    }

    return (count ?? 0) > 0;
  } catch {
    // On any error, return false to allow user to proceed
    return false;
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
