import { 
  AppError, 
  ErrorSeverity,
  BaseAppError,
  ErrorCode,
  ErrorSource
} from '../error/ErrorTypes';
import { IErrorService } from '../interfaces/IErrorService';

/**
 * Mock implementation of the ErrorService for testing
 * This allows tests to control error behavior and verify error handling
 */
export class MockErrorService implements IErrorService {
  // Store errors for inspection in tests
  errors: AppError[] = [];
  
  // Track method calls for assertions
  methodCalls: Record<string, any[]> = {
    logError: [],
    getErrors: [],
    getLastError: [],
    clearErrors: [],
    onError: [],
    handleError: [],
    createAppError: [],
    reportError: []
  };
  
  // Store listeners for simulating error events
  private errorListeners: Array<{
    callback: (error: AppError) => void;
    filter?: {
      severity?: ErrorSeverity | ErrorSeverity[];
      source?: string | string[];
      code?: string | string[];
    };
  }> = [];
  
  // Store mock return values for various methods
  mockReturnValues: Record<string, any> = {};
  
  // Mock implementation for logError
  logError(error: AppError, shouldNotify: boolean = false): void {
    this.methodCalls.logError.push({ error, shouldNotify });
    this.errors.unshift(error);
    
    // Notify listeners
    this.notifyListeners(error);
  }
  
  // Mock implementation for getErrors
  getErrors(options?: {
    severity?: ErrorSeverity | ErrorSeverity[];
    source?: string | string[];
    code?: string | string[];
    limit?: number;
    offset?: number;
  }): AppError[] {
    this.methodCalls.getErrors.push({ options });
    
    if (this.mockReturnValues.getErrors) {
      return this.mockReturnValues.getErrors;
    }
    
    if (!options) {
      return [...this.errors];
    }
    
    return this.errors.filter(error => this.errorMatchesFilter(error, options));
  }
  
  // Mock implementation for getLastError
  getLastError(): AppError | null {
    this.methodCalls.getLastError.push({});
    
    if (this.mockReturnValues.getLastError !== undefined) {
      return this.mockReturnValues.getLastError;
    }
    
    return this.errors.length > 0 ? this.errors[0] : null;
  }
  
  // Mock implementation for clearErrors
  clearErrors(options?: {
    severity?: ErrorSeverity | ErrorSeverity[];
    source?: string | string[];
    code?: string | string[];
  }): void {
    this.methodCalls.clearErrors.push({ options });
    
    if (!options) {
      this.errors = [];
      return;
    }
    
    this.errors = this.errors.filter(error => !this.errorMatchesFilter(error, options));
  }
  
  // Mock implementation for onError
  onError(
    callback: (error: AppError) => void, 
    filter?: {
      severity?: ErrorSeverity | ErrorSeverity[];
      source?: string | string[];
      code?: string | string[];
    }
  ): () => void {
    this.methodCalls.onError.push({ callback, filter });
    
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
  
  // Mock implementation for handleError
  handleError(error: AppError, options?: {
    silent?: boolean;
    rethrow?: boolean;
    context?: any;
  }): void {
    this.methodCalls.handleError.push({ error, options });
    
    // Add context if provided
    if (options?.context) {
      error.context = {
        ...(error.context || {}),
        ...options.context
      };
    }
    
    // Log the error
    this.logError(error, !options?.silent);
    
    // Rethrow if requested and not mocked
    if (options?.rethrow && !this.mockReturnValues.handleError) {
      throw error;
    }
  }
  
  // Mock implementation for createAppError
  createAppError(error: unknown, defaultOptions?: {
    code?: string;
    severity?: ErrorSeverity;
    source?: string;
    message?: string;
    userMessage?: string;
  }): AppError {
    this.methodCalls.createAppError.push({ error, defaultOptions });
    
    if (this.mockReturnValues.createAppError) {
      return this.mockReturnValues.createAppError;
    }
    
    // If it's already an AppError, return it
    if (this.isAppError(error)) {
      return error;
    }
    
    // Create a simple AppError
    return new BaseAppError({
      message: error instanceof Error ? error.message : String(error),
      code: (defaultOptions?.code as ErrorCode) || ErrorCode.ERR_UNKNOWN,
      severity: defaultOptions?.severity || ErrorSeverity.ERROR,
      source: (defaultOptions?.source as ErrorSource) || ErrorSource.UNKNOWN,
      userMessage: defaultOptions?.userMessage
    });
  }
  
  // Mock implementation for reportError
  async reportError(error: AppError): Promise<void> {
    this.methodCalls.reportError.push({ error });
    
    if (this.mockReturnValues.reportError instanceof Error) {
      return Promise.reject(this.mockReturnValues.reportError);
    }
    
    return Promise.resolve();
  }
  
  /**
   * Helper method to simulate an error occurring in the application
   * Useful for testing error handling flows
   */
  simulateError(error: AppError): void {
    this.logError(error, true);
  }
  
  /**
   * Reset all tracked method calls and stored errors
   * Useful between tests
   */
  reset(): void {
    this.errors = [];
    Object.keys(this.methodCalls).forEach(method => {
      this.methodCalls[method] = [];
    });
    this.mockReturnValues = {};
  }
  
  /**
   * Configure mock return values for methods
   */
  mockMethod(methodName: string, returnValue: any): void {
    this.mockReturnValues[methodName] = returnValue;
  }
  
  /**
   * Helper to check if an error matches filters
   */
  private errorMatchesFilter(
    error: AppError, 
    filter: {
      severity?: ErrorSeverity | ErrorSeverity[];
      source?: string | string[];
      code?: string | string[];
    }
  ): boolean {
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
   * Notify registered error listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      if (!listener.filter || this.errorMatchesFilter(error, listener.filter)) {
        try {
          listener.callback(error);
        } catch (listenerError) {
          // Don't let listener errors cause issues in tests
          console.error('Error in mock error listener:', listenerError);
        }
      }
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
}
