import { useTaskData } from '../contexts/task';
import useTaskFilterHook from '../contexts/task/useTaskFilterHook';

/**
 * Hook to encapsulate task list filtering and operations
 */
export function useTaskListData() {
  const { isLoading, isError, error, isRefreshing, refreshTasks, deleteTask } = useTaskData();
  const { filteredTasks, filters, setFilters } = useTaskFilterHook();

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
