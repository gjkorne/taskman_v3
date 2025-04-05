/**
 * Standardized error types for TaskMan
 * This provides a consistent approach to error handling across all services
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',         // Informational messages that don't indicate an error
  WARNING = 'warning',   // Potential issues that don't break functionality
  ERROR = 'error',       // Errors that impact functionality but don't crash the app
  CRITICAL = 'critical'  // Serious errors that prevent core functionality
}

/**
 * Error source categories
 */
export enum ErrorSource {
  NETWORK = 'network',         // Network/API errors
  DATABASE = 'database',       // Local storage/database errors
  VALIDATION = 'validation',   // Input validation errors
  AUTHENTICATION = 'auth',     // Authentication/permission errors
  SYNC = 'sync',               // Data synchronization errors
  BUSINESS_LOGIC = 'logic',    // Business logic/rule errors
  UI = 'ui',                   // UI rendering errors
  UNKNOWN = 'unknown'          // Uncategorized errors
}

/**
 * Error codes for specific error scenarios
 * Format: ERR_[SOURCE]_[SPECIFIC_ERROR]
 */
export enum ErrorCode {
  // Network errors
  ERR_NETWORK_OFFLINE = 'ERR_NETWORK_OFFLINE',
  ERR_NETWORK_TIMEOUT = 'ERR_NETWORK_TIMEOUT',
  ERR_NETWORK_SERVER_ERROR = 'ERR_NETWORK_SERVER_ERROR',
  ERR_NETWORK_REQUEST_FAILED = 'ERR_NETWORK_REQUEST_FAILED',
  
  // Database errors
  ERR_DB_CONNECTION = 'ERR_DB_CONNECTION',
  ERR_DB_QUERY_FAILED = 'ERR_DB_QUERY_FAILED',
  ERR_DB_WRITE_FAILED = 'ERR_DB_WRITE_FAILED',
  ERR_DB_READ_FAILED = 'ERR_DB_READ_FAILED',
  
  // Authentication errors
  ERR_AUTH_UNAUTHORIZED = 'ERR_AUTH_UNAUTHORIZED',
  ERR_AUTH_EXPIRED = 'ERR_AUTH_EXPIRED',
  ERR_AUTH_INVALID_CREDENTIALS = 'ERR_AUTH_INVALID_CREDENTIALS',
  
  // Validation errors
  ERR_VALIDATION_REQUIRED = 'ERR_VALIDATION_REQUIRED',
  ERR_VALIDATION_FORMAT = 'ERR_VALIDATION_FORMAT',
  ERR_VALIDATION_CONSTRAINT = 'ERR_VALIDATION_CONSTRAINT',
  
  // Sync errors
  ERR_SYNC_CONFLICT = 'ERR_SYNC_CONFLICT',
  ERR_SYNC_FAILED = 'ERR_SYNC_FAILED',
  
  // Business logic errors
  ERR_LOGIC_INVALID_OPERATION = 'ERR_LOGIC_INVALID_OPERATION',
  ERR_LOGIC_DEPENDENCY = 'ERR_LOGIC_DEPENDENCY',
  
  // Generic errors
  ERR_UNKNOWN = 'ERR_UNKNOWN',
  ERR_NOT_IMPLEMENTED = 'ERR_NOT_IMPLEMENTED'
}

/**
 * Standard error interface for all application errors
 */
export interface AppError extends Error {
  // Standard Error properties
  name: string;         // Error name (typically the constructor name)
  message: string;      // Human-readable error message
  stack?: string;       // Stack trace
  
  // TaskMan specific error properties
  code: ErrorCode;                  // Error code for programmatic handling
  severity: ErrorSeverity;          // Error severity level
  source: ErrorSource;              // Error source category
  timestamp: string;                // When the error occurred
  context?: Record<string, any>;    // Additional context data
  userMessage?: string;             // User-friendly message that can be displayed in UI
  recoverable: boolean;             // Whether the error can be recovered from
  retryable: boolean;               // Whether the operation can be retried
}

/**
 * Options for creating an AppError
 */
export interface AppErrorOptions {
  message: string;
  code: ErrorCode;
  severity?: ErrorSeverity;
  source?: ErrorSource;
  context?: Record<string, any>;
  userMessage?: string;
  recoverable?: boolean;
  retryable?: boolean;
  cause?: Error;  // Original error that caused this error
}

/**
 * Base class for all application errors
 */
export class BaseAppError extends Error implements AppError {
  code: ErrorCode;
  severity: ErrorSeverity;
  source: ErrorSource;
  timestamp: string;
  context?: Record<string, any>;
  userMessage?: string;
  recoverable: boolean;
  retryable: boolean;
  
  constructor(options: AppErrorOptions) {
    super(options.message);
    
    // Standard Error properties
    this.name = this.constructor.name;
    
    // Default values with overrides from options
    this.code = options.code;
    this.severity = options.severity || ErrorSeverity.ERROR;
    this.source = options.source || ErrorSource.UNKNOWN;
    this.timestamp = new Date().toISOString();
    this.context = options.context;
    this.userMessage = options.userMessage || options.message;
    this.recoverable = options.recoverable !== undefined ? options.recoverable : true;
    this.retryable = options.retryable !== undefined ? options.retryable : false;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // If this error was caused by another error, add its stack
    if (options.cause) {
      this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
    }
  }
  
  /**
   * Get a plain object representation of the error
   * Useful for logging or serializing
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      source: this.source,
      timestamp: this.timestamp,
      context: this.context,
      userMessage: this.userMessage,
      recoverable: this.recoverable,
      retryable: this.retryable,
      stack: this.stack
    };
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends BaseAppError {
  constructor(options: Omit<AppErrorOptions, 'source'>) {
    super({
      ...options,
      source: ErrorSource.NETWORK
    });
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends BaseAppError {
  constructor(options: Omit<AppErrorOptions, 'source'>) {
    super({
      ...options,
      source: ErrorSource.DATABASE
    });
  }
}

/**
 * Authentication/Authorization errors
 */
export class AuthError extends BaseAppError {
  constructor(options: Omit<AppErrorOptions, 'source'>) {
    super({
      ...options,
      source: ErrorSource.AUTHENTICATION
    });
  }
}

/**
 * Validation errors
 */
export class ValidationError extends BaseAppError {
  validationErrors?: Record<string, string[]>;
  
  constructor(options: Omit<AppErrorOptions, 'source'> & { validationErrors?: Record<string, string[]> }) {
    super({
      ...options,
      source: ErrorSource.VALIDATION,
      // Default severity for validation errors is WARNING
      severity: options.severity || ErrorSeverity.WARNING
    });
    
    this.validationErrors = options.validationErrors;
  }
  
  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors
    };
  }
}

/**
 * Sync-related errors
 */
export class SyncError extends BaseAppError {
  constructor(options: Omit<AppErrorOptions, 'source'>) {
    super({
      ...options,
      source: ErrorSource.SYNC
    });
  }
}

/**
 * Business logic errors
 */
export class LogicError extends BaseAppError {
  constructor(options: Omit<AppErrorOptions, 'source'>) {
    super({
      ...options,
      source: ErrorSource.BUSINESS_LOGIC
    });
  }
}

/**
 * UI-related errors
 */
export class UIError extends BaseAppError {
  constructor(options: Omit<AppErrorOptions, 'source'>) {
    super({
      ...options,
      source: ErrorSource.UI
    });
  }
}
