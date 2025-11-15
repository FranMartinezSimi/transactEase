"use server";

import { createClient } from "@supabase/supabase-js";
import { supabaseEnv, getServiceRoleKey } from "./env";

/**
 * Supabase Admin Client (Service Role)
 *
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS)
 *
 * Use ONLY for:
 * - Creating temporary users
 * - Admin operations that need to bypass RLS
 * - System-level database operations
 * - Cron jobs and background tasks
 *
 * NEVER use for:
 * - Regular user operations (use server.ts instead)
 * - Client-side code (this will throw an error)
 * - Operations where RLS should be enforced
 *
 * Security considerations:
 * - This client has full database access
 * - All RLS policies are bypassed
 * - Only use in trusted server-side code
 * - Always validate inputs before using this client
 */
export function createAdminClient() {
  // Ensure we're on the server
  if (typeof window !== "undefined") {
    throw new Error(
      "🚨 SECURITY VIOLATION: Admin client cannot be created on the client-side. " +
      "This would expose your service role key to the browser."
    );
  }

  const serviceRoleKey = getServiceRoleKey();

  return createClient(supabaseEnv.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    // Disable realtime for admin client (not needed)
    realtime: {
      params: {
        eventsPerSecond: 0,
      },
    },
  });
}

/**
 * Helper function to execute admin operations with automatic logging
 *
 * Usage:
 * ```typescript
 * const result = await withAdminClient(async (admin) => {
 *   return await admin.from("profiles").insert({ ... })
 * })
 * ```
 */
export async function withAdminClient<T>(
  operation: (client: ReturnType<typeof createAdminClient>) => Promise<T>,
  operationName?: string
): Promise<T> {
  const startTime = Date.now();
  const admin = createAdminClient();

  try {
    const result = await operation(admin);
    const duration = Date.now() - startTime;

    // Log successful admin operation
    console.log(`[Admin Operation] ${operationName || "Unknown"} completed in ${duration}ms`);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log failed admin operation
    console.error(`[Admin Operation] ${operationName || "Unknown"} failed after ${duration}ms:`, error);

    throw error;
  }
}

/**
 * Type-safe helper to create temporary users
 * This is a common admin operation, so we provide a dedicated helper
 */
export async function createTemporaryUser(data: {
  email: string;
  fullName: string;
  organizationId: string;
  expiresAt: Date;
}) {
  return withAdminClient(async (admin) => {
    const { data: profile, error } = await admin
      .from("profiles")
      .insert({
        email: data.email,
        full_name: data.fullName,
        organization_id: data.organizationId,
        is_temporary: true,
        role: "member",
        is_active: true,
        email_verified: false,
        temp_user_expires_at: data.expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create temporary user: ${error.message}`);
    }

    return profile;
  }, "createTemporaryUser");
}

/**
 * Helper to check if a user exists (admin-level check, bypasses RLS)
 */
export async function userExists(email: string): Promise<boolean> {
  return withAdminClient(async (admin) => {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to check if user exists: ${error.message}`);
    }

    return data !== null;
  }, "userExists");
}

/**
 * Helper to cleanup expired temporary users (for cron jobs)
 */
export async function cleanupExpiredTempUsers(): Promise<number> {
  return withAdminClient(async (admin) => {
    const { data, error } = await admin
      .from("profiles")
      .delete()
      .eq("is_temporary", true)
      .lt("temp_user_expires_at", new Date().toISOString())
      .select();

    if (error) {
      throw new Error(`Failed to cleanup expired temp users: ${error.message}`);
    }

    return data?.length || 0;
  }, "cleanupExpiredTempUsers");
}
