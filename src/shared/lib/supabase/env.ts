import { z } from "zod";

/**
 * Supabase Environment Variables Schema
 *
 * Validates that all required Supabase environment variables are present
 * and properly formatted. This runs at build time and prevents runtime errors.
 */
const supabaseEnvSchema = z.object({
  // Public variables (safe to expose to frontend)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    .refine(
      (url) => url.includes("supabase.co") || url.includes("localhost"),
      "NEXT_PUBLIC_SUPABASE_URL must be a Supabase URL"
    ),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
    .refine(
      (key) => key.startsWith("eyJ"),
      "NEXT_PUBLIC_SUPABASE_ANON_KEY must be a valid JWT token"
    ),

  // Server-only variables (never expose to frontend)
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required for server operations")
    .refine(
      (key) => key.startsWith("eyJ"),
      "SUPABASE_SERVICE_ROLE_KEY must be a valid JWT token"
    )
    .optional(), // Optional in development, required in production
});

/**
 * Validate and parse environment variables
 *
 * This will throw an error at build time if variables are missing or invalid,
 * preventing deployment of a broken configuration.
 */
function validateEnv() {
  try {
    return supabaseEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");

      throw new Error(
        `❌ Invalid Supabase environment variables:\n${issues}\n\n` +
        `Please check your .env.local file and ensure all required variables are set.\n` +
        `See .env.example for reference.`
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Export this to use validated env vars throughout the app
 */
export const supabaseEnv = validateEnv();

/**
 * Helper to check if we're in server context
 * Service role key should only be used server-side
 */
export const isServer = typeof window === "undefined";

/**
 * Get service role key (server-side only)
 * Throws error if called from client-side
 */
export function getServiceRoleKey(): string {
  if (!isServer) {
    throw new Error(
      "🚨 SECURITY: Service Role Key cannot be accessed from client-side code. " +
      "This is a critical security violation."
    );
  }

  if (!supabaseEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. " +
      "This is required for admin operations. " +
      "Add it to your .env.local file."
    );
  }

  return supabaseEnv.SUPABASE_SERVICE_ROLE_KEY;
}
