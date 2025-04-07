import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, TaskStatusType } from '../../types/task';
import { TaskStatus } from '../../components/TaskForm/schema';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { useToast } from '../../components/Toast/ToastContext';
import { filterTasks } from '../../lib/taskUtils';
import { TaskFilter, defaultFilters } from '../../components/TaskList/FilterPanel';
import debugTaskStatuses from '../../utils/debug-task-statuses';
import { useAuth } from '../../lib/auth';

// Cache keys for React Query
export const TASK_QUERY_KEYS = {
  all: (userId: string | null) => ['tasks', userId] as const,
  lists: (userId: string | null) => [...TASK_QUERY_KEYS.all(userId), 'list'] as const,
  list: (userId: string | null, filters?: string) => [...TASK_QUERY_KEYS.lists(userId), filters] as const,
  details: (userId: string | null) => [...TASK_QUERY_KEYS.all(userId), 'detail'] as const,
  detail: (userId: string | null, id: string) => [...TASK_QUERY_KEYS.details(userId), id] as const,
  metrics: (userId: string | null) => [...TASK_QUERY_KEYS.all(userId), 'metrics'] as const,
  metric: (userId: string | null, name: string) => [...TASK_QUERY_KEYS.metrics(userId), name] as const,
};

// Types for the data context
interface TaskDataContextType {
  // State
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  isError: boolean;
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
  
  // Get query client from React Query
  const queryClient = useQueryClient();
  
  // Get current user ID (assuming useAuth provides it)
  const { user } = useAuth();
  const userId = user?.id || null;

  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilter>(defaultFilters);
  
  // Other state managed outside of React Query
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  
  // Get toast notifications
  const { addToast } = useToast();
  
  // The main query to fetch all tasks
  const { 
    data: tasks = [], 
    isLoading, 
    isError,
    error: queryError,
    refetch,
    isRefetching: isRefreshing
  } = useQuery({
    // Include userId in the query key
    queryKey: TASK_QUERY_KEYS.list(userId, JSON.stringify(filters)),
    queryFn: async () => {
      // Guard against fetching if userId is not available (e.g., logged out)
      if (!userId) {
        console.log('No user ID available, skipping task fetch.');
        return []; // Return empty array if not logged in
      }
      try {
        const tasks = await taskService.getTasks();
        return tasks;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Failed to fetch tasks');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    enabled: !!userId, // Only run the query if userId exists
  });
  
  // Error state handling
  const error = queryError instanceof Error ? queryError.message : (queryError ? String(queryError) : null);
  
  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatusType }) => 
      taskService.updateTaskStatus(taskId, newStatus as TaskStatus),
    onSuccess: (updatedTask) => {
      // Only proceed if we have a valid task returned
      if (updatedTask) {
        // Invalidate affected queries using userId
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists(userId) });
        
        // Optimistically update the cache for better UX using userId
        queryClient.setQueryData(
          TASK_QUERY_KEYS.detail(userId, updatedTask.id),
          updatedTask
        );
        
        // Show success toast
        addToast(`Task status updated to ${updatedTask.status}`, 'success');
      }
    },
    onError: (error) => {
      addToast(`Failed to update task status: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  });
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      // Invalidate affected queries using userId
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists(userId) });
      
      // Optimistically remove from cache using userId
      queryClient.removeQueries({ queryKey: TASK_QUERY_KEYS.detail(userId, taskId) });
      
      // Show success toast
      addToast('Task deleted successfully', 'success');
    },
    onError: (error) => {
      addToast(`Failed to delete task: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  });
  
  // Sync tasks with backend
  const syncTasks = useCallback(async (): Promise<void> => {
    try {
      setIsSyncing(true);
      await taskService.sync();
      setHasPendingChanges(false);
      
      // Refetch after sync to get the latest data using userId
      await queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all(userId) });
      
      addToast('Tasks synchronized successfully', 'success');
    } catch (error) {
      addToast(`Sync failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      setHasPendingChanges(true);
    } finally {
      setIsSyncing(false);
    }
  }, [taskService, queryClient, addToast, userId]);
  
  // Helper function to fetch tasks (just triggers refetch)
  const fetchTasks = useCallback(async (): Promise<void> => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Error handling is done by React Query
    }
  }, [refetch]);
  
  // Helper function to refresh tasks (alias for fetchTasks for backward compatibility)
  const refreshTasks = fetchTasks;
  
  // Check for pending changes periodically
  useEffect(() => {
    let mounted = true;
    
    const checkPendingChanges = async () => {
      try {
        if (mounted) {
          const hasPending = await taskService.hasUnsyncedChanges();
          setHasPendingChanges(hasPending);
        }
      } catch (error) {
        console.error('Error checking pending changes:', error);
      }
    };
    
    // Check immediately and then on interval
    checkPendingChanges();
    
    const intervalId = setInterval(checkPendingChanges, 60000); // Check every minute
    
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [taskService]);
  
  // Helper to update a single task status
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatusType): Promise<void> => {
    await updateTaskStatusMutation.mutateAsync({ taskId, newStatus });
  }, [updateTaskStatusMutation]);
  
  // Helper to delete a task
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    await deleteTaskMutation.mutateAsync(taskId);
  }, [deleteTaskMutation]);
  
  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);
  
  // Derived state - filtered and sorted tasks - using useMemo to prevent unnecessary recalculations
  const filteredTasks = useMemo(() => {
    // Run debug utility to check status counts
    if (tasks.length > 0) {
      debugTaskStatuses(tasks, filters, searchQuery);
    }
    return filterTasks(tasks, filters, searchQuery);
  }, [tasks, filters, searchQuery]);
  
  // Context value - memoized to prevent unnecessary re-renders
  const value = useMemo<TaskDataContextType>(() => ({
    // State
    tasks,
    filteredTasks,
    isLoading,
    isError,
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
    isError,
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
    resetFilters,
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
