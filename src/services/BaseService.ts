import { IService } from './interfaces/IService';

/**
 * Standardized error type for services
 */
export interface ServiceError {
  code: string;
  message: string;
  detail?: string;
  originalError?: any;
}

/**
 * Base events that all services should support
 */
export interface BaseServiceEvents {
  'error': ServiceError;
  'ready': void;
}

/**
 * Standardized response type for service operations
 */
export interface ServiceResponse<T> {
  data?: T;
  error?: ServiceError;
  success: boolean;
}

/**
 * Base service class that implements IService interface
 * Provides standard event handling and error processing
 */
export abstract class BaseService<TEvents extends Record<string, any>> implements IService<TEvents & BaseServiceEvents> {
  private eventCallbacks: Map<string, Set<Function>> = new Map();
  protected ready = false;

  /**
   * Subscribe to service events
   */
  public on<K extends keyof (TEvents & BaseServiceEvents)>(
    event: K, 
    callback: (data: (TEvents & BaseServiceEvents)[K]) => void
  ): () => void {
    if (!this.eventCallbacks.has(event as string)) {
      this.eventCallbacks.set(event as string, new Set());
    }
    
    this.eventCallbacks.get(event as string)?.add(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from service events
   */
  public off<K extends keyof (TEvents & BaseServiceEvents)>(
    event: K, 
    callback: (data: (TEvents & BaseServiceEvents)[K]) => void
  ): void {
    this.eventCallbacks.get(event as string)?.delete(callback);
  }

  /**
   * Emit an event with data
   */
  public emit<K extends keyof (TEvents & BaseServiceEvents)>(
    event: K, 
    data?: (TEvents & BaseServiceEvents)[K]
  ): void {
    const callbacks = this.eventCallbacks.get(event as string);
    if (!callbacks) return;
    
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
      }
    }
  }

  /**
   * Process an error into a standardized ServiceError
   */
  protected processError(error: any, defaultCode = 'service_error'): ServiceError {
    // Handle Supabase errors
    if (error?.code && error?.message) {
      return {
        code: error.code,
        message: error.message,
        detail: error.details || error.hint || undefined,
        originalError: error
      };
    }
    
    // Handle generic errors
    return {
      code: defaultCode,
      message: error?.message || 'An unexpected error occurred',
      originalError: error
    };
  }

  /**
   * Create a successful response
   */
  protected createSuccessResponse<T>(data: T): ServiceResponse<T> {
    return {
      data,
      success: true
    };
  }

  /**
   * Create an error response and emit the error event
   */
  protected createErrorResponse<T>(error: any, code?: string): ServiceResponse<T> {
    const processedError = this.processError(error, code);
    
    // Emit the error event 
    this.emit('error', processedError);
    
    return {
      error: processedError,
      success: false
    };
  }

  /**
   * Mark the service as ready and emit the ready event
   */
  protected markReady(): void {
    this.ready = true;
    this.emit('ready');
  }

  /**
   * Check if the service is ready
   */
  public isReady(): boolean {
    return this.ready;
  }
}