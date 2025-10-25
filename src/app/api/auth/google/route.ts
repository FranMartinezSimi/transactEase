import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Google OAuth API Route
 *
 * POST /api/auth/google
 * Initiates Google OAuth flow
 */
export async function POST(request: Request) {
  try {
    const { redirectTo } = await request.json()
    const supabase = await createClient()

    const origin = new URL(request.url).origin

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo || '/dashboard')}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('[Google OAuth API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Return the OAuth URL for redirect
    return NextResponse.json({
      success: true,
      url: data.url,
    })
  } catch (error) {
    console.error('[Google OAuth API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
