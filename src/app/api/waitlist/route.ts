import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    // Validate inputs
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Google Sheets integration
    const GOOGLE_SHEETS_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL

    if (!GOOGLE_SHEETS_URL) {
      console.error('GOOGLE_SHEETS_WEBHOOK_URL not configured')
      // Still return success to user, but log the error
      return NextResponse.json(
        {
          success: true,
          message: 'Added to waitlist!',
          warning: 'Sheet integration not configured'
        },
        { status: 200 }
      )
    }

    // Send to Google Sheets via webhook/Apps Script
    const timestamp = new Date().toISOString()
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        timestamp,
        source: 'landing-page',
      }),
    })

    if (!response.ok) {
      console.error('Failed to send to Google Sheets:', await response.text())
      return NextResponse.json(
        {
          success: true,
          message: 'Added to waitlist!',
          warning: 'Sheet sync pending'
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully added to waitlist!'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
