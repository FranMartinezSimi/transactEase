import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { registerSchema } from '@/lib/validations/auth'

/**
 * Email/Password Registration API Route
 *
 * POST /api/auth/credentials/register
 * Creates new user account with email and password
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validation = registerSchema.safeParse(body)
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

    const { email, password, name, company } = validation.data
    const supabase = await createClient()

    // Sign up with email/password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          name: name,
          company: company || null,
        },
      },
    })

    if (error) {
      console.error('[Credentials Register API] Error:', error)

      // Handle specific errors
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { success: false, error: 'An account with this email already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Check if email confirmation is required
    if (!data.session) {
      return NextResponse.json({
        success: true,
        requiresEmailConfirmation: true,
        message: 'Please check your email to confirm your account',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      })
    }

    // Get user profile (should be created by trigger)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id, role, full_name')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('[Credentials Register API] Profile error:', profileError)
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: false,
      user: {
        id: data.user.id,
        email: data.user.email,
        profile: profile || null,
      },
    })
  } catch (error) {
    console.error('[Credentials Register API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
