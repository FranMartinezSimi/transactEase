import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/**
 * Supabase Client for Client Components
 *
 * Use this in "use client" components, hooks, and client-side logic.
 * This client automatically handles cookies and session management in the browser.
 *
 * Features:
 * - Automatic cookie management
 * - Session persistence
 * - Auto-refresh tokens
 * - Environment validation (fails fast if env vars missing)
 *
 * Usage:
 * ```typescript
 * "use client"
 * import { createClient } from '@shared/lib/supabase/client'
 *
 * const supabase = createClient()
 * const { data, error } = await supabase.from('table').select()
 * ```
 */
export function createClient() {
  return createBrowserClient(
    supabaseEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabaseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
