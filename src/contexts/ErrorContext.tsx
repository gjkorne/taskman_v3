import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useToast } from '../components/Toast/ToastContext';

// Define types for our errors
export interface AppError {
  id: string;
  message: string;
  code?: string;
  source?: string;
  timestamp: Date;
  details?: any;
  handled: boolean;
}

interface ErrorContextType {
  errors: AppError[];
  addError: (error: Omit<AppError, 'id' | 'timestamp' | 'handled'>) => void;
  clearError: (id: string) => void;
  clearAllErrors: () => void;
  markErrorAsHandled: (id: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);
  const { addToast } = useToast();
  
  // Add a new error to the errors array
  const addError = useCallback((errorData: Omit<AppError, 'id' | 'timestamp' | 'handled'>) => {
    // Generate a unique ID for the error
    const id = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newError: AppError = {
      ...errorData,
      id,
      timestamp: new Date(),
      handled: false
    };
    
    // Log to console in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[Error Tracker] ${newError.source || 'App'}: ${newError.message}`, 
        newError.details || '');
    }
    
    // Add to state
    setErrors(prevErrors => [...prevErrors, newError]);
    
    // Show toast notification for the error
    addToast(newError.message, 'error', 5000);
    
    return id;
  }, [addToast]);
  
  // Clear a specific error by ID
  const clearError = useCallback((id: string) => {
    setErrors(prevErrors => prevErrors.filter(error => error.id !== id));
  }, []);
  
  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);
  
  // Mark an error as handled
  const markErrorAsHandled = useCallback((id: string) => {
    setErrors(prevErrors => 
      prevErrors.map(error => 
        error.id === id ? { ...error, handled: true } : error
      )
    );
  }, []);
  
  return (
    <ErrorContext.Provider value={{
      errors,
      addError,
      clearError,
      clearAllErrors,
      markErrorAsHandled
    }}>
      {children}
    </ErrorContext.Provider>
  );
}

// Custom hook to use the error context
export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
}
