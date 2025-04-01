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
import { useAuth } from './lib/auth';
import { TimerProvider } from './contexts/TimerContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { TaskProvider } from './contexts/TaskContext';
import { ToastProvider } from './components/Toast';
import { CategoryProvider } from './contexts/CategoryContext';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  const [activeView, setActiveView] = React.useState<'tasks' | 'timer' | 'reports' | 'settings'>('tasks');
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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <TimerProvider>
            <TaskProvider>
              <ToastProvider>
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
                            >
                              {activeView === 'tasks' && <TaskList ref={taskListRef} />}
                              {activeView === 'timer' && <Timer />}
                              {activeView === 'reports' && <Reports />}
                              {activeView === 'settings' && <SettingsPage />}
                            </Layout>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </BrowserRouter>
                </CategoryProvider>
              </ToastProvider>
            </TaskProvider>
          </TimerProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App