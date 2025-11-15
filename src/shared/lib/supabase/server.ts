"use server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/**
 * Supabase Client for Server Components and Server Actions
 *
 * Use this in:
 * - Server Components (app directory, no "use client")
 * - Server Actions ('use server')
 * - API Routes (when you need user context)
 *
 * Features:
 * - Server-side cookie management
 * - User session handling with RLS
 * - Environment validation
 * - Automatic session refresh (via middleware)
 *
 * Important:
 * - Uses ANON_KEY (respects RLS policies)
 * - For admin operations, use createAdminClient from './admin'
 *
 * Usage:
 * ```typescript
 * import { createClient } from '@shared/lib/supabase/server'
 *
 * export async function GET() {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   // ... rest of your code
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabaseEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
