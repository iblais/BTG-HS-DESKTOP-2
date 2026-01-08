/**
 * Error Logging Utility for BTG Platform
 * Logs errors to Supabase for debugging and monitoring
 */

import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export type ErrorType = 'enrollment' | 'quiz' | 'assignment' | 'auth' | 'general' | 'network' | 'validation';

export interface ErrorLogEntry {
  error_type: ErrorType;
  error_code?: string;
  error_message: string;
  error_details?: Record<string, unknown>;
  stack_trace?: string;
  page_url?: string;
  user_agent?: string;
}

// ============================================
// LOGGING FUNCTIONS
// ============================================

/**
 * Log an error to the database
 */
export async function logError(entry: ErrorLogEntry): Promise<string | null> {
  try {
    // Try using the RPC function first (more secure)
    const { data, error } = await supabase.rpc('log_error', {
      p_error_type: entry.error_type,
      p_error_message: entry.error_message,
      p_error_code: entry.error_code || null,
      p_error_details: entry.error_details || null,
      p_stack_trace: entry.stack_trace || null,
      p_page_url: entry.page_url || (typeof window !== 'undefined' ? window.location.href : null),
    });

    if (error) {
      // Fall back to direct insert if RPC fails
      const { data: insertData, error: insertError } = await supabase
        .from('error_logs')
        .insert({
          error_type: entry.error_type,
          error_code: entry.error_code,
          error_message: entry.error_message,
          error_details: entry.error_details,
          stack_trace: entry.stack_trace,
          page_url: entry.page_url || (typeof window !== 'undefined' ? window.location.href : null),
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[ErrorLog] Failed to log error:', insertError);
        return null;
      }

      return insertData?.id || null;
    }

    return data;
  } catch (err) {
    console.error('[ErrorLog] Exception while logging:', err);
    return null;
  }
}

/**
 * Log an error from a caught exception
 */
export async function logException(
  error: unknown,
  type: ErrorType = 'general',
  context?: Record<string, unknown>
): Promise<string | null> {
  const errorObj = error as Error;

  return logError({
    error_type: type,
    error_code: (error as any)?.code || undefined,
    error_message: errorObj?.message || String(error),
    error_details: {
      ...context,
      name: errorObj?.name,
    },
    stack_trace: errorObj?.stack,
  });
}

/**
 * Create an error with logging
 */
export async function createLoggedError(
  message: string,
  type: ErrorType,
  code?: string,
  context?: Record<string, unknown>
): Promise<Error> {
  const error = new Error(message);
  (error as any).code = code;

  await logError({
    error_type: type,
    error_code: code,
    error_message: message,
    error_details: context,
    stack_trace: error.stack,
  });

  return error;
}

// ============================================
// HELPER TO FORMAT ERRORS FOR DISPLAY
// ============================================

export function formatErrorForDisplay(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  const errorObj = error as any;

  // Supabase errors
  if (errorObj?.message) {
    // Clean up common Supabase error messages
    const msg = errorObj.message;

    if (msg.includes('duplicate key')) {
      return 'This record already exists.';
    }
    if (msg.includes('violates foreign key constraint')) {
      return 'Invalid reference. Please try again.';
    }
    if (msg.includes('permission denied') || msg.includes('RLS')) {
      return 'You do not have permission to perform this action.';
    }
    if (msg.includes('JWT expired')) {
      return 'Your session has expired. Please sign in again.';
    }
    if (msg.includes('network')) {
      return 'Network error. Please check your connection.';
    }

    return msg;
  }

  return 'An unexpected error occurred. Please try again.';
}

// ============================================
// ENROLLMENT-SPECIFIC ERROR HANDLING
// ============================================

export interface EnrollmentResult {
  success: boolean;
  enrollmentId?: string;
  error?: string;
  errorCode?: string;
}

export async function handleEnrollmentError(
  error: unknown,
  programId: string,
  trackLevel: string,
  language: string
): Promise<EnrollmentResult> {
  const errorMessage = formatErrorForDisplay(error);
  const errorCode = (error as any)?.code || 'UNKNOWN';

  await logError({
    error_type: 'enrollment',
    error_code: errorCode,
    error_message: (error as any)?.message || errorMessage,
    error_details: {
      programId,
      trackLevel,
      language,
      originalError: String(error),
    },
  });

  return {
    success: false,
    error: errorMessage,
    errorCode,
  };
}

export default {
  logError,
  logException,
  createLoggedError,
  formatErrorForDisplay,
  handleEnrollmentError,
};
