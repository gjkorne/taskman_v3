import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { Task, TaskStatusType } from '../types/task';
import { useToast } from '../components/Toast';
import { ServiceRegistry } from '../services/ServiceRegistry';
import { AppError } from '../utils/errorHandling';

// Types for the context
interface TaskContextType {
  // State
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  isSyncing: boolean;
  hasPendingChanges: boolean;

  // Task operations
  fetchTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  syncTasks: () => Promise<void>;
  updateTaskStatus: (
    taskId: string,
    newStatus: TaskStatusType
  ) => Promise<void>;
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
}

// Create context with default values
export const TaskContext = createContext<TaskContextType | undefined>(
  undefined
);

// Task Provider component
export const TaskProvider = ({ children }: { children: ReactNode }) => {
  // Get the task service from the service registry
  const taskService = ServiceRegistry.getTaskService();

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

  // Get toast notifications
  const { addToast } = useToast();

  // Set up event listeners for task changes
  useEffect(() => {
    // Subscribe to task service events
    const unsubs = [
      taskService.on('tasks-loaded', (loadedTasks) => {
        setTasks(loadedTasks);
      }),

      taskService.on('task-created', (task) => {
        setTasks((prev) => [...prev, task]);
      }),

      taskService.on('task-updated', (updatedTask) => {
        setTasks((prev) =>
          prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
        );
      }),

      taskService.on('task-deleted', (taskId) => {
        setTasks((prev) => prev.filter((task) => task.id !== taskId));
      }),

      taskService.on('error', (error) => {
        const appError = AppError.from(error);
        setError(appError.getUserMessage());
        addToast(`Error: ${appError.getUserMessage()}`, 'error');
      }),
    ];

    // Clean up subscriptions on unmount
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [addToast, taskService]);

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
  }, [taskService]);

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
      const appError = AppError.from(error);
      setError(appError.getUserMessage());
      addToast(`Error: ${appError.getUserMessage()}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, taskService]);

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
      await taskService.refreshTasks();
      addToast('Tasks refreshed successfully', 'success');
    } catch (error) {
      const appError = AppError.from(error);
      setError(appError.getUserMessage());
      addToast(`Refresh Failed: ${appError.getUserMessage()}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, addToast, taskService]);

  // Sync tasks with server
  const syncTasks = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setError(null);

    try {
      await taskService.sync();
      setHasPendingChanges(false);
      addToast('Sync Complete: All tasks synchronized with server', 'success');
    } catch (error) {
      const appError = AppError.from(error);
      setError(appError.getUserMessage());
      addToast(`Sync Failed: ${appError.getUserMessage()}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, addToast, taskService]);

  // Update task status
  const updateTaskStatus = useCallback(
    async (taskId: string, newStatus: TaskStatusType) => {
      try {
        // Pass TaskStatusType directly without casting to enum
        await taskService.updateTaskStatus(taskId, newStatus);
        addToast(`Task status updated to ${newStatus}`, 'success');
      } catch (error) {
        const appError = AppError.from(error);
        setError(appError.getUserMessage());
        addToast(`Update Failed: ${appError.getUserMessage()}`, 'error');
      }
    },
    [addToast, taskService]
  );

  // Delete task
  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        await taskService.deleteTask(taskId);
        closeDeleteModal();
        addToast('Task deleted successfully', 'success');
      } catch (error) {
        const appError = AppError.from(error);
        setError(appError.getUserMessage());
        addToast(`Delete Failed: ${appError.getUserMessage()}`, 'error');
      }
    },
    [addToast, taskService]
  );

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

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: TaskContextType = {
    // State
    tasks,
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
  };

  return (
    <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
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
