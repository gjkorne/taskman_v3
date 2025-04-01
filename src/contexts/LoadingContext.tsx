import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  isLoading: (key: string) => boolean;
  anyLoading: () => boolean;
  setLoading: (key: string, isLoading: boolean) => void;
  withLoading: <T>(key: string, promise: Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({});
  
  // Check if a specific key is in loading state
  const isLoading = useCallback((key: string) => {
    return Boolean(loadingState[key]);
  }, [loadingState]);
  
  // Check if any loading state is true
  const anyLoading = useCallback(() => {
    return Object.values(loadingState).some(value => value === true);
  }, [loadingState]);
  
  // Set loading state for a specific key
  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);
  
  // Utility to automatically handle loading state for promises
  const withLoading = useCallback(async <T,>(key: string, promise: Promise<T>): Promise<T> => {
    try {
      setLoading(key, true);
      const result = await promise;
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);
  
  return (
    <LoadingContext.Provider value={{
      isLoading,
      anyLoading,
      setLoading,
      withLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

// Custom hook to use the loading context
export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
