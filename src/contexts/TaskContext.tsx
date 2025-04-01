import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, TaskStatusType } from '../types/task';
import { taskService } from '../services/api';
import { TaskFilter, defaultFilters } from '../components/TaskList/FilterPanel';
import { filterTasks, sortTasks } from '../lib/taskUtils';

// Types for the context
interface TaskContextType {
  // State
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  
  // Task operations
  fetchTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // UI state management
  editTaskId: string | null;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  taskToDelete: string | null;
  
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

// Create context with default values
export const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Task Provider component
export const TaskProvider = ({ children }: { children: ReactNode }) => {
  // Task data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal state
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilter>({
    ...defaultFilters,
    viewMode: 'list'
  });
  
  // Helper to check for development environment
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Computed filtered tasks
  const filteredTasks = sortTasks(filterTasks(tasks, filters, searchQuery), filters.sortBy, filters.sortOrder);

  // Fetch tasks from API
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await taskService.getTasks();
      
      if (error) throw error;
      
      if (data) {
        console.log('Loaded tasks with statuses:', data.map(t => ({ id: t.id, title: t.title, status: t.status })));
        
        // Ensure all tasks have a valid status from our TaskStatusType
        const tasksWithValidStatus = data.map(task => {
          // If task has no status or invalid status, set to 'pending'
          if (!task.status || !['pending', 'active', 'paused', 'completed', 'archived'].includes(task.status)) {
            return { ...task, status: 'pending' as TaskStatusType };
          }
          // Cast string status to TaskStatusType
          return { ...task, status: task.status as TaskStatusType };
        });
        
        setTasks(tasksWithValidStatus);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks');
      setIsLoading(false);
    }
  };
  
  // Refresh tasks - similar to fetchTasks but with loading indicator
  const refreshTasks = async () => {
    setIsRefreshing(true);
    
    try {
      await fetchTasks();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update task status using taskService
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error: apiError } = await taskService.updateTaskStatus(taskId, newStatus);

      if (apiError) {
        if (isDevelopment) {
          console.error("Error updating task status:", apiError);
        }
        throw apiError;
      }

      // Update local state for immediate UI feedback
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err) {
      if (isDevelopment) {
        console.error("Exception updating task status:", err);
      }
      setError("Failed to update task status. Please try again.");
    }
  };

  // Delete task using taskService
  const deleteTask = async (taskId: string) => {
    if (!taskId) return;
    
    try {
      const { error: apiError } = await taskService.deleteTask(taskId);

      if (apiError) {
        if (isDevelopment) {
          console.error("Error deleting task:", apiError);
        }
        throw apiError;
      }

      // Update local state
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Close the modal if it was open
      closeDeleteModal();
    } catch (err) {
      if (isDevelopment) {
        console.error("Exception deleting task:", err);
      }
      setError("Failed to delete task. Please try again.");
    }
  };

  // Modal control functions
  const openEditModal = (taskId: string) => {
    setEditTaskId(taskId);
    setIsEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditTaskId(null);
  };
  
  const openDeleteModal = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
  };
  
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };
  
  // Reset filters function
  const resetFilters = () => {
    setFilters({
      ...defaultFilters,
      viewMode: filters.viewMode // Keep current view mode when resetting
    });
    setSearchQuery('');
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // The context value
  const value = {
    // State
    tasks,
    filteredTasks,
    isLoading,
    error,
    isRefreshing,
    
    // Task operations
    fetchTasks,
    refreshTasks,
    updateTaskStatus,
    deleteTask,
    
    // UI state management
    editTaskId,
    isEditModalOpen,
    isDeleteModalOpen,
    taskToDelete,
    
    // Modal controls
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    
    // Search and filter
    searchQuery,
    filters,
    setSearchQuery,
    setFilters,
    resetFilters
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook to use task context
export const useTaskContext = () => {
  const context = useContext(TaskContext);
  
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  
  return context;
};
