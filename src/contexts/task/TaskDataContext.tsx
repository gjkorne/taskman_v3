import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, TaskStatusType } from '../../types/task';
import { TaskStatus } from '../../components/TaskForm/schema';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { useToast } from '../../components/Toast/ToastContext';
import { filterTasks } from '../../lib/taskUtils';
import { TaskFilter, defaultFilters } from '../../components/TaskList/FilterPanel';

// Cache keys for React Query
export const TASK_QUERY_KEYS = {
  all: ['tasks'] as const,
  lists: () => [...TASK_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: string) => [...TASK_QUERY_KEYS.lists(), filters] as const,
  details: () => [...TASK_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TASK_QUERY_KEYS.details(), id] as const,
  metrics: () => [...TASK_QUERY_KEYS.all, 'metrics'] as const,
  metric: (name: string) => [...TASK_QUERY_KEYS.metrics(), name] as const,
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
    queryKey: TASK_QUERY_KEYS.list(JSON.stringify(filters)),
    queryFn: async () => {
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
        // Invalidate affected queries
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
        
        // Optimistically update the cache for better UX
        queryClient.setQueryData(
          TASK_QUERY_KEYS.detail(updatedTask.id),
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
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
      
      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) });
      
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
      
      // Refetch after sync to get the latest data
      await queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all });
      
      addToast('Tasks synchronized successfully', 'success');
    } catch (error) {
      addToast(`Sync failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      setHasPendingChanges(true);
    } finally {
      setIsSyncing(false);
    }
  }, [taskService, queryClient, addToast]);
  
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
  const filteredTasks = useMemo(() => 
    filterTasks(tasks, filters, searchQuery),
    [tasks, filters, searchQuery]
  );
  
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
