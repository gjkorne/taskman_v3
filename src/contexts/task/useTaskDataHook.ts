import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, TaskStatusType } from '../../types/task';
import { TaskStatus } from '../../components/TaskForm/schema';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { useToast } from '../../components/Toast/ToastContext';
import { filterTasks } from '../../lib/taskUtils';
import { TaskFilter, defaultFilters } from '../../components/TaskList/FilterPanel';
import { TaskUpdateDTO } from '../../repositories/taskRepository';

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

// Context type
export interface TaskDataContextType {
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isRefreshing: boolean;
  isSyncing: boolean;
  hasPendingChanges: boolean;
  fetchTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  syncTasks: () => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatusType) => Promise<void>;
  updateTask: (taskId: string, taskData: TaskUpdateDTO) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<void>;
  searchQuery: string;
  filters: TaskFilter;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: TaskFilter) => void;
  resetFilters: () => void;
}

export default function useTaskDataHook(): TaskDataContextType {
  const taskService = ServiceRegistry.getTaskService();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<TaskFilter>(defaultFilters);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasPendingChanges, setHasPendingChanges] = useState<boolean>(false);
  const { addToast } = useToast();

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
        return await taskService.getTasks();
      } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error('Failed to fetch tasks');
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const error = queryError instanceof Error ? queryError.message : (queryError ? String(queryError) : null);

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatusType }) =>
      taskService.updateTaskStatus(taskId, newStatus as TaskStatus),
    onSuccess: (updatedTask) => {
      if (updatedTask) {
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
        queryClient.setQueryData(TASK_QUERY_KEYS.detail(updatedTask.id), updatedTask);
        addToast(`Task status updated to ${updatedTask.status}`, 'success');
      }
    },
    onError: (error) => {
      addToast(`Failed to update task status: ${error instanceof Error ? error.message : String(error)}`, 'error');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, taskData }: { taskId: string; taskData: TaskUpdateDTO }) =>
      taskService.updateTask(taskId, taskData),
    onSuccess: (updatedTask) => {
      if (updatedTask) {
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
        queryClient.setQueryData(TASK_QUERY_KEYS.detail(updatedTask.id), updatedTask);
        addToast('Task updated successfully', 'success');
      }
    },
    onError: (error) => {
      addToast(`Failed to update task: ${error instanceof Error ? error.message : String(error)}`, 'error');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) });
      addToast('Task deleted successfully', 'success');
    },
    onError: (error) => {
      addToast(`Failed to delete task: ${error instanceof Error ? error.message : String(error)}`, 'error');
    },
  });

  const syncTasks = useCallback(async (): Promise<void> => {
    try {
      setIsSyncing(true);
      await taskService.sync();
      setHasPendingChanges(false);
      await queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all });
      addToast('Tasks synchronized successfully', 'success');
    } catch (error) {
      addToast(`Sync failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
      setHasPendingChanges(true);
    } finally {
      setIsSyncing(false);
    }
  }, [taskService, queryClient, addToast]);

  const fetchTasks = useCallback(async (): Promise<void> => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [refetch]);

  const refreshTasks = fetchTasks;

  useEffect(() => {
    let mounted = true;
    const checkPending = async () => {
      try {
        if (mounted) {
          const hasPending = await taskService.hasUnsyncedChanges();
          setHasPendingChanges(hasPending);
        }
      } catch (error) {
        console.error('Error checking pending changes:', error);
      }
    };
    checkPending();
    const id = setInterval(checkPending, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [taskService]);

  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatusType) => {
    await updateTaskStatusMutation.mutateAsync({ taskId, newStatus });
  }, [updateTaskStatusMutation]);

  const updateTask = useCallback(async (taskId: string, taskData: TaskUpdateDTO) => {
    return updateTaskMutation.mutateAsync({ taskId, taskData });
  }, [updateTaskMutation]);

  const deleteTask = useCallback(async (taskId: string) => {
    await deleteTaskMutation.mutateAsync(taskId);
  }, [deleteTaskMutation]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const filteredTasks = useMemo(() =>
    filterTasks(tasks, filters, searchQuery),
    [tasks, filters, searchQuery]
  );

  const value = useMemo<TaskDataContextType>(() => ({
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
    updateTask,
    deleteTask,
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters,
  }), [
    tasks, filteredTasks, isLoading, isError, error, isRefreshing,
    isSyncing, hasPendingChanges, fetchTasks, refreshTasks, syncTasks,
    updateTaskStatus, updateTask, deleteTask, searchQuery, filters
  ]);

  return value;
}
