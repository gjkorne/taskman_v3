import { createContext, useContext } from 'react';
import { useTaskApp } from './useTaskApp';
import { TaskProvider } from './TaskProvider';
import { Task, TaskStatusType } from '../../types/task';
import { TaskFilter } from '../../components/TaskList/FilterPanel';
import { TaskUpdateDTO } from '../../repositories/taskRepository';

// Combined context type for backward compatibility
export interface TaskContextType {
  // Data state
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  isSyncing: boolean;
  hasPendingChanges: boolean;

  // UI state
  editTaskId: string | null;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  taskToDelete: string | null;

  // Display controls
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;

  // Data operations
  fetchTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  syncTasks: () => Promise<void>;
  updateTaskStatus: (
    taskId: string,
    newStatus: TaskStatusType
  ) => Promise<void>;
  updateTask: (taskId: string, taskData: TaskUpdateDTO) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<void>;

  // Modal controls
  openEditModal: (taskId: string) => void;
  closeEditModal: () => void;
  openDeleteModal: (taskId: string) => void;
  closeDeleteModal: () => void;

  // Search and filter
  searchQuery: string;
  filters: TaskFilter;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: TaskFilter) => void;
  resetFilters: () => void;
}

// Create legacy context for backward compatibility
export const TaskContext = createContext<TaskContextType | undefined>(
  undefined
);

// Legacy hook for backward compatibility
/**
 * @deprecated use useTaskData or useTaskApp (new hooks) instead. This legacy hook will be removed in a future release.
 */
export function useTaskContext(): TaskContextType {
  const context = useContext(TaskContext);

  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }

  return context;
}

// Named exports for the new pattern
/**
 * @deprecated use useTaskData or useTaskUI hooks directly instead of useTaskApp. 
 * This facade hook will be removed after full migration.
 */
export { TaskProvider, useTaskApp };
export { useTaskData } from './TaskDataContext';

// Export default for easier importing
export default TaskProvider;
