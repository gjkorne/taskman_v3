import React, { ErrorInfo, ReactNode, Suspense, useEffect, useState } from 'react';
import { UnifiedCategoryProvider } from '../contexts/CategoryUnified';

// Lazy load the actual Settings page
const SettingsPageLazy = React.lazy(() => import('./SettingsPage'));

/**
 * Error Boundary for catching errors within settings page
 */
class SettingsErrorBoundary extends React.Component<
  { children: ReactNode, onError: (error: Error, info: ErrorInfo) => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode, onError: (error: Error, info: ErrorInfo) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Settings page error:', error, info);
    this.props.onError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="mb-4">
            We're having trouble loading the settings page. This could be due to an issue with application state or data.
          </p>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * SettingsPageWrapper
 * 
 * A wrapper component that ensures all required providers are available
 * for the Settings page, regardless of what might be in the parent tree.
 * This helps isolate the Settings page from context-related issues.
 */
export function SettingsPageWrapper() {
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

  // Handle error from error boundary
  const handleError = (error: Error, info: ErrorInfo) => {
    setError(error);
    setErrorInfo(info);
  };

  // Log detailed error information
  useEffect(() => {
    if (error) {
      console.error('Settings page error details:', { 
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack 
      });
    }
  }, [error, errorInfo]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <UnifiedCategoryProvider>
        <SettingsErrorBoundary onError={handleError}>
          <Suspense fallback={
            <div className="p-8 flex justify-center">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          }>
            <SettingsPageLazy />
          </Suspense>
        </SettingsErrorBoundary>
      </UnifiedCategoryProvider>
    </div>
  );
}

export default SettingsPageWrapper;
