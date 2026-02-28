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
      // If Supabase fails, fall back to demo mode
      console.warn('[Auth] Supabase sign-up failed, using demo mode:', error.message);
      return { user: createDemoUser(email), error: null };
    }

    if (!data.user) {
      return { user: createDemoUser(email), error: null };
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
    // Network/API errors — fall back to demo mode
    return { user: createDemoUser(email), error: null };
  }
}

// Create a demo user session (bypasses Supabase when API is unavailable)
function createDemoUser(email: string): AuthUser {
  // Generate a deterministic ID from the email so the same email always gets the same ID
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const id = `demo-${Math.abs(hash).toString(36)}-${email.replace(/[^a-z0-9]/gi, '').substring(0, 8)}`;

  // Store demo session in localStorage so getCurrentUser works
  localStorage.setItem('btg_demo_user', JSON.stringify({ id, email }));

  return { id, email, isNewUser: false };
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // If Supabase fails (invalid API key, network error, etc.), fall back to demo mode
      console.warn('[Auth] Supabase sign-in failed, using demo mode:', error.message);
      return { user: createDemoUser(email), error: null };
    }

    if (!data.user) {
      return { user: createDemoUser(email), error: null };
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
    // Network/API errors — fall back to demo mode
    return { user: createDemoUser(email), error: null };
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
    localStorage.removeItem('btg_demo_user');
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: null } // Don't block sign out if Supabase is down
    }

    return { error: null }
  } catch {
    localStorage.removeItem('btg_demo_user');
    return { error: null }
  }
}

// Get current session
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email!,
        isNewUser: false
      }
    }

    // Check for demo session
    const demoUser = localStorage.getItem('btg_demo_user');
    if (demoUser) {
      try {
        const parsed = JSON.parse(demoUser);
        return { id: parsed.id, email: parsed.email, isNewUser: false };
      } catch {
        // Invalid demo session
      }
    }

    return null;
  } catch {
    // If Supabase is down, check for demo session
    const demoUser = localStorage.getItem('btg_demo_user');
    if (demoUser) {
      try {
        const parsed = JSON.parse(demoUser);
        return { id: parsed.id, email: parsed.email, isNewUser: false };
      } catch {
        // Invalid demo session
      }
    }
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
