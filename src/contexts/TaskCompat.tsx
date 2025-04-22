import { useTaskData } from './task/TaskDataContext';
import { useTaskUI } from './task/TaskUIContext';
import { useFilterSort } from './FilterSortContext';

/**
 * Compatibility layer for the old useTaskContext hook
 * This allows components using the old API to continue working
 * while we transition to the new context structure
 */
export function useTaskContext() {
  // Data operations from new context
  const {
    tasks,
    isLoading,
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
  } = useTaskData();

  // Filter and search state
  const {
    filteredTasks,
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters,
  } = useFilterSort();

  // UI state and actions
  const {
    editTaskId,
    isEditModalOpen,
    isDeleteModalOpen,
    taskToDelete,
    viewMode,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    setViewMode,
  } = useTaskUI();

  // Combine all the functionality to match the old context API
  return {
    // State
    tasks,
    filteredTasks,
    isLoading,
    error,
    isRefreshing,
    isSyncing,
    hasPendingChanges,

    // Task operations
    fetchTasks,
    refreshTasks,
    syncTasks,
    updateTaskStatus,
    updateTask,
    deleteTask,

    // UI state management
    editTaskId,
    isEditModalOpen,
    isDeleteModalOpen,
    taskToDelete,
    viewMode,

    // Modal controls
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,

    // View controls
    setViewMode,

    // Additional properties from searchQuery and filters
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters,
  };
}
