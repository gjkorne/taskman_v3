import React, { useRef, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthProvider';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { TaskList, TaskListRefType } from './components/TaskList';
import { Timer } from './components/Timer';
import { ReportsPage } from './pages/ReportsPage';
import { TaskDetailsPage } from './pages/TaskDetailsPage';
import { TimeSessionsPage } from './pages/TimeSessionsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CalendarPage } from './components/Calendar/CalendarPage';
import HomePage from './pages/HomePage';
import { useAuth } from './lib/auth';
import { TimeSessionProvider } from './contexts/timeSession';
import { TaskProvider } from './contexts/task';
import { ToastProvider } from './components/Toast';
import { CategoryProvider } from './contexts/category';
import { AdminProvider } from './contexts/AdminContext';
import { Layout } from './components/Layout';
import { LoadingProvider } from './contexts/LoadingContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { QueryProvider } from './contexts/query/QueryProvider';
import { OfflineIndicator } from './components/UI/OfflineIndicator';
import { NetworkStatusProvider } from './contexts/NetworkStatusContext';
import { FilterSortProvider } from './contexts/FilterSortContext';
import { TimerProvider } from './contexts/TimerContext'; // Modified import

// Import settings providers
import { SettingsProvider } from './contexts/SettingsContext'; // Legacy provider for compatibility
import SimpleSettingsPage from './pages/SettingsPage';
import CategoryMappingPage from './pages/CategoryMappingPage';
import AdminPage from './pages/AdminPage';
import Dashboard from './pages/Dashboard';

// Enable debug tools in development
if (import.meta.env.DEV) {
  import('./utils/debugTools');
}

// Setup global event listeners for app-wide events
// This allows components to communicate without direct props
export const createTaskEvent = new Event('taskman:task_created');
export const timerStateChangeEvent = new Event('taskman:timer_state_changed');

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // If still loading auth state, show nothing
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, show the protected content
  return children;
}

// Main App
function App() {
  const taskListRef = useRef<TaskListRefType>(null);
  const [appInitialized, setAppInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize app on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        // App is initialized
        setAppInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError('Failed to initialize the application. Please try again.');
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
    window.addEventListener(
      'taskman:timer_state_changed',
      handleTimerStateChange
    );

    // Clean up event listeners
    return () => {
      window.removeEventListener('taskman:task_created', handleTaskCreated);
      window.removeEventListener(
        'taskman:timer_state_changed',
        handleTimerStateChange
      );
    };
  }, []);

  // If app is still initializing, show loading screen
  if (!appInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mt-4 text-gray-600">Initializing TaskMan...</div>
        </div>
      </div>
    );
  }

  // If there was an error during initialization, show error screen
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 font-medium text-lg">{initError}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
                  {/* Removed separate SettingsData/UI providers (merged into SettingsProvider) */}
                  <SettingsProvider>
                    {' '}
                    {/* merged data & UI providers */}
                    <CategoryProvider>
                      <TaskProvider>
                        <FilterSortProvider>
                          <TimeSessionProvider>
                            <TimerProvider>
                              <TimerProvider> // Modified to use root TimerProvider
                                <AdminProvider>
                                  <OfflineIndicator />
                                  <Routes>
                                    {/* Auth routes */}
                                    <Route path="/login" element={<LoginForm />} />
                                    <Route
                                      path="/register"
                                      element={<RegisterForm />}
                                    />
                                    <Route
                                      path="/dashboard"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <Dashboard />
                                          </Layout>
                                        </ProtectedRoute>
                                      }
                                    />

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
                                      path="/categories"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <CategoriesPage />
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
                                            <SimpleSettingsPage />
                                          </Layout>
                                        </ProtectedRoute>
                                      }
                                    />

                                    <Route
                                      path="/category-mapping"
                                      element={
                                        <ProtectedRoute>
                                          <Layout>
                                            <CategoryMappingPage />
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
                                      element={
                                        <Navigate to="/tasks/:taskId" replace />
                                      }
                                    />

                                    {/* Fallback route - redirect to home */}
                                    <Route
                                      path="*"
                                      element={<Navigate to="/" replace />}
                                    />
                                  </Routes>
                                </AdminProvider>
                              </TimerProvider>
                            </TimerProvider>
                          </TimeSessionProvider>
                        </FilterSortProvider>
                      </TaskProvider>
                    </CategoryProvider>
                  </SettingsProvider>{' '}
                  {/* end merged SettingsProvider */}
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
