import React, { useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/Auth/AuthProvider';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Layout } from './components/Layout';
import { TaskList, TaskListRefType } from './components/TaskList';
import { Timer } from './components/Timer';
import { Reports } from './components/Reports';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import { useAuth } from './lib/auth';
import { TimerProvider } from './contexts/TimerContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { TaskProvider } from './contexts/TaskContext';
import { ToastProvider } from './components/Toast';
import { CategoryProvider } from './contexts/CategoryContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { LoadingIndicator } from './components/UI/LoadingIndicator';

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
  const [activeView, setActiveView] = React.useState<'tasks' | 'timer' | 'reports' | 'settings' | 'admin'>('tasks');
  const taskListRef = useRef<TaskListRefType>(null);

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
              <SettingsProvider>
                <TimerProvider>
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
                                  {activeView === 'tasks' && <TaskList ref={taskListRef} />}
                                  {activeView === 'timer' && <Timer />}
                                  {activeView === 'reports' && <Reports />}
                                  {activeView === 'settings' && <SettingsPage />}
                                  {activeView === 'admin' && <AdminPage />}
                                </Layout>
                              </ProtectedRoute>
                            }
                          />
                          <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                      </BrowserRouter>
                    </CategoryProvider>
                  </TaskProvider>
                </TimerProvider>
              </SettingsProvider>
            </ErrorProvider>
          </LoadingProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App