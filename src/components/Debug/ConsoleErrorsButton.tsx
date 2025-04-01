import { useState, useEffect } from 'react';
import { useError } from '../../contexts/ErrorContext';

interface ConsoleErrorsButtonProps {
  className?: string;
}

export function ConsoleErrorsButton({ className }: ConsoleErrorsButtonProps) {
  const { errors, clearAllErrors } = useError();
  const [consoleErrors, setConsoleErrors] = useState<Error[]>([]);
  
  // Track console errors using a custom error handler
  useEffect(() => {
    const originalConsoleError = console.error;
    const capturedErrors: Error[] = [];
    
    // Override console.error to capture errors
    console.error = (...args: any[]) => {
      // Call the original console.error
      originalConsoleError(...args);
      
      // Create an error object from the arguments
      const errorObj = args[0] instanceof Error 
        ? args[0] 
        : new Error(typeof args[0] === 'string' ? args[0] : JSON.stringify(args[0]));
      
      // Add to our captured errors
      capturedErrors.push(errorObj);
      setConsoleErrors([...capturedErrors]);
    };
    
    // Restore original console.error on cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  // Count of all errors (from context and console)
  const totalErrorCount = errors.length + consoleErrors.length;
  
  // Handle clearing all errors
  const handleClearErrors = () => {
    // Clear errors in the error context
    clearAllErrors();
    
    // Clear locally tracked console errors
    setConsoleErrors([]);
    
    // Optionally clear browser console too (in development)
    if (process.env.NODE_ENV === 'development') {
      console.clear();
    }
  };
  
  return (
    <div className="flex space-x-2">
      <button
        className={`px-3 py-1.5 flex items-center gap-1 text-xs font-medium rounded 
          ${totalErrorCount > 0 
            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-500'
          } transition-colors ${className}`}
        onClick={handleClearErrors}
        disabled={totalErrorCount === 0}
      >
        <span>Send console errors ({totalErrorCount})</span>
      </button>
      
      {totalErrorCount > 0 && (
        <button
          className="px-3 py-1.5 flex items-center gap-1 text-xs font-medium rounded
            bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
          onClick={handleClearErrors}
          title="Clear all captured errors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
