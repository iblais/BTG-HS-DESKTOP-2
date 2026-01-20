import { supabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
  isNewUser: boolean
}

// Sign up with email and password
// Note: Email verification is disabled in Supabase dashboard for instant account creation
export async function signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Skip email confirmation redirect - users can start immediately
        emailRedirectTo: undefined,
        data: {
          // Store signup metadata
          signed_up_at: new Date().toISOString(),
        }
      }
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, error: 'Failed to create user' }
    }

    // User profile is automatically created by database trigger
    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        isNewUser: true
      },
      error: null
    }
  } catch {
    return { user: null, error: 'An unexpected error occurred' }
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, error: 'Failed to sign in' }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        isNewUser: false
      },
      error: null
    }
  } catch {
    return { user: null, error: 'An unexpected error occurred' }
  }
}

// Sign in with Google OAuth
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: 'Failed to sign in with Google' }
  }
}

// Sign out
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch {
    return { error: 'Failed to sign out' }
  }
}

// Get current session
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email!,
      isNewUser: false
    }
  } catch {
    return null
  }
}

// Check if user has completed onboarding
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('last_active, created_at')
      .eq('id', userId)
      .single()

    // If user doesn't exist yet (new Google OAuth users), skip onboarding
    // The profile will be created automatically when they access dashboard/profile
    if (error && error.code === 'PGRST116') {
      return true;
    }

    // For other errors, skip onboarding to avoid blocking the user
    if (error) {
      return true;
    }

    if (!data) {
      return true;
    }

    // If last_active is more than 1 minute old, they've completed onboarding
    const lastActive = new Date(data.last_active);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);

    return diffMinutes > 1;
  } catch {
    return true;
  }
}

// Mark onboarding as complete
export async function completeOnboarding(userId: string): Promise<void> {
  try {
    await supabase
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId)
  } catch {
    // Silently fail
  }
}
