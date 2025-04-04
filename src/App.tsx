import React, { useRef, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthProvider';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Layout } from './components/Layout';
import { TaskList, TaskListRefType } from './components/TaskList';
import { Timer } from './components/Timer';
import { ReportsPage } from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import { TaskDetailsPage } from './pages/TaskDetailsPage';
import { TimeSessionsPage } from './pages/TimeSessionsPage';
import { CalendarPage } from './components/Calendar/CalendarPage';
import { useAuth } from './lib/auth';
import { TimeSessionProvider } from './contexts/timeSession';
import { SettingsProvider } from './contexts/SettingsContext';
import { TaskProvider } from './contexts/task';
import { ToastProvider } from './components/Toast';
import { CategoryProvider } from './contexts/category';
import { ErrorProvider } from './contexts/ErrorContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { NetworkStatusProvider } from './contexts/NetworkStatusContext';
import { LoadingIndicator } from './components/UI/LoadingIndicator';
import { AppInitializer } from './services/AppInitializer';
import { AppError } from './utils/errorHandling';

// Import debug tools in development mode
if (process.env.NODE_ENV === 'development') {
  import('./utils/debugTools');
}

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingIndicator size="lg" variant="primary" text="Loading authentication..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  const [activeView, setActiveView] = React.useState<'tasks' | 'timer' | 'reports' | 'settings' | 'admin' | 'time-sessions' | 'calendar'>('tasks');
  const taskListRef = useRef<TaskListRefType>(null);
  const [appInitialized, setAppInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize the application
  useEffect(() => {
    const initApp = async () => {
      try {
        await AppInitializer.initialize();
        setAppInitialized(true);
        console.log('Application initialization complete');
      } catch (error) {
        const appError = AppError.from(error);
        console.error('Failed to initialize application:', appError);
        setInitError(appError.getUserMessage());
      }
    };

    initApp();
  }, []);

  // If app is still initializing, show loading screen
  if (!appInitialized && !initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingIndicator size="lg" variant="primary" />
          <div className="mt-4 text-gray-600">Initializing TaskMan...</div>
        </div>
      </div>
    );
  }

  // If there was an initialization error, show error screen
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Initialization Error</h1>
          <p className="text-gray-700 mb-6">{initError}</p>
          <p className="text-gray-500 text-sm">
            Please refresh the page or contact support if the problem persists.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Handler for when a task is created through the global button
  const handleTaskCreated = () => {
    // Only refresh if we're on the tasks view and the ref is available
    if (activeView === 'tasks' && taskListRef.current) {
      // Refresh the task list using the exposed method
      taskListRef.current.refreshTaskList();
      
      // Additional handling if needed
      console.log('Task created successfully!');
    }
  };
  
  // Force task list refresh when timer state changes
  const handleTimerStateChange = () => {
    if (taskListRef.current) {
      console.log('Timer state changed, refreshing tasks');
      taskListRef.current.refreshTaskList();
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <LoadingProvider>
            <ErrorProvider>
              <NetworkStatusProvider>
                <SettingsProvider>
                  <TimeSessionProvider>
                    <TaskProvider>
                      <CategoryProvider>
                        <BrowserRouter>
                          <Routes>
                            <Route path="/login" element={<LoginForm />} />
                            <Route path="/register" element={<RegisterForm />} />
                            <Route
                              path="/"
                              element={
                                <ProtectedRoute>
                                  <Layout 
                                    activeView={activeView} 
                                    onViewChange={setActiveView}
                                    onTaskCreated={handleTaskCreated}
                                    onTimerStateChange={handleTimerStateChange}
                                  >
                                    {activeView === 'tasks' && (
                                      <TaskList 
                                        ref={taskListRef} 
                                      />
                                    )}
                                    {activeView === 'timer' && <Timer />}
                                    {activeView === 'reports' && <ReportsPage />}
                                    {activeView === 'settings' && <SettingsPage />}
                                    {activeView === 'admin' && <AdminPage />}
                                    {activeView === 'time-sessions' && <TimeSessionsPage />}
                                    {activeView === 'calendar' && <CalendarPage />}
                                  </Layout>
                                </ProtectedRoute>
                              }
                            />
                            <Route 
                              path="/tasks/:taskId" 
                              element={
                                <ProtectedRoute>
                                  <TaskDetailsPage />
                                </ProtectedRoute>
                              } 
                            />
                          </Routes>
                        </BrowserRouter>
                      </CategoryProvider>
                    </TaskProvider>
                  </TimeSessionProvider>
                </SettingsProvider>
              </NetworkStatusProvider>
            </ErrorProvider>
          </LoadingProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;