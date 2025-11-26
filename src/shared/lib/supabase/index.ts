/**
 * Supabase Client Library
 *
 * Centralized exports for all Supabase-related functionality
 *
 * Usage:
 * ```typescript
 * // Client-side
 * import { createClient } from '@shared/lib/supabase'
 *
 * // Server-side
 * import { createClient } from '@shared/lib/supabase/server'
 *
 * // Admin operations
 * import { createAdminClient, createTemporaryUser } from '@shared/lib/supabase/admin'
 *
 * // Error handling
 * import { handleSupabaseError, fetchSingle } from '@shared/lib/supabase/helpers'
 *
 * // Retry logic
 * import { withRetry, CRITICAL_RETRY_CONFIG } from '@shared/lib/supabase/retry'
 * ```
 */

// Client exports
export { createClient } from "./client";
export { createClient as createServerClient } from "./server";
export {
  createAdminClient,
  withAdminClient,
  createTemporaryUser,
  userExists,
  cleanupExpiredTempUsers,
} from "./admin";

// Helper exports
export {
  handleSupabaseError,
  withSupabaseErrorHandling,
  fetchSingle,
  fetchMany,
  executeQuery,
  recordExists,
  validateUserAccess,
  type SupabaseOperationContext,
} from "./helpers";

// Retry exports
export {
  withRetry,
  retrySupabaseQuery,
  withRetryAndCircuitBreaker,
  getCircuitBreakerState,
  resetCircuitBreaker,
  DEFAULT_RETRY_CONFIG,
  CRITICAL_RETRY_CONFIG,
  QUICK_RETRY_CONFIG,
  type RetryConfig,
} from "./retry";

// Environment validation
export { supabaseEnv, isServer, getServiceRoleKey } from "./env";
