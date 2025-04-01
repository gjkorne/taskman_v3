import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Toast item interface
export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Forward declaration of Toast component props
export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

// Toast component imported directly
const Toast = ({ message, type = 'info', onClose }: ToastProps) => {
  // Get styling based on toast type
  let bgColor;
  let textColor;
  
  switch (type) {
    case 'success':
      bgColor = 'bg-green-50 border-green-200';
      textColor = 'text-green-800';
      break;
    case 'error':
      bgColor = 'bg-red-50 border-red-200';
      textColor = 'text-red-800';
      break;
    case 'warning':
      bgColor = 'bg-amber-50 border-amber-200';
      textColor = 'text-amber-800';
      break;
    case 'info':
    default:
      bgColor = 'bg-blue-50 border-blue-200';
      textColor = 'text-blue-800';
      break;
  }
  
  return (
    <div className={`flex items-center p-3 rounded-lg shadow-md min-w-[300px] max-w-md animate-slide-up border ${bgColor}`}>
      <div className={`flex-grow text-sm ${textColor}`}>
        {message}
      </div>
      <button 
        onClick={onClose}
        className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Toast context interface
interface ToastContextType {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Create context with default values
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast provider component
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Add a new toast
  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    const newToast: ToastItem = {
      id,
      message,
      type,
      duration
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);
  
  // Remove a toast by ID
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Custom hook to use toast context
export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}
