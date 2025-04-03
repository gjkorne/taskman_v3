import { createContext, useContext, ReactNode } from 'react';
import { useTaskActions } from '../hooks/useTaskActions';

// Create the context type based on the return type of useTaskActions
type TaskActionsContextType = ReturnType<typeof useTaskActions> | null;

// Create the context with a default value of null
const TaskActionContext = createContext<TaskActionsContextType>(null);

interface TaskActionProviderProps {
  children: ReactNode;
  onTaskAction?: (action: string) => void;
}

/**
 * Provider component for task actions
 * Centralizes all task-related actions to avoid prop drilling
 */
export function TaskActionProvider({ 
  children, 
  onTaskAction 
}: TaskActionProviderProps) {
  // Initialize task actions with callbacks
  const taskActions = useTaskActions({
    showToasts: true,
    refreshTasks: async () => {
      // This would typically refresh task data
    },
    onSuccess: (action) => {
      if (onTaskAction) {
        onTaskAction(action);
      }
    },
    onError: (error, action) => {
      console.error(`Error in action ${action}:`, error);
    }
  });

  return (
    <TaskActionContext.Provider value={taskActions}>
      {children}
    </TaskActionContext.Provider>
  );
}

/**
 * Custom hook to use task actions
 * Abstracts away the context implementation details
 */
export function useTaskActionContext() {
  const context = useContext(TaskActionContext);
  
  if (!context) {
    throw new Error('useTaskActionContext must be used within a TaskActionProvider');
  }
  
  return context;
}
