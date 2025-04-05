import { 
  AppError, 
  ErrorSeverity, 
  ErrorSource, 
  ErrorCode, 
  BaseAppError 
} from './ErrorTypes';
import { IErrorService } from '../interfaces/IErrorService';
import { IService } from '../interfaces/IService';

/**
 * Error service events
 */
interface ErrorServiceEvents {
  'error:new': AppError;
  'error:clear': void;
  'error:report': AppError;
}

/**
 * Options for configuring the ErrorService
 */
interface ErrorServiceOptions {
  maxErrorsStored?: number;       // Maximum number of errors to keep in memory
  autoReport?: boolean;           // Whether to automatically report errors to external services
  logToConsole?: boolean;         // Whether to log errors to console
  isDevelopment?: boolean;        // Whether the app is running in development mode
  enableDebugging?: boolean;      // Whether to include additional debug info
}

/**
 * Central service for handling errors throughout the application
 * Implements the error handling strategy for TaskMan
 */
export class ErrorService implements IErrorService, IService<ErrorServiceEvents> {
  private errors: AppError[] = [];
  private errorListeners: Array<{
    callback: (error: AppError) => void;
    filter?: {
      severity?: ErrorSeverity | ErrorSeverity[];
      source?: string | string[];
      code?: string | string[];
    };
  }> = [];
  private options: ErrorServiceOptions;
  
  // Event handlers for IService implementation
  private eventHandlers: Partial<Record<keyof ErrorServiceEvents, Array<(data: any) => void>>> = {};
  
  constructor(options: ErrorServiceOptions = {}) {
    this.options = {
      maxErrorsStored: 100,
      autoReport: false,
      logToConsole: true,
      isDevelopment: process.env.NODE_ENV !== 'production',
      enableDebugging: process.env.NODE_ENV !== 'production',
      ...options
    };
    
    // Set up global error handlers
    if (typeof window !== 'undefined') {
      // Browser environment
      this.setupGlobalErrorHandlers();
    }
  }
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // No async initialization needed
    return Promise.resolve();
  }
  
  /**
   * Set up global error handlers for uncaught errors
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      const error = this.createAppError(event.error || new Error(event.message), {
        severity: ErrorSeverity.CRITICAL,
        code: ErrorCode.ERR_UNKNOWN,
        source: ErrorSource.UNKNOWN,
        message: event.message || 'Uncaught error',
        userMessage: 'An unexpected error occurred'
      });
      
      this.logError(error, true);
      
      // Don't prevent the default error handling
      return false;
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = this.createAppError(event.reason, {
        severity: ErrorSeverity.ERROR,
        code: ErrorCode.ERR_UNKNOWN,
        source: ErrorSource.UNKNOWN,
        message: 'Unhandled promise rejection',
        userMessage: 'An operation failed to complete'
      });
      
      this.logError(error, true);
    });
  }
  
  /**
   * Log an error to the error store and optionally to external services
   */
  logError(error: AppError, shouldNotify: boolean = this.shouldNotifyByDefault(error)): void {
    // Add error to the error store
    this.errors.unshift(error);
    
    // Emit the new error event
    this.emit('error:new', error);
    
    // Trim the error store if it exceeds the maximum size
    if (this.errors.length > this.options.maxErrorsStored!) {
      this.errors = this.errors.slice(0, this.options.maxErrorsStored);
    }
    
    // Log to console in development
    if (this.options.logToConsole) {
      this.logToConsole(error);
    }
    
    // Automatically report severe errors if configured
    if (this.options.autoReport && (
      error.severity === ErrorSeverity.ERROR || 
      error.severity === ErrorSeverity.CRITICAL
    )) {
      this.reportError(error).catch(console.error);
    }
    
    // Notify listeners
    this.notifyListeners(error);
    
    // Notify UI if required
    if (shouldNotify) {
      this.notifyUser(error);
    }
  }
  
  /**
   * Determine if an error should trigger a user notification by default
   * based on its severity
   */
  private shouldNotifyByDefault(error: AppError): boolean {
    return (
      error.severity === ErrorSeverity.ERROR || 
      error.severity === ErrorSeverity.CRITICAL
    );
  }
  
  /**
   * Log an error to the console with appropriate formatting
   */
  private logToConsole(error: AppError): void {
    const consoleMethod = this.getConsoleMethodForSeverity(error.severity);
    
    // Format for better readability
    const formattedError = {
      message: error.message,
      code: error.code,
      severity: error.severity,
      source: error.source,
      context: error.context || {},
      timestamp: error.timestamp
    };
    
    consoleMethod(
      `[${error.severity.toUpperCase()}] ${error.code}: ${error.message}`, 
      formattedError
    );
    
    // Log stack trace for higher severity errors
    if (
      error.severity === ErrorSeverity.ERROR || 
      error.severity === ErrorSeverity.CRITICAL
    ) {
      console.error(error.stack);
    }
  }
  
  /**
   * Get the appropriate console method based on error severity
   */
  private getConsoleMethodForSeverity(severity: ErrorSeverity): Function {
    switch (severity) {
      case ErrorSeverity.INFO:
        return console.info;
      case ErrorSeverity.WARNING:
        return console.warn;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }
  
  /**
   * Notify user about the error through UI
   */
  private notifyUser(error: AppError): void {
    // Implementation would depend on the UI notification system
    // This would typically dispatch to a notification context or service
    
    // For now, just log that we would notify the user
    if (this.options.isDevelopment) {
      console.log(`[Notification] ${error.userMessage || error.message}`);
    }
    
    // In a full implementation, this would dispatch to a notification service:
    // Example:
    // this.serviceRegistry.getService<INotificationService>('NotificationService')
    //   .showNotification({
    //     type: this.getNotificationTypeForSeverity(error.severity),
    //     message: error.userMessage || error.message,
    //     duration: this.getNotificationDurationForSeverity(error.severity),
    //     action: error.recoverable ? {
    //       label: 'Retry',
    //       handler: () => { /* retry logic */ }
    //     } : undefined
    //   });
  }
  
  /**
   * Notify registered error listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      if (this.errorMatchesFilter(error, listener.filter)) {
        try {
          listener.callback(error);
        } catch (listenerError) {
          // Don't let listener errors cause issues
          if (this.options.isDevelopment) {
            console.error('Error in error listener:', listenerError);
          }
        }
      }
    });
  }
  
  /**
   * Check if an error matches a filter configuration
   */
  private errorMatchesFilter(
    error: AppError, 
    filter?: {
      severity?: ErrorSeverity | ErrorSeverity[];
      source?: string | string[];
      code?: string | string[];
    }
  ): boolean {
    if (!filter) return true;
    
    // Check severity
    if (filter.severity) {
      const severities = Array.isArray(filter.severity) 
        ? filter.severity 
        : [filter.severity];
      
      if (!severities.includes(error.severity)) {
        return false;
      }
    }
    
    // Check source
    if (filter.source) {
      const sources = Array.isArray(filter.source) 
        ? filter.source 
        : [filter.source];
      
      if (!sources.includes(error.source)) {
        return false;
      }
    }
    
    // Check code
    if (filter.code) {
      const codes = Array.isArray(filter.code) 
        ? filter.code 
        : [filter.code];
      
      if (!codes.includes(error.code)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get all errors filtered by optional criteria
   */
  getErrors(options?: {
    severity?: ErrorSeverity | ErrorSeverity[];
    source?: string | string[];
    code?: string | string[];
    limit?: number;
    offset?: number;
  }): AppError[] {
    if (!options) {
      return [...this.errors];
    }
    
    let result = this.errors.filter(error => {
      return this.errorMatchesFilter(error, {
        severity: options.severity,
        source: options.source,
        code: options.code
      });
    });
    
    // Apply pagination if specified
    if (options.offset !== undefined) {
      result = result.slice(options.offset);
    }
    
    if (options.limit !== undefined) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
  
  /**
   * Get the most recent error
   */
  getLastError(): AppError | null {
    return this.errors.length > 0 ? this.errors[0] : null;
  }
  
  /**
   * Clear all errors or filtered subset
   */
  clearErrors(options?: {
    severity?: ErrorSeverity | ErrorSeverity[];
    source?: string | string[];
    code?: string | string[];
  }): void {
    if (!options) {
      this.errors = [];
      this.emit('error:clear');
      return;
    }
    
    this.errors = this.errors.filter(error => {
      return !this.errorMatchesFilter(error, options);
    });
  }
  
  /**
   * Register a callback to be notified when errors occur
   */
  onError(
    callback: (error: AppError) => void, 
    filter?: {
      severity?: ErrorSeverity | ErrorSeverity[];
      source?: string | string[];
      code?: string | string[];
    }
  ): () => void {
    const listener = { callback, filter };
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index !== -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Handle an error with appropriate actions
   */
  handleError(error: AppError, options?: {
    silent?: boolean;    // Don't show UI notifications
    rethrow?: boolean;   // Rethrow the error after handling
    context?: any;       // Additional context
  }): void {
    // Add additional context if provided
    if (options?.context) {
      error.context = {
        ...error.context,
        ...options.context
      };
    }
    
    // Log the error
    this.logError(error, !options?.silent);
    
    // Rethrow if requested
    if (options?.rethrow) {
      throw error;
    }
  }
  
  /**
   * Create an AppError from a regular Error or unknown error object
   */
  createAppError(error: unknown, defaultOptions?: {
    code?: string;
    severity?: ErrorSeverity;
    source?: string;
    message?: string;
    userMessage?: string;
  }): AppError {
    // If it's already an AppError, return it
    if (this.isAppError(error)) {
      return error;
    }
    
    // Default options
    const options = {
      code: ErrorCode.ERR_UNKNOWN,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN,
      message: 'An unknown error occurred',
      userMessage: 'An unexpected error occurred',
      ...defaultOptions
    };
    
    // If it's a standard Error, extract information
    if (error instanceof Error) {
      return new BaseAppError({
        message: error.message || options.message,
        code: options.code as ErrorCode,
        severity: options.severity,
        source: options.source as ErrorSource,
        userMessage: options.userMessage,
        cause: error
      });
    }
    
    // If it's a string, use it as the message
    if (typeof error === 'string') {
      return new BaseAppError({
        message: error,
        code: options.code as ErrorCode,
        severity: options.severity,
        source: options.source as ErrorSource,
        userMessage: options.userMessage
      });
    }
    
    // For other types, try to convert to string representation
    let errorMessage: string;
    try {
      errorMessage = error !== null && error !== undefined
        ? String(error)
        : options.message;
    } catch {
      errorMessage = options.message;
    }
    
    return new BaseAppError({
      message: errorMessage,
      code: options.code as ErrorCode,
      severity: options.severity,
      source: options.source as ErrorSource,
      userMessage: options.userMessage,
      context: { originalError: error }
    });
  }
  
  /**
   * Check if an object is an AppError
   */
  private isAppError(error: any): error is AppError {
    return (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      'severity' in error &&
      'source' in error &&
      'timestamp' in error
    );
  }
  
  /**
   * Report error to external monitoring services
   */
  async reportError(error: AppError): Promise<void> {
    // This would typically send the error to an error tracking service
    // like Sentry, LogRocket, Application Insights, etc.
    
    // For now, just log that we would report the error
    if (this.options.isDevelopment) {
      console.log(`[Error Reporting] Would report error: ${error.code}`);
    }
    
    // In a full implementation, this would send to a reporting service:
    // Example with Sentry:
    // Sentry.captureException(error, {
    //   level: this.getSentryLevelForSeverity(error.severity),
    //   tags: {
    //     code: error.code,
    //     source: error.source
    //   },
    //   extra: {
    //     ...error.context,
    //     timestamp: error.timestamp,
    //     recoverable: error.recoverable,
    //     retryable: error.retryable
    //   }
    // });
    
    this.emit('error:report', error);
    
    return Promise.resolve();
  }
  
  /**
   * Subscribe to service events
   */
  on<K extends keyof ErrorServiceEvents>(event: K, callback: (data: ErrorServiceEvents[K]) => void): () => void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event]!.push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  /**
   * Unsubscribe from service events
   */
  off<K extends keyof ErrorServiceEvents>(event: K, callback: (data: ErrorServiceEvents[K]) => void): void {
    if (!this.eventHandlers[event]) {
      return;
    }
    
    const index = this.eventHandlers[event]!.indexOf(callback as any);
    if (index !== -1) {
      this.eventHandlers[event]!.splice(index, 1);
    }
  }
  
  /**
   * Emit an event with data
   */
  emit<K extends keyof ErrorServiceEvents>(event: K, data?: ErrorServiceEvents[K]): void {
    if (!this.eventHandlers[event]) {
      return;
    }
    
    for (const handler of this.eventHandlers[event]!) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
      }
    }
  }
}
