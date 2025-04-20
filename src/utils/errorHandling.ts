/**
 * Standardized error types for the application
 * Provides consistent error handling and reporting
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  DATA_SYNC = 'DATA_SYNC',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorDetails {
  message: string;
  code?: string;
  field?: string;
  originalError?: any;
  timestamp?: string;
}

/**
 * Application error class with standardized format
 * for consistent error reporting, logging, and handling
 */
export class AppError extends Error {
  readonly type: ErrorType;
  readonly details: ErrorDetails;
  readonly isHandled: boolean;
  readonly isOperational: boolean;

  constructor(
    type: ErrorType,
    message: string,
    details?: Omit<ErrorDetails, 'message'>,
    isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.details = {
      message,
      timestamp: new Date().toISOString(),
      ...details,
    };
    this.isHandled = false;
    this.isOperational = isOperational;

    // This is needed for proper stack trace in TypeScript
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a network error
   */
  static network(
    message: string,
    details?: Omit<ErrorDetails, 'message'>
  ): AppError {
    return new AppError(ErrorType.NETWORK, message, details);
  }

  /**
   * Create an authentication error
   */
  static authentication(
    message: string,
    details?: Omit<ErrorDetails, 'message'>
  ): AppError {
    return new AppError(ErrorType.AUTHENTICATION, message, details);
  }

  /**
   * Create an authorization error
   */
  static authorization(
    message: string,
    details?: Omit<ErrorDetails, 'message'>
  ): AppError {
    return new AppError(ErrorType.AUTHORIZATION, message, details);
  }

  /**
   * Create a validation error
   */
  static validation(
    message: string,
    details?: Omit<ErrorDetails, 'message'>
  ): AppError {
    return new AppError(ErrorType.VALIDATION, message, details);
  }

  /**
   * Create a not found error
   */
  static notFound(
    message: string,
    details?: Omit<ErrorDetails, 'message'>
  ): AppError {
    return new AppError(ErrorType.NOT_FOUND, message, details);
  }

  /**
   * Create a data sync error
   */
  static dataSync(
    message: string,
    details?: Omit<ErrorDetails, 'message'>
  ): AppError {
    return new AppError(ErrorType.DATA_SYNC, message, details);
  }

  /**
   * Create a database error
   */
  static database(
    message: string,
    details?: Omit<ErrorDetails, 'message'>
  ): AppError {
    return new AppError(ErrorType.DATABASE, message, details);
  }

  /**
   * Create an unknown error
   */
  static unknown(
    message = 'An unexpected error occurred',
    originalError?: any
  ): AppError {
    return new AppError(
      ErrorType.UNKNOWN,
      message,
      {
        originalError,
        code: originalError?.code || 'UNKNOWN_ERROR',
      },
      false
    );
  }

  /**
   * Convert any error to an AppError
   */
  static from(error: any): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // Handle database errors from Supabase
    if (error?.code && error?.message && error?.code.startsWith('PGRST')) {
      return AppError.database(error.message, {
        code: error.code,
        originalError: error,
      });
    }

    // Handle network errors
    if (error?.name === 'NetworkError' || error?.message?.includes('network')) {
      return AppError.network('Network connection error', {
        originalError: error,
      });
    }

    // Handle authentication errors
    if (error?.message?.includes('auth') || error?.message?.includes('login')) {
      return AppError.authentication('Authentication error', {
        originalError: error,
      });
    }

    // Default to unknown error
    return AppError.unknown(
      error?.message || 'An unknown error occurred',
      error
    );
  }

  /**
   * Mark the error as handled (for metrics/tracking)
   */
  markAsHandled(): AppError {
    // We don't modify the original instance for immutability
    const handledError = new AppError(
      this.type,
      this.message,
      {
        ...this.details,
        code: this.details.code,
        field: this.details.field,
        originalError: this.details.originalError,
      },
      this.isOperational
    );

    Object.defineProperty(handledError, 'isHandled', {
      value: true,
      writable: false,
    });

    return handledError;
  }

  /**
   * Get a user-friendly message for the error
   */
  getUserMessage(): string {
    switch (this.type) {
      case ErrorType.NETWORK:
        return 'Connection issue detected. Please check your internet connection and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Authentication error. Please sign in again.';
      case ErrorType.AUTHORIZATION:
        return "You don't have permission to perform this action.";
      case ErrorType.VALIDATION:
        return this.details.field
          ? `Invalid input: ${this.details.field}`
          : 'Invalid input. Please check your data and try again.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.DATA_SYNC:
        return 'Could not sync your changes. They will be saved locally and synced when connection is restored.';
      case ErrorType.DATABASE:
        return 'Database operation failed. Please try again later.';
      default:
        return 'Something went wrong. Please try again later.';
    }
  }
}

/**
 * Global error handler for consistent application-wide error handling
 */
export class ErrorHandler {
  private static handlers: Array<(error: AppError) => void> = [];

  /**
   * Register a new error handler
   */
  static registerHandler(handler: (error: AppError) => void): void {
    ErrorHandler.handlers.push(handler);
  }

  /**
   * Handle an error through all registered handlers
   */
  static handleError(error: any): AppError {
    const appError = AppError.from(error);

    // Log the error
    console.error(
      `[${appError.type}] ${appError.message}`,
      appError.details.originalError || ''
    );

    // Run all handlers
    ErrorHandler.handlers.forEach((handler) => {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    });

    return appError.markAsHandled();
  }
}
