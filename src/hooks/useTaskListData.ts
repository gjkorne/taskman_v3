import { useTaskData } from '../contexts/task';
import { useMemo } from 'react';

/**
 * Hook to encapsulate task list filtering and operations
 */
export function useTaskListData() {
  const {
    filteredTasks,
    isLoading,
    isError,
    error,
    isRefreshing,
    refreshTasks,
    filters,
    setFilters,
    deleteTask,
  } = useTaskData();

  // Derived metrics (e.g., counts) can be added here via useMemo

  return {
    filteredTasks,
    isLoading,
    isError,
    error,
    isRefreshing,
    refreshTasks,
    filters,
    setFilters,
    deleteTask,
  };
}
