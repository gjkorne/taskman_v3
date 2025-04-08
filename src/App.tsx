import React, { useRef, useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthProvider';
import { LoginForm } from './components/Auth/LoginForm'; 
import { RegisterForm } from './components/Auth/RegisterForm';
import { useAuth } from './lib/auth';

import type { TaskListRefType } from './components/TaskList';

import { TimeSessionProvider } from './contexts/timeSession';
import { SettingsProvider } from './contexts/SettingsContext';
import { TaskProvider } from './contexts/task';
import { ToastProvider } from './components/Toast';
import { UnifiedCategoryProvider } from './contexts/CategoryUnified';
import { ErrorProvider } from './contexts/ErrorContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { NetworkStatusProvider } from './contexts/NetworkStatusContext';
import { OfflineIndicator } from './components/UI/OfflineIndicator';
import { AppInitializer } from './components/AppInitializer';
import { AppError, ErrorType } from './utils/errorHandling';
import { QueryProvider } from './contexts/query/QueryProvider';
import { useQueryClient } from '@tanstack/react-query';
import { AdminProvider } from './contexts/AdminContext';
import { FilterSortProvider } from './contexts/filterSort';
import { DensityProvider } from './contexts/ui/DensityContext';
import { DensityStyleInjector } from './components/UI/DensityStyleInjector';
import { Layout } from './components/Layout';
import { RefreshProvider } from './contexts/RefreshContext';
import { useRefresh } from './contexts/RefreshContext';
import { TimerProvider } from './contexts/TimerContext';
import { SettingsDataProvider } from './contexts/settings/SettingsDataContext';
import { SettingsUIProvider } from './contexts/settings/SettingsUIContext';
import { PomodoroProvider } from './components/Pomodoro/PomodoroContext';

// Import debug tools in development mode
if (process.env.NODE_ENV === 'development') {
  import('./utils/debugTools');
}

// Helper component to redirect while preserving URL parameters
function RedirectWithParams({ newPathPattern }: { newPathPattern: string }) {
  const { taskId } = useParams();
  const redirectPath = newPathPattern.replace(':taskId', taskId || '');
  
  return <Navigate to={redirectPath} replace />;
}

// Create a component that can access the query client and handle refreshes
function TaskDataRefresher({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  
  // Attach the refresh function to the global scope for other parts to trigger refreshes
  useEffect(() => {
    (window as any).__refreshTaskData = () => {
      console.log('Global refresh triggered');
      queryClient.invalidateQueries({
        predicate: query => query.queryKey[0] === 'tasks'
      });
    };
    
    return () => {
      delete (window as any).__refreshTaskData;
    };
  }, [queryClient]);
  
  return <>{children}</>;
}

// Layout wrapper that handles the activeView based on the current route
function RouteBasedLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [activeView, setActiveView] = useState<'tasks' | 'timer' | 'reports' | 'admin' | 'admin-data' | 'time-sessions' | 'calendar' | 'home' | 'settings'>('home');
  const taskListRef = useRef<TaskListRefType>(null);
  
  // Update activeView based on the current route path
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '') {
      setActiveView('home');
    } else if (path === '/tasks' || path.startsWith('/tasks/')) {
      setActiveView('tasks');
    } else if (path === '/timer') {
      setActiveView('timer');
    } else if (path === '/reports') {
      setActiveView('reports');
    } else if (path === '/admin') {
      setActiveView('admin');
    } else if (path === '/admin/data') {
      setActiveView('admin-data');
    } else if (path === '/time-sessions') {
      setActiveView('time-sessions');
    } else if (path === '/calendar') {
      setActiveView('calendar');
    } else if (path === '/settings') {
      setActiveView('settings');
    }
  }, [location]);
  
  // Handler for when a task is created or refresh is clicked
  const handleTaskCreated = () => {
    // Use the global refresh function we attached to window
    if ((window as any).__refreshTaskData) {
      (window as any).__refreshTaskData();
    }
    
    // Also use the legacy ref method if available
    if (activeView === 'tasks' && taskListRef.current) {
      taskListRef.current.refreshTaskList();
    }
    
    console.log('Tasks refresh triggered via global refresh button');
  };
  
  // Force task list refresh when timer state changes
  const handleTimerStateChange = () => {
    if (taskListRef.current) {
      console.log('Timer state changed, refreshing tasks');
      taskListRef.current.refreshTaskList();
    }
  };
  
  // Listen for custom app:change-view events for backward compatibility 
  useEffect(() => {
    const handleViewChangeEvent = (event: any) => {
      const newView = event.detail?.view;
      if (newView) {
        // Convert view to URL and use navigate
        switch(newView) {
          case 'home':
            window.history.pushState({}, '', '/');
            setActiveView('home');
            break;
          case 'tasks':
            window.history.pushState({}, '', '/tasks');
            setActiveView('tasks');
            break;
          case 'timer':
            window.history.pushState({}, '', '/timer');
            setActiveView('timer');
            break;
          case 'reports':
            window.history.pushState({}, '', '/reports');
            setActiveView('reports');
            break;
          case 'admin':
            window.history.pushState({}, '', '/admin');
            setActiveView('admin');
            break;
          case 'admin-data':
            window.history.pushState({}, '', '/admin/data');
            setActiveView('admin-data');
            break;
          case 'time-sessions':
            window.history.pushState({}, '', '/time-sessions');
            setActiveView('time-sessions');
            break;
          case 'calendar':
            window.history.pushState({}, '', '/calendar');
            setActiveView('calendar');
            break;
          case 'settings':
            window.history.pushState({}, '', '/settings');
            setActiveView('settings');
            break;
        }
      }
    };
    
    document.addEventListener('app:change-view', handleViewChangeEvent);
    return () => {
      document.removeEventListener('app:change-view', handleViewChangeEvent);
    };
  }, []);
  
  return (
    <Layout 
      activeView={activeView} 
      onViewChange={(view: any) => {
        // Handle view change by updating URL
        switch(view) {
          case 'home':
            window.history.pushState({}, '', '/');
            break;
          case 'tasks':
            window.history.pushState({}, '', '/tasks');
            break;
          case 'timer':
            window.history.pushState({}, '', '/timer');
            break;
          case 'reports':
            window.history.pushState({}, '', '/reports');
            break;
          case 'admin':
            window.history.pushState({}, '', '/admin');
            break;
          case 'admin-data':
            window.history.pushState({}, '', '/admin/data');
            break;
          case 'time-sessions':
            window.history.pushState({}, '', '/time-sessions');
            break;
          case 'calendar':
            window.history.pushState({}, '', '/calendar');
            break;
          case 'settings':
            window.history.pushState({}, '', '/settings');
            break;
        }
        setActiveView(view as any);
      }}
      onTaskCreated={handleTaskCreated}
      onTimerStateChange={handleTimerStateChange}
    >
      {children}
    </Layout>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const taskListRef = useRef<TaskListRefType>(null);
  const [appInitialized, setAppInitialized] = useState(false);
  const [appError, setAppError] = useState<AppError | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Application is now initialized through component tree
        setAppInitialized(true);
        console.log('Application initialization complete');
      } catch (error) {
        if (error instanceof AppError) {
          console.error(`Application initialization error: ${error.message}`, error);
          setAppError(error);
        } else {
          console.error('Application initialization error:', error);
          setAppError(new AppError(ErrorType.UNKNOWN, 'Failed to initialize the application'));
        }
      }
    };
    
    initApp();
  }, []);

  // Display initialization error if any
  if (appError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Initialization Error</h1>
          <p className="text-gray-700 mb-6">{appError.getUserMessage()}</p>
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

  // Show loading screen until app is initialized
  if (!appInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mt-4 text-gray-600">Initializing TaskMan...</div>
        </div>
      </div>
    );
  }

  // Register refresh handler with our RefreshContext
  // This will be available to the MainHeader refresh button
  const RefreshRegistrator = () => {
    const { registerRefreshHandler } = useRefresh();
    
    useEffect(() => {
      console.log('Registering global refresh handler with RefreshContext');
      return registerRefreshHandler(handleTaskCreated);
    }, []);
    
    return null;
  };
  
  // Handler for when a task is created or refresh is clicked
  const handleTaskCreated = () => {
    // Use the global refresh function we attached to window
    if ((window as any).__refreshTaskData) {
      (window as any).__refreshTaskData();
    }
    
    console.log('Tasks refresh triggered via global refresh button');
  };

  // Lazy load page components - MUST be declared at the top level
  const HomePage = lazy(() => import('./pages/HomePage'));
  const TaskListComponent = lazy(() => import('./components/TaskList').then(module => ({ default: module.TaskList })) ); 
  const TimerComponent = lazy(() => import('./components/Timer').then(module => ({ default: module.Timer })) ); 
  const ReportsPageComponent = lazy(() => import('./pages/ReportsPage').then(module => ({ default: module.ReportsPage })) ); 
  const SettingsPageWrapper = lazy(() => import('./pages/SettingsPageWrapper'));
  const AdminPageComponent = lazy(() => import('./pages/AdminPage')); 
  const AdminDataViewPageComponent = lazy(() => import('./pages/AdminDataViewPage')); 
  const TaskDetailsPageComponent = lazy(() => import('./pages/TaskDetailsPage').then(module => ({ default: module.TaskDetailsPage })) ); 
  const TimeSessionsPageComponent = lazy(() => import('./pages/TimeSessionsPage').then(module => ({ default: module.TimeSessionsPage })) ); 
  const CalendarPageComponent = lazy(() => import('./components/Calendar/CalendarPage').then(module => ({ default: module.CalendarPage })) );

  function LoadingFallback() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <div className="ml-4 text-gray-600">Loading page...</div>
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
                    <UnifiedCategoryProvider>
                      <SettingsDataProvider>
                        <SettingsUIProvider>
                          <TaskProvider>
                            <FilterSortProvider>
                              <TaskDataRefresher>
                                <TimerProvider>
                                  <TimeSessionProvider>
                                    <AdminProvider>
                                      <RefreshProvider>
                                        <PomodoroProvider>
                                          <DensityProvider>
                                            <DensityStyleInjector />
                                            <OfflineIndicator />
                                            <RefreshRegistrator />
                                            <ProtectedRoute>
                                              <AppInitializer />
                                            </ProtectedRoute>
                                            {/* Wrap Routes with Suspense for lazy loading */}
                                            <Suspense fallback={<LoadingFallback />}>
                                              <Routes>
                                                {/* Authentication Routes */}
                                                <Route path="/login" element={<LoginForm />} />
                                                <Route path="/register" element={<RegisterForm />} />
                                                
                                                {/* Settings Route */}
                                                <Route path="/settings" element={
                                                  <ProtectedRoute>
                                                    <RouteBasedLayout>
                                                      <SettingsPageWrapper />
                                                    </RouteBasedLayout>
                                                  </ProtectedRoute>
                                                } />
                                                
                                                {/* Task Details Route */}
                                                <Route 
                                                  path="/tasks/:taskId" 
                                                  element={
                                                    <ProtectedRoute>
                                                      <TaskDetailsPageComponent />
                                                    </ProtectedRoute>
                                                  } 
                                                />
                                                
                                                {/* Task Edit Route */}
                                                <Route 
                                                  path="/tasks/edit/:taskId" 
                                                  element={
                                                    <ProtectedRoute>
                                                      <TaskDetailsPageComponent isEditMode={true} />
                                                    </ProtectedRoute>
                                                  } 
                                                />
                                                
                                                {/* Legacy URL redirects */}
                                                <Route 
                                                  path="/app/task/:taskId" 
                                                  element={<RedirectWithParams newPathPattern="/tasks/:taskId" />}
                                                />
                                                
                                                {/* Main App Routes */}
                                                <Route
                                                  path="/"
                                                  element={
                                                    <ProtectedRoute>
                                                      <RouteBasedLayout>
                                                        <HomePage />
                                                      </RouteBasedLayout>
                                                    </ProtectedRoute>
                                                  }
                                                />
                                                <Route
                                                  path="/tasks"
                                                  element={
                                                    <ProtectedRoute>
                                                      <RouteBasedLayout>
                                                        <TaskListComponent ref={taskListRef} />
                                                      </RouteBasedLayout>
                                                    </ProtectedRoute>
                                                  }
                                                />
                                                <Route
                                                  path="/timer"
                                                  element={
                                                    <ProtectedRoute>
                                                      <RouteBasedLayout>
                                                        <TimerComponent />
                                                      </RouteBasedLayout>
                                                    </ProtectedRoute>
                                                  }
                                                />
                                                <Route
                                                  path="/reports"
                                                  element={
                                                    <ProtectedRoute>
                                                      <RouteBasedLayout>
                                                        <ReportsPageComponent />
                                                      </RouteBasedLayout>
                                                    </ProtectedRoute>
                                                  }
                                                />
                                                <Route
                                                  path="/admin"
                                                  element={
                                                    <ProtectedRoute>
                                                      <RouteBasedLayout>
                                                        <AdminPageComponent />
                                                      </RouteBasedLayout>
                                                    </ProtectedRoute>
                                                  }
                                                />
                                                <Route
                                                  path="/admin/data"
                                                  element={
                                                    <ProtectedRoute>
                                                      <RouteBasedLayout>
                                                        <AdminDataViewPageComponent />
                                                      </RouteBasedLayout>
                                                    </ProtectedRoute>
                                                  }
                                                />
                                                <Route
                                                  path="/time-sessions"
                                                  element={
                                                    <ProtectedRoute>
                                                      <RouteBasedLayout>
                                                        <TimeSessionsPageComponent />
                                                      </RouteBasedLayout>
                                                    </ProtectedRoute>
                                                  }
                                                />
                                                <Route
                                                  path="/calendar"
                                                  element={
                                                    <ProtectedRoute>
                                                      <RouteBasedLayout>
                                                        <CalendarPageComponent />
                                                      </RouteBasedLayout>
                                                    </ProtectedRoute>
                                                  }
                                                />
                                                
                                                {/* Fallback route - Redirect any unmatched routes to home */}
                                                <Route path="*" element={<Navigate to="/" replace />} />
                                              </Routes>
                                            </Suspense>
                                          </DensityProvider>
                                        </PomodoroProvider>
                                      </RefreshProvider>
                                    </AdminProvider>
                                  </TimeSessionProvider>
                                </TimerProvider>
                              </TaskDataRefresher>
                            </FilterSortProvider>
                          </TaskProvider>
                        </SettingsUIProvider>
                      </SettingsDataProvider>
                    </UnifiedCategoryProvider>
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