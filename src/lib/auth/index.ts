import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

/**
 * Authentication Functions
 *
 * Client-side auth utilities for OAuth and future email/password auth
 */

export type AuthResponse = {
  success: boolean
  error?: string
  user?: User
  session?: Session
}

// =====================================================
// OAUTH AUTHENTICATION
// =====================================================

/**
 * Sign in with Google OAuth
 * Redirects to Google login and returns to /auth/callback
 */
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('[Auth] Google OAuth error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    // OAuth redirects immediately, so we won't reach here
    // But we return success anyway
    return {
      success: true,
    }
  } catch (error) {
    console.error('[Auth] Unexpected error during Google sign-in:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during sign-in',
    }
  }
}

// =====================================================
// EMAIL/PASSWORD AUTHENTICATION
// =====================================================

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  company?: string
): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/credentials/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name: fullName,
        company,
        confirmPassword: password, // Auto-confirm for API
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Registration failed',
      }
    }

    // If email confirmation is required
    if (data.requiresEmailConfirmation) {
      return {
        success: true,
        error: 'Please check your email to confirm your account',
      }
    }

    return {
      success: true,
      user: data.user,
    }
  } catch (error) {
    console.error('[Auth] Sign up error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during sign up',
    }
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/credentials/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Login failed',
      }
    }

    return {
      success: true,
      user: data.user,
    }
  } catch (error) {
    console.error('[Auth] Sign in error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during sign in',
    }
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      console.error('[Auth] Password reset error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('[Auth] Unexpected error during password reset:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Sign out current user
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[Auth] Sign out error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('[Auth] Unexpected error during sign-out:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during sign-out',
    }
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('[Auth] Get session error:', error)
      return null
    }

    return data.session
  } catch (error) {
    console.error('[Auth] Unexpected error getting session:', error)
    return null
  }
}

/**
 * Get current user
 */
export async function getUser(): Promise<User | null> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      console.error('[Auth] Get user error:', error)
      return null
    }

    return data.user
  } catch (error) {
    console.error('[Auth] Unexpected error getting user:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return !!session
}

// =====================================================
// INVITATION HANDLING
// =====================================================

/**
 * Accept an organization invitation
 */
export async function acceptInvitation(
  invitationToken: string
): Promise<AuthResponse> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('accept_invitation', {
      invitation_token: invitationToken,
    })

    if (error) {
      console.error('[Auth] Accept invitation error:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data || !data.success) {
      return {
        success: false,
        error: data?.error || 'Failed to accept invitation',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('[Auth] Unexpected error accepting invitation:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

// =====================================================
// AUTH STATE LISTENER
// =====================================================

/**
 * Subscribe to auth state changes
 * Use this in layouts or providers to track auth state
 */
export function onAuthStateChange(
  callback: (session: Session | null) => void
) {
  const supabase = createClient()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}
