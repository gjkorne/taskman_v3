import { AppError, ErrorSeverity } from '../error/ErrorTypes';

/**
 * Interface for the Error Service
 * Provides a standardized way to handle errors across the application
 */
export interface IErrorService {
  /**
   * Log an error to the error store and optionally to external services
   * @param error The error to log
   * @param shouldNotify Whether to notify the user (defaults to true for ERROR and CRITICAL severity)
   */
  logError(error: AppError, shouldNotify?: boolean): void;
  
  /**
   * Get all errors filtered by optional criteria
   * @param options Filter options for retrieving errors
   */
  getErrors(options?: {
    severity?: ErrorSeverity | ErrorSeverity[];
    source?: string | string[];
    code?: string | string[];
    limit?: number;
    offset?: number;
  }): AppError[];
  
  /**
   * Get the most recent error
   */
  getLastError(): AppError | null;
  
  /**
   * Clear all errors or filtered subset
   * @param options Filter options for clearing errors
   */
  clearErrors(options?: {
    severity?: ErrorSeverity | ErrorSeverity[];
    source?: string | string[];
    code?: string | string[];
  }): void;
  
  /**
   * Register a callback to be notified when errors occur
   * @param callback Function to call when an error is logged
   * @param filter Optional filter to only receive specific errors
   * @returns Unsubscribe function
   */
  onError(callback: (error: AppError) => void, filter?: {
    severity?: ErrorSeverity | ErrorSeverity[];
    source?: string | string[];
    code?: string | string[];
  }): () => void;
  
  /**
   * Handle an error with appropriate actions
   * This method will:
   * 1. Log the error
   * 2. Notify user if needed
   * 3. Report to monitoring services if configured
   * 4. Attempt recovery if possible
   * 
   * @param error The error to handle
   * @param options Additional options for handling
   */
  handleError(error: AppError, options?: {
    silent?: boolean;    // Don't show UI notifications
    rethrow?: boolean;   // Rethrow the error after handling
    context?: any;       // Additional context
  }): void;
  
  /**
   * Create an AppError from a regular Error or unknown error object
   * @param error The error to convert
   * @param defaultOptions Default options to use if not detected from the error
   */
  createAppError(error: unknown, defaultOptions?: {
    code?: string;
    severity?: ErrorSeverity;
    source?: string;
    message?: string;
    userMessage?: string;
  }): AppError;
  
  /**
   * Report error to external monitoring services (like Sentry, LogRocket, etc.)
   * @param error The error to report
   */
  reportError(error: AppError): Promise<void>;
}
