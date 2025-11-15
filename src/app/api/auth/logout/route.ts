import { createClient } from '@shared/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Logout API Route
 *
 * POST /api/auth/logout
 * Signs out current user
 */
export async function POST() {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[Logout API] Error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('[Logout API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
