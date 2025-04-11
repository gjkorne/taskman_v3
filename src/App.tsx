import React, { useRef, useEffect, useState } from 'react';
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
import HomePage from './pages/HomePage';
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
import { OfflineIndicator } from './components/UI/OfflineIndicator';
import { AppInitializer } from './services/AppInitializer';
import { AppError } from './utils/errorHandling';
import { QueryProvider } from './contexts/query/QueryProvider';
import { AdminProvider } from './contexts/AdminContext';

// Import debug tools in development mode
if (process.env.NODE_ENV === 'development') {
  import('./utils/debugTools');
}

// Import the new providers
import { SettingsDataProvider } from './contexts/settings/SettingsDataContext';
import { SettingsUIProvider } from './contexts/settings/SettingsUIContext';

// Setup global event listeners for app-wide events
// This allows components to communicate without direct props
export const createTaskEvent = new Event('taskman:task_created');
export const timerStateChangeEvent = new Event('taskman:timer_state_changed');

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

// Main App
function App() {
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

    // Setup global event listeners for task refresh
    const handleTaskCreated = () => {
      console.log('Task created event received');
      // If taskListRef is available, refresh it
      if (taskListRef.current) {
        taskListRef.current.refreshTaskList();
      }
    };

    const handleTimerStateChange = () => {
      console.log('Timer state changed event received');
      // If taskListRef is available, refresh it
      if (taskListRef.current) {
        taskListRef.current.refreshTaskList();
      }
    };

    // Add event listeners
    window.addEventListener('taskman:task_created', handleTaskCreated);
    window.addEventListener('taskman:timer_state_changed', handleTimerStateChange);

    // Clean up event listeners
    return () => {
      window.removeEventListener('taskman:task_created', handleTaskCreated);
      window.removeEventListener('taskman:timer_state_changed', handleTimerStateChange);
    };
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

  return (
    <NetworkStatusProvider>
      <QueryProvider>
        <LoadingProvider>
          <ToastProvider>
            <ErrorProvider>
              <AuthProvider>
                <BrowserRouter>
                  <SettingsProvider>
                    <SettingsDataProvider>
                      <SettingsUIProvider>
                        <CategoryProvider>
                          <TaskProvider>
                            <TimeSessionProvider>
                              <AdminProvider>
                                <OfflineIndicator />
                                <Routes>
                                  {/* Auth routes */}
                                  <Route path="/login" element={<LoginForm />} />
                                  <Route path="/register" element={<RegisterForm />} />
                                  
                                  {/* Protected routes */}
                                  <Route 
                                    path="/" 
                                    element={
                                      <ProtectedRoute>
                                        <Layout>
                                          <HomePage />
                                        </Layout>
                                      </ProtectedRoute>
                                    } 
                                  />
                                  
                                  <Route 
                                    path="/tasks" 
                                    element={
                                      <ProtectedRoute>
                                        <Layout>
                                          <TaskList ref={taskListRef} />
                                        </Layout>
                                      </ProtectedRoute>
                                    } 
                                  />
                                  
                                  <Route 
                                    path="/timer" 
                                    element={
                                      <ProtectedRoute>
                                        <Layout>
                                          <Timer />
                                        </Layout>
                                      </ProtectedRoute>
                                    } 
                                  />
                                  
                                  <Route 
                                    path="/reports" 
                                    element={
                                      <ProtectedRoute>
                                        <Layout>
                                          <ReportsPage />
                                        </Layout>
                                      </ProtectedRoute>
                                    } 
                                  />
                                  
                                  <Route 
                                    path="/settings" 
                                    element={
                                      <ProtectedRoute>
                                        <Layout>
                                          <SettingsPage />
                                        </Layout>
                                      </ProtectedRoute>
                                    } 
                                  />
                                  
                                  <Route 
                                    path="/admin" 
                                    element={
                                      <ProtectedRoute>
                                        <Layout>
                                          <AdminPage />
                                        </Layout>
                                      </ProtectedRoute>
                                    } 
                                  />
                                  
                                  <Route 
                                    path="/time-sessions" 
                                    element={
                                      <ProtectedRoute>
                                        <Layout>
                                          <TimeSessionsPage />
                                        </Layout>
                                      </ProtectedRoute>
                                    } 
                                  />
                                  
                                  <Route 
                                    path="/calendar" 
                                    element={
                                      <ProtectedRoute>
                                        <Layout>
                                          <CalendarPage />
                                        </Layout>
                                      </ProtectedRoute>
                                    } 
                                  />
                                  
                                  {/* Task details page */}
                                  <Route 
                                    path="/tasks/:taskId" 
                                    element={
                                      <ProtectedRoute>
                                        <TaskDetailsPage />
                                      </ProtectedRoute>
                                    } 
                                  />
                                  
                                  {/* Redirect for legacy URLs */}
                                  <Route 
                                    path="/app/task/:taskId" 
                                    element={<Navigate to="/tasks/:taskId" replace />} 
                                  />
                                  
                                  {/* Fallback route - redirect to home */}
                                  <Route path="*" element={<Navigate to="/" replace />} />
                                </Routes>
                              </AdminProvider>
                            </TimeSessionProvider>
                          </TaskProvider>
                        </CategoryProvider>
                      </SettingsUIProvider>
                    </SettingsDataProvider>
                  </SettingsProvider>
                </BrowserRouter>
              </AuthProvider>
            </ErrorProvider>
          </ToastProvider>
        </LoadingProvider>
      </QueryProvider>
    </NetworkStatusProvider>
  );
}

export default App;