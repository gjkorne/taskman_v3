import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Task, TaskStatusType } from '../../types/task';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { useToast } from '../../components/Toast';
import { filterTasks } from '../../lib/taskUtils';
import { TaskFilter, defaultFilters } from '../../components/TaskList/FilterPanel';

// Types for the data context
interface TaskDataContextType {
  // State
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  isSyncing: boolean;
  hasPendingChanges: boolean;
  
  // Data operations
  fetchTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  syncTasks: () => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatusType) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Search and filter
  searchQuery: string;
  filters: TaskFilter;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: TaskFilter) => void;
  resetFilters: () => void;
}

// Create context with default values
export const TaskDataContext = createContext<TaskDataContextType | undefined>(undefined);

// Task Data Provider component
export const TaskDataProvider = ({ children }: { children: ReactNode }) => {
  // Get the task service from the service registry
  const taskService = ServiceRegistry.getTaskService();
  
  // Task data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilter>(defaultFilters);
  
  // Get toast notifications
  const { addToast } = useToast();
  
  // Derived state - filtered and sorted tasks
  // Using useMemo to prevent unnecessary recalculations
  const filteredTasks = useMemo(() => 
    filterTasks(tasks, filters, searchQuery),
    [tasks, filters, searchQuery]
  );
  
  // Set up event listeners for task changes
  useEffect(() => {
    // Subscribe to task service events
    const unsubs = [
      taskService.on('tasks-loaded', (loadedTasks) => {
        setTasks(loadedTasks);
      }),
      
      taskService.on('task-created', (task) => {
        setTasks(prev => [...prev, task]);
      }),
      
      taskService.on('task-updated', (updatedTask) => {
        setTasks(prev => 
          prev.map(task => task.id === updatedTask.id ? updatedTask : task)
        );
      }),
      
      taskService.on('task-deleted', (taskId) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }),
      
      taskService.on('error', (error) => {
        setError(error.message);
        addToast({
          type: 'error',
          title: 'Task operation failed',
          message: error.message
        });
      })
    ];
    
    // Initial data load
    fetchTasks();
    
    // Cleanup function
    return () => {
      unsubs.forEach(unsubscribe => unsubscribe());
    };
  }, [taskService]);
  
  // Check for pending changes
  useEffect(() => {
    const checkPendingChanges = async () => {
      try {
        const hasChanges = await taskService.hasUnsyncedChanges();
        setHasPendingChanges(hasChanges);
      } catch (err) {
        console.error('Error checking for pending changes:', err);
      }
    };
    
    checkPendingChanges();
    
    // Set up interval to periodically check
    const interval = setInterval(checkPendingChanges, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [taskService]);
  
  // Function to fetch all tasks
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await taskService.getTasks();
      
      // Note: actual tasks will be set via the event listener
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error fetching tasks');
      setError(error.message);
      addToast({
        type: 'error',
        title: 'Error loading tasks',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [taskService, addToast]);
  
  // Function to refresh tasks from the server
  const refreshTasks = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      await taskService.refreshTasks();
      addToast({
        type: 'success',
        title: 'Tasks refreshed',
        message: 'Task list has been updated with the latest data'
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error refreshing tasks');
      setError(error.message);
      addToast({
        type: 'error',
        title: 'Error refreshing tasks',
        message: error.message
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [taskService, addToast]);
  
  // Function to sync tasks with the server
  const syncTasks = useCallback(async () => {
    if (!hasPendingChanges) return;
    
    try {
      setIsSyncing(true);
      setError(null);
      
      await taskService.sync();
      setHasPendingChanges(false);
      
      addToast({
        type: 'success',
        title: 'Sync completed',
        message: 'Tasks have been synced with the server'
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error syncing tasks');
      setError(error.message);
      addToast({
        type: 'error',
        title: 'Sync failed',
        message: error.message
      });
    } finally {
      setIsSyncing(false);
    }
  }, [taskService, hasPendingChanges, addToast]);
  
  // Function to update a task's status
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatusType) => {
    try {
      setError(null);
      await taskService.updateTaskStatus(taskId, newStatus);
      
      // No need to update local state, it will be updated via the event listener
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error updating task status');
      setError(error.message);
      addToast({
        type: 'error',
        title: 'Status update failed',
        message: error.message
      });
    }
  }, [taskService, addToast]);
  
  // Function to delete a task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setError(null);
      
      await taskService.deleteTask(taskId);
      
      addToast({
        type: 'success',
        title: 'Task deleted',
        message: 'The task has been removed'
      });
      
      // No need to update local state, it will be updated via the event listener
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error deleting task');
      setError(error.message);
      addToast({
        type: 'error',
        title: 'Delete failed',
        message: error.message
      });
    }
  }, [taskService, addToast]);
  
  // Function to reset filters
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchQuery('');
  }, []);
  
  // Context value - using useMemo to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    tasks,
    filteredTasks,
    isLoading,
    error,
    isRefreshing,
    isSyncing,
    hasPendingChanges,
    
    // Data operations
    fetchTasks,
    refreshTasks,
    syncTasks,
    updateTaskStatus,
    deleteTask,
    
    // Search and filter
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters,
  }), [
    tasks, 
    filteredTasks,
    isLoading, 
    error, 
    isRefreshing, 
    isSyncing, 
    hasPendingChanges,
    fetchTasks,
    refreshTasks,
    syncTasks,
    updateTaskStatus,
    deleteTask,
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters
  ]);
  
  return (
    <TaskDataContext.Provider value={value}>
      {children}
    </TaskDataContext.Provider>
  );
};

// Custom hook to use task data context
export const useTaskData = () => {
  const context = useContext(TaskDataContext);
  
  if (context === undefined) {
    throw new Error('useTaskData must be used within a TaskDataProvider');
  }
  
  return context;
};
