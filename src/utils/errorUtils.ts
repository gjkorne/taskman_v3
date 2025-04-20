/**
 * Error handling utilities
 * Provides centralized error handling and standardized error responses
 */

// Error categories for better organization and handling
export enum ErrorCategory {
  API = 'api',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

// Application error structure
export interface AppError {
  message: string;
  category: ErrorCategory;
  code?: string;
  details?: Record<string, any>;
  originalError?: any;
}

// Error factory functions to create standardized error objects
export const createApiError = (
  message: string,
  code?: string,
  details?: Record<string, any>,
  originalError?: any
): AppError => ({
  message,
  category: ErrorCategory.API,
  code,
  details,
  originalError,
});

export const createValidationError = (
  message: string,
  details?: Record<string, any>
): AppError => ({
  message,
  category: ErrorCategory.VALIDATION,
  details,
});

export const createAuthError = (
  message: string,
  isAuthentication: boolean = true
): AppError => ({
  message,
  category: isAuthentication
    ? ErrorCategory.AUTHENTICATION
    : ErrorCategory.AUTHORIZATION,
});

export const createNetworkError = (
  message: string = 'Network connection error',
  originalError?: any
): AppError => ({
  message,
  category: ErrorCategory.NETWORK,
  originalError,
});

export const createUnknownError = (error: any): AppError => {
  // Extract useful information from various error types
  const message = error?.message || 'An unknown error occurred';

  return {
    message,
    category: ErrorCategory.UNKNOWN,
    originalError: error,
  };
};

/**
 * Process any error into a standardized AppError
 */
export function processError(error: any): AppError {
  // Already processed
  if (
    error?.category &&
    Object.values(ErrorCategory).includes(error.category)
  ) {
    return error as AppError;
  }

  // API error response (from Supabase or similar)
  if (error?.error_description || error?.message) {
    return createApiError(
      error.error_description || error.message,
      error.code || error.statusCode,
      error.details,
      error
    );
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('Network')) {
    return createNetworkError(error.message, error);
  }

  // Unknown errors
  return createUnknownError(error);
}

/**
 * Get user-friendly message from an error
 */
export function getUserFriendlyErrorMessage(error: any): string {
  const appError = processError(error);

  // Category-specific messages
  switch (appError.category) {
    case ErrorCategory.AUTHENTICATION:
      return 'Authentication error. Please sign in again.';

    case ErrorCategory.AUTHORIZATION:
      return "You don't have permission to perform this action.";

    case ErrorCategory.NETWORK:
      return 'Network connection error. Please check your internet connection.';

    case ErrorCategory.VALIDATION:
      return appError.message || 'Please check your input and try again.';

    case ErrorCategory.API:
      return appError.message || 'Server error. Please try again later.';

    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Log error for monitoring/debugging while stripping sensitive info
 */
export function logError(error: any, context: string = ''): void {
  const appError = processError(error);

  // In production, this could send to a monitoring service
  console.error(`[${context}] ${appError.category.toUpperCase()} ERROR:`, {
    message: appError.message,
    code: appError.code,
    category: appError.category,
    // Don't log full details/stack in production
    ...(process.env.NODE_ENV !== 'production'
      ? {
          details: appError.details,
          original: appError.originalError,
        }
      : {}),
  });
}
