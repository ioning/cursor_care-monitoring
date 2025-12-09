import { createLogger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: any) => boolean;
}

const defaultRetryableErrors = (error: any): boolean => {
  // Retry on network errors, timeouts, and 5xx errors
  if (!error.response) {
    return true; // Network error
  }
  const status = error.response?.status;
  return status >= 500 || status === 429; // Server error or rate limit
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  logger?: ReturnType<typeof createLogger>,
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableErrors = defaultRetryableErrors,
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (!retryableErrors(error)) {
        logger?.debug('Error is not retryable', { error: error.message, attempt });
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        logger?.warn('Max retry attempts reached', {
          attempts: maxAttempts,
          error: error.message,
        });
        throw error;
      }

      // Log retry attempt
      logger?.info('Retrying after error', {
        attempt,
        maxAttempts,
        delay,
        error: error.message,
      });

      // Wait before retry
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: any) => boolean;
}

const defaultRetryableErrors = (error: any): boolean => {
  // Retry on network errors, timeouts, and 5xx errors
  if (!error.response) {
    return true; // Network error
  }
  const status = error.response?.status;
  return status >= 500 || status === 429; // Server error or rate limit
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  logger?: ReturnType<typeof createLogger>,
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableErrors = defaultRetryableErrors,
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (!retryableErrors(error)) {
        logger?.debug('Error is not retryable', { error: error.message, attempt });
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        logger?.warn('Max retry attempts reached', {
          attempts: maxAttempts,
          error: error.message,
        });
        throw error;
      }

      // Log retry attempt
      logger?.info('Retrying after error', {
        attempt,
        maxAttempts,
        delay,
        error: error.message,
      });

      // Wait before retry
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}







