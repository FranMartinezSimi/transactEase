import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { loginSchema } from '@/lib/validations/auth'

/**
 * Email/Password Login API Route
 *
 * POST /api/auth/credentials/login
 * Authenticates user with email and password
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const { email, password } = validation.data
    const supabase = await createClient()

    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[Credentials Login API] Error:', error)
      return NextResponse.json(
        {
          success: false,
          error: error.message === 'Invalid login credentials'
            ? 'Invalid email or password'
            : error.message,
        },
        { status: 401 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { success: false, error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id, role, is_temporary, full_name')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('[Credentials Login API] Profile error:', profileError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        profile: profile || null,
      },
    })
  } catch (error) {
    console.error('[Credentials Login API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
