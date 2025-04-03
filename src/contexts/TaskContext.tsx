import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Task, TaskStatus, TaskStatusType } from '../types/task';
import { taskService } from '../services/taskService';
import { TaskFilter, defaultFilters } from '../components/TaskList/FilterPanel';
import { filterTasks } from '../lib/taskUtils';
import { useToast } from '../components/Toast';

// Types for the context
interface TaskContextType {
  // State
  tasks: Task[];
  filteredTasks: Task[];
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  isSyncing: boolean;
  hasPendingChanges: boolean;
  
  // Task operations
  fetchTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  syncTasks: () => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatusType) => Promise<void>;
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  
  // UI state for modals
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilter>(defaultFilters);
  
  // Get toast notifications
  const { addToast } = useToast();
  
  // Derived state - filtered and sorted tasks
  const filteredTasks = filterTasks(tasks, filters, searchQuery);
  
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
        addToast("Error: " + error.message, "error");
      })
    ];
    
    // Clean up subscriptions on unmount
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [addToast]);
  
  // Check for pending changes on mount and periodically
  useEffect(() => {
    const checkPendingChanges = async () => {
      try {
        const hasChanges = await taskService.hasUnsyncedChanges();
        setHasPendingChanges(hasChanges);
      } catch (error) {
        console.error('Error checking pending changes:', error);
      }
    };
    
    // Initial check
    checkPendingChanges();
    
    // Set up interval for checking changes
    const interval = setInterval(checkPendingChanges, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Fetch tasks from the service
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching tasks...');
      await taskService.getTasks();
      console.log('Tasks fetched successfully');
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial fetch of tasks
  useEffect(() => {
    console.log('Initial tasks fetch triggered');
    fetchTasks();
  }, [fetchTasks]); // Add fetchTasks to dependency array
  
  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      await taskService.getTasks();
    } catch (error) {
      setError('Failed to refresh tasks');
      console.error('Error refreshing tasks:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);
  
  // Sync tasks with server
  const syncTasks = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setError(null);
    
    try {
      await taskService.syncTasks();
      setHasPendingChanges(false);
      addToast("Sync Complete: All tasks synchronized with server", "success");
    } catch (error) {
      setError('Failed to sync tasks');
      console.error('Error syncing tasks:', error);
      addToast("Sync Failed: Could not synchronize tasks with server", "error");
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, addToast]);
  
  // Update task status
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatusType) => {
    try {
      // Convert TaskStatusType to TaskStatus if necessary
      await taskService.updateTaskStatus(taskId, newStatus as TaskStatus);
    } catch (error) {
      setError('Failed to update task status');
      console.error('Error updating task status:', error);
      addToast("Update Failed: Could not update task status", "error");
    }
  }, [addToast]);
  
  // Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await taskService.deleteTask(taskId);
      closeDeleteModal();
      addToast("Task deleted successfully", "success");
    } catch (error) {
      setError('Failed to delete task');
      console.error('Error deleting task:', error);
      addToast("Delete Failed: Could not delete task", "error");
    }
  }, [addToast]);
  
  // Modal control functions
  const openEditModal = useCallback((taskId: string) => {
    setEditTaskId(taskId);
    setIsEditModalOpen(true);
  }, []);
  
  const closeEditModal = useCallback(() => {
    setEditTaskId(null);
    setIsEditModalOpen(false);
  }, []);
  
  const openDeleteModal = useCallback((taskId: string) => {
    setTaskToDelete(taskId);
    setIsDeleteModalOpen(true);
  }, []);
  
  const closeDeleteModal = useCallback(() => {
    setTaskToDelete(null);
    setIsDeleteModalOpen(false);
  }, []);
  
  // Filter reset function
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchQuery('');
  }, []);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue: TaskContextType = {
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
    
    // UI state
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
    resetFilters,
  };
  
  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook to use task context
export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
