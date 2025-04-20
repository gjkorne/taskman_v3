import { useTaskData } from './task';
import { useTaskUI } from './task';

/**
 * Compatibility layer for the old useTaskContext hook
 * This allows components using the old API to continue working
 * while we transition to the new context structure
 */
export function useTaskContext() {
  // Get data and UI state from our new contexts
  const {
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
    resetFilters,
  } = useTaskData();

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
