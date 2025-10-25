import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase Client for Client Components
 *
 * Use this in "use client" components, hooks, and client-side logic.
 * This client automatically handles cookies and session management in the browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
