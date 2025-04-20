/**
 * Retry mechanism for failed operations
 * This utility provides standardized ways to retry failed operations
 * with exponential backoff and configurable retry limits
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number; // in milliseconds
  maxDelay?: number; // in milliseconds
  backoffFactor?: number; // multiplier for each retry
  retryableStatusCodes?: number[]; // HTTP status codes to retry
  retryableErrors?: string[]; // Error names or types to retry
  onRetry?: (error: any, attempt: number) => void; // callback on each retry
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 300,
  maxDelay: 5000,
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['NetworkError', 'TimeoutError'],
  onRetry: undefined,
};

/**
 * Determines if an error is retryable based on options
 */
function isRetryableError(error: any, options: RetryOptions): boolean {
  // Check for network error or timeout
  if (error?.name && options.retryableErrors?.includes(error.name)) {
    return true;
  }

  // Check for retryable status codes
  if (error?.status && options.retryableStatusCodes?.includes(error.status)) {
    return true;
  }

  // For Supabase/fetch specific errors
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
    return true;
  }

  return false;
}

/**
 * Calculate delay for the next retry using exponential backoff
 */
function calculateBackoff(attempt: number, options: RetryOptions): number {
  const backoffFactor =
    options.backoffFactor || DEFAULT_RETRY_OPTIONS.backoffFactor!;
  const delay = options.initialDelay * Math.pow(backoffFactor, attempt);
  return Math.min(delay, options.maxDelay || DEFAULT_RETRY_OPTIONS.maxDelay!);
}

/**
 * Wait for specified milliseconds
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 *
 * @param fn The function to execute (must return a Promise)
 * @param options Retry configuration options
 * @returns Promise that resolves with the function result or rejects after all retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const retryOptions: RetryOptions = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: any;

  for (let attempt = 0; attempt <= retryOptions.maxRetries; attempt++) {
    try {
      // First attempt (attempt 0) or actual retry attempts
      if (attempt > 0) {
        // Wait for backoff delay before retrying (not on first attempt)
        const delay = calculateBackoff(attempt - 1, retryOptions);
        await wait(delay);

        // Call the onRetry callback if provided
        if (retryOptions.onRetry) {
          retryOptions.onRetry(lastError, attempt);
        }
      }

      return await fn();
    } catch (error) {
      lastError = error;

      // If this is the last attempt or the error is not retryable, propagate the error
      if (
        attempt === retryOptions.maxRetries ||
        !isRetryableError(error, retryOptions)
      ) {
        throw error;
      }

      // Otherwise, we'll retry on the next iteration
    }
  }

  // This should never be reached due to the throw in the catch block
  throw lastError;
}

/**
 * Create a function that will apply retry logic to another function
 * Useful for creating reusable retry-enabled function wrappers
 */
export function createRetryableFunction<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: Partial<RetryOptions> = {}
): (...args: Args) => Promise<T> {
  return (...args: Args) => {
    return withRetry(() => fn(...args), options);
  };
}
