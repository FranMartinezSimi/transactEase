import { logger } from "@shared/lib/logger";

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[]; // Specific error codes to retry
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 10000, // 10 seconds max
  backoffMultiplier: 2, // Exponential backoff: 1s, 2s, 4s, 8s...
};

/**
 * Retry configuration for critical operations (more retries)
 */
export const CRITICAL_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 500,
  maxDelayMs: 30000, // 30 seconds max
  backoffMultiplier: 2,
};

/**
 * Retry configuration for quick operations (fewer retries)
 */
export const QUICK_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
};

/**
 * Common retryable error codes from Supabase/Postgres
 */
const RETRYABLE_ERROR_CODES = [
  "PGRST504", // Timeout
  "PGRST003", // Internal server error
  "57P03", // Connection does not exist
  "57P05", // Idle in transaction timeout
  "40001", // Serialization failure
  "40P01", // Deadlock detected
  "08006", // Connection failure
  "08003", // Connection does not exist
  "08000", // Connection exception
];

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors?: string[]): boolean {
  const errorCode = error?.code || error?.error?.code;

  if (!errorCode) {
    // Network errors typically don't have codes
    const errorMessage = error?.message?.toLowerCase() || "";
    return (
      errorMessage.includes("network") ||
      errorMessage.includes("timeout") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("econnrefused") ||
      errorMessage.includes("econnreset")
    );
  }

  // Check custom retryable errors first
  if (retryableErrors && retryableErrors.includes(errorCode)) {
    return true;
  }

  // Check default retryable errors
  return RETRYABLE_ERROR_CODES.includes(errorCode);
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attemptNumber: number,
  config: RetryConfig
): number {
  // Exponential backoff: delay = initialDelay * (multiplier ^ attemptNumber)
  const exponentialDelay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attemptNumber);

  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter (random variation ±25%) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() - 0.5);

  return Math.round(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @param operationName - Name for logging purposes
 *
 * @example
 * ```typescript
 * const data = await withRetry(
 *   async () => {
 *     const { data, error } = await supabase.from("deliveries").select().single()
 *     if (error) throw error
 *     return data
 *   },
 *   CRITICAL_RETRY_CONFIG,
 *   "fetchDelivery"
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName = "unknown"
): Promise<T> {
  let lastError: any;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();

      // Log successful retry if we had failures
      if (attempt > 0) {
        const duration = Date.now() - startTime;
        logger.info({
          message: `Operation succeeded after ${attempt} retries`,
          operation: operationName,
          attempts: attempt + 1,
          durationMs: duration,
        });
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      const shouldRetry =
        attempt < config.maxRetries &&
        isRetryableError(error, config.retryableErrors);

      if (!shouldRetry) {
        // Don't retry - either max retries reached or non-retryable error
        const duration = Date.now() - startTime;

        if (attempt === config.maxRetries) {
          logger.error({
            message: `Operation failed after ${config.maxRetries} retries`,
            operation: operationName,
            attempts: attempt + 1,
            durationMs: duration,
            error: {
              message: error?.message,
              code: error?.code,
            },
          });
        } else {
          logger.error({
            message: `Operation failed with non-retryable error`,
            operation: operationName,
            attempts: attempt + 1,
            durationMs: duration,
            error: {
              message: error?.message,
              code: error?.code,
            },
          });
        }

        throw error;
      }

      // Calculate delay and retry
      const delay = calculateDelay(attempt, config);

      logger.warn({
        message: `Operation failed, retrying after delay`,
        operation: operationName,
        attempt: attempt + 1,
        maxRetries: config.maxRetries,
        delayMs: delay,
        error: {
          message: error?.message,
          code: error?.code,
        },
      });

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retry wrapper specifically for Supabase queries
 *
 * Automatically extracts data/error from Supabase response
 *
 * @example
 * ```typescript
 * const delivery = await retrySupabaseQuery(
 *   () => supabase.from("deliveries").select().eq("id", id).single(),
 *   CRITICAL_RETRY_CONFIG,
 *   "fetchDelivery"
 * )
 * ```
 */
export async function retrySupabaseQuery<T>(
  query: () => Promise<{ data: T | null; error: any }>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName = "unknown"
): Promise<T> {
  return withRetry(
    async () => {
      const { data, error } = await query();

      if (error) {
        throw error;
      }

      if (data === null) {
        throw new Error("No data returned from query");
      }

      return data;
    },
    config,
    operationName
  );
}

/**
 * Circuit breaker state
 * Prevents overwhelming a failing service with retries
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private threshold: number = 5, // Open after 5 failures
    private timeout: number = 60000 // Keep open for 60 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === "open") {
      const timeSinceFailure = Date.now() - this.lastFailureTime;

      if (timeSinceFailure > this.timeout) {
        // Try half-open
        this.state = "half-open";
      } else {
        throw new Error(
          `Circuit breaker is OPEN. Service unavailable. Retry after ${Math.round((this.timeout - timeSinceFailure) / 1000)}s`
        );
      }
    }

    try {
      const result = await fn();

      // Success - reset if half-open
      if (this.state === "half-open") {
        this.state = "closed";
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      // Open circuit if threshold reached
      if (this.failures >= this.threshold) {
        this.state = "open";
        logger.error({
          message: "Circuit breaker opened due to repeated failures",
          failures: this.failures,
          threshold: this.threshold,
        });
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  reset() {
    this.state = "closed";
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

// Global circuit breaker for Supabase operations
const supabaseCircuitBreaker = new CircuitBreaker(5, 60000);

/**
 * Execute with both retry and circuit breaker protection
 *
 * Use this for critical operations that need maximum reliability
 */
export async function withRetryAndCircuitBreaker<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName = "unknown"
): Promise<T> {
  return supabaseCircuitBreaker.execute(() =>
    withRetry(fn, config, operationName)
  );
}

/**
 * Get circuit breaker state (for monitoring/debugging)
 */
export function getCircuitBreakerState() {
  return supabaseCircuitBreaker.getState();
}

/**
 * Reset circuit breaker (for testing/manual intervention)
 */
export function resetCircuitBreaker() {
  supabaseCircuitBreaker.reset();
}
