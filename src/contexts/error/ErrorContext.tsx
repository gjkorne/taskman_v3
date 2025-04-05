import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppError, ErrorSeverity, ErrorSource, ErrorCode, BaseAppError } from '../../services/error/ErrorTypes';
import { IErrorService } from '../../services/interfaces/IErrorService';
import { ErrorService } from '../../services/error/ErrorService';

// Define the context shape
interface ErrorContextType {
  // Error access methods
  errors: AppError[];
  lastError: AppError | null;
  hasErrors: boolean;
  
  // Error handling methods
  logError: (error: Error | string | AppError, options?: {
    code?: ErrorCode;
    severity?: ErrorSeverity;
    source?: ErrorSource;
    userMessage?: string;
    context?: Record<string, any>;
  }) => void;
  
  clearErrors: () => void;
  clearErrorsByType: (options: {
    severity?: ErrorSeverity | ErrorSeverity[];
    source?: ErrorSource | ErrorSource[];
    code?: ErrorCode | ErrorCode[];
  }) => void;
  
  // Notification state
  isNotificationVisible: boolean;
  dismissNotification: () => void;
}

// Create the context with a default empty implementation
export const ErrorContext = createContext<ErrorContextType>({
  errors: [],
  lastError: null,
  hasErrors: false,
  
  logError: () => {},
  clearErrors: () => {},
  clearErrorsByType: () => {},
  
  isNotificationVisible: false,
  dismissNotification: () => {}
});

// Default notification display time in milliseconds
const DEFAULT_NOTIFICATION_DURATION = 5000;

interface ErrorProviderProps {
  children: ReactNode;
  service?: IErrorService;
  notificationDuration?: number;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ 
  children, 
  service,
  notificationDuration = DEFAULT_NOTIFICATION_DURATION
}) => {
  // Use the provided service or get it from the registry
  const errorService: IErrorService = service || 
    new ErrorService(); // Create a new service if not provided or available in registry
  
  // State for errors
  const [errors, setErrors] = useState<AppError[]>([]);
  const [lastError, setLastError] = useState<AppError | null>(null);
  
  // State for notification visibility
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  // Store current notification timeoutId for cleanup
  const [notificationTimeoutId, setNotificationTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Initialize state from service and set up subscription
  useEffect(() => {
    // Load initial errors
    setErrors(errorService.getErrors());
    setLastError(errorService.getLastError());
    
    // Subscribe to error events
    const unsubscribe = errorService.onError((error) => {
      setErrors(errorService.getErrors());
      setLastError(error);
      
      // Show notification for errors that should notify
      if (error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL) {
        showNotification();
      }
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, [errorService]);
  
  // Helper to show notification with auto-dismiss
  const showNotification = () => {
    // Clear any existing timeout
    if (notificationTimeoutId) {
      clearTimeout(notificationTimeoutId);
    }
    
    // Show the notification
    setIsNotificationVisible(true);
    
    // Set timeout to auto-dismiss
    const timeoutId = setTimeout(() => {
      setIsNotificationVisible(false);
    }, notificationDuration);
    
    setNotificationTimeoutId(timeoutId);
  };
  
  // Dismiss notification manually
  const dismissNotification = () => {
    if (notificationTimeoutId) {
      clearTimeout(notificationTimeoutId);
      setNotificationTimeoutId(null);
    }
    setIsNotificationVisible(false);
  };
  
  // Simplified error logging interface
  const logError = (
    error: Error | string | AppError, 
    options?: {
      code?: ErrorCode;
      severity?: ErrorSeverity;
      source?: ErrorSource;
      userMessage?: string;
      context?: Record<string, any>;
    }
  ) => {
    // If already an AppError, just pass it through
    if (error instanceof BaseAppError) {
      errorService.logError(error);
      return;
    }
    
    // Convert to AppError
    const appError = errorService.createAppError(error, {
      code: options?.code,
      severity: options?.severity,
      source: options?.source,
      userMessage: options?.userMessage
    });
    
    // Add context if provided
    if (options?.context) {
      appError.context = {
        ...(appError.context || {}),
        ...options.context
      };
    }
    
    // Log through the service
    errorService.logError(appError);
  };
  
  // Clear all errors
  const clearErrors = () => {
    errorService.clearErrors();
    setErrors([]);
    setLastError(null);
  };
  
  // Clear errors by type
  const clearErrorsByType = (options: {
    severity?: ErrorSeverity | ErrorSeverity[];
    source?: ErrorSource | ErrorSource[];
    code?: ErrorCode | ErrorCode[];
  }) => {
    errorService.clearErrors(options);
    setErrors(errorService.getErrors());
    setLastError(errorService.getLastError());
  };
  
  // Context value
  const value: ErrorContextType = {
    errors,
    lastError,
    hasErrors: errors.length > 0,
    
    logError,
    clearErrors,
    clearErrorsByType,
    
    isNotificationVisible,
    dismissNotification
  };
  
  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

// Custom hook for using the error context
export const useError = () => {
  const context = useContext(ErrorContext);
  
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  
  return context;
};
