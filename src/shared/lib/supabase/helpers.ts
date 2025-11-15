import { PostgrestError } from "@supabase/supabase-js";
import { logger } from "@shared/lib/logger";

/**
 * Supabase Error Helper
 *
 * Provides consistent error handling and logging for Supabase operations
 */

export interface SupabaseOperationContext {
  operation: string;
  table?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Handle Supabase errors with consistent logging and formatting
 *
 * @param error - The Supabase error object
 * @param context - Context about the operation that failed
 * @throws Enhanced error with additional context
 */
export function handleSupabaseError(
  error: PostgrestError | Error | unknown,
  context: SupabaseOperationContext
): never {
  // Check if it's a Postgrest error (from database operations)
  if (isPostgrestError(error)) {
    logger.error({
      message: "Supabase database operation failed",
      operation: context.operation,
      table: context.table,
      userId: context.userId,
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
      metadata: context.metadata,
    });

    // Throw user-friendly error
    throw new Error(getUserFriendlyMessage(error, context));
  }

  // Handle regular errors
  if (error instanceof Error) {
    logger.error({
      message: "Supabase operation failed",
      operation: context.operation,
      table: context.table,
      userId: context.userId,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      metadata: context.metadata,
    });

    throw error;
  }

  // Handle unknown errors
  logger.error({
    message: "Unknown error in Supabase operation",
    operation: context.operation,
    table: context.table,
    userId: context.userId,
    error: String(error),
    metadata: context.metadata,
  });

  throw new Error(`Unknown error in ${context.operation}`);
}

/**
 * Type guard to check if error is a Postgrest error
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "details" in error
  );
}

/**
 * Get user-friendly error message based on Postgrest error code
 */
function getUserFriendlyMessage(
  error: PostgrestError,
  context: SupabaseOperationContext
): string {
  // Common Postgres error codes
  switch (error.code) {
    case "23505": // unique_violation
      return `A ${context.table || "record"} with this information already exists`;

    case "23503": // foreign_key_violation
      return `Cannot complete operation: related record not found`;

    case "23502": // not_null_violation
      return `Missing required information for ${context.operation}`;

    case "42501": // insufficient_privilege
      return "You don't have permission to perform this action";

    case "42P01": // undefined_table
      return "Database configuration error. Please contact support.";

    case "PGRST116": // No rows found
      return `${context.table || "Record"} not found`;

    case "PGRST301": // RLS policy violation
      return "You don't have permission to access this resource";

    default:
      // Return generic message with hint if available
      if (error.hint) {
        return `${error.message}. ${error.hint}`;
      }
      return error.message;
  }
}

/**
 * Wrapper for Supabase operations with automatic error handling
 *
 * Usage:
 * ```typescript
 * const delivery = await withSupabaseErrorHandling(
 *   async () => {
 *     const { data, error } = await supabase
 *       .from("deliveries")
 *       .select()
 *       .eq("id", id)
 *       .single()
 *     if (error) throw error
 *     return data
 *   },
 *   {
 *     operation: "fetchDelivery",
 *     table: "deliveries",
 *     userId: user.id
 *   }
 * )
 * ```
 */
export async function withSupabaseErrorHandling<T>(
  operation: () => Promise<T>,
  context: SupabaseOperationContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleSupabaseError(error, context);
  }
}

/**
 * Type-safe wrapper for Supabase single() queries
 *
 * Throws error if no data is found or if query fails
 */
export async function fetchSingle<T>(
  query: Promise<{ data: T | null; error: PostgrestError | null }>,
  context: SupabaseOperationContext
): Promise<T> {
  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, context);
  }

  if (!data) {
    throw new Error(`${context.table || "Record"} not found`);
  }

  return data;
}

/**
 * Type-safe wrapper for Supabase multiple record queries
 *
 * Returns empty array if no data, throws on error
 */
export async function fetchMany<T>(
  query: Promise<{ data: T[] | null; error: PostgrestError | null }>,
  context: SupabaseOperationContext
): Promise<T[]> {
  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, context);
  }

  return data || [];
}

/**
 * Type-safe wrapper for Supabase insert/update/delete operations
 *
 * Returns the affected data or throws on error
 */
export async function executeQuery<T>(
  query: Promise<{ data: T | null; error: PostgrestError | null }>,
  context: SupabaseOperationContext
): Promise<T> {
  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, context);
  }

  if (!data) {
    throw new Error(`${context.operation} failed: no data returned`);
  }

  return data;
}

/**
 * Check if a record exists in a table
 */
export async function recordExists(
  query: Promise<{ data: unknown | null; error: PostgrestError | null }>,
  context: SupabaseOperationContext
): Promise<boolean> {
  const { data, error } = await query;

  if (error) {
    // Don't throw for "not found" errors
    if (error.code === "PGRST116") {
      return false;
    }
    handleSupabaseError(error, context);
  }

  return data !== null;
}

/**
 * Validate that user has permission to access a resource
 * Commonly used pattern in API routes
 */
export async function validateUserAccess(
  supabaseClient: any,
  userId: string,
  resourceId: string,
  resourceTable: string,
  userIdColumn = "created_by"
): Promise<boolean> {
  const { data, error } = await supabaseClient
    .from(resourceTable)
    .select("id")
    .eq("id", resourceId)
    .eq(userIdColumn, userId)
    .maybeSingle();

  if (error) {
    handleSupabaseError(error, {
      operation: "validateUserAccess",
      table: resourceTable,
      userId,
      metadata: { resourceId },
    });
  }

  return data !== null;
}
