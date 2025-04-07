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
 * ServiceError class that can be instantiated (to fix 'used as a value' errors)
 */
export class ServiceErrorImpl implements ServiceError {
  code: string;
  message: string;
  detail?: string;
  originalError?: any;

  constructor(code: string, message: string, detail?: string | any, originalError?: any) {
    this.code = code;
    this.message = message;
    
    // Handle object as third parameter (for backward compatibility)
    if (detail && typeof detail === 'object') {
      this.detail = detail.detail || undefined;
      this.originalError = detail.originalError || originalError;
    } else {
      this.detail = detail;
      this.originalError = originalError;
    }
  }
}

/**
 * Create a standardized service error from any error type
 */
export function createServiceError(
  error: any, 
  defaultCode = 'service_error'
): ServiceError {
  // If it's already a ServiceError, return it
  if (error && 'code' in error && 'message' in error) {
    return error as ServiceError;
  }
  
  // If it's a regular Error object
  if (error instanceof Error) {
    return new ServiceErrorImpl(
      defaultCode,
      error.message,
      undefined,
      error
    );
  }
  
  // If it's a string
  if (typeof error === 'string') {
    return new ServiceErrorImpl(
      defaultCode,
      error
    );
  }
  
  // Default case - unknown error
  return new ServiceErrorImpl(
    defaultCode,
    'An unknown error occurred',
    undefined,
    error
  );
}
