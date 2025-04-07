import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { Task } from '../../types/task';
import { ServiceFactory } from '../../services/factory/ServiceFactory';
import { ITaskService } from '../../services/interfaces/ITaskService';
import { useError } from '../error/ErrorContext';
import { ErrorSeverity, ErrorSource, ErrorCode } from '../../services/error/ErrorTypes';
import { supabase } from '../../lib/supabase';

// Define a type for service response to ensure consistent handling
interface ServiceResponse<T> {
  data?: T;
  error?: Error | null;
}

// Define the context shape with full task management capabilities
interface TasksContextType {
  // State
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  
  // Task retrieval methods
  getTaskById: (id: string) => Task | undefined;
  
  // Task mutation methods
  addTask: (taskData: any) => Promise<{success: boolean, task?: Task, error?: Error}>;
  updateTask: (id: string, taskData: any) => Promise<{success: boolean, task?: Task, error?: Error}>;
  deleteTask: (id: string) => Promise<{success: boolean, error?: Error}>;
  completeTask: (id: string) => Promise<{success: boolean, task?: Task, error?: Error}>;
  
  // Refresh method
  refreshTasks: () => Promise<void>;
  
  // Filtering capabilities
  filterTasksByStatus: (status: string) => Task[];
  filterTasksByPriority: (priority: string) => Task[];
}

// Default context with empty implementations
const defaultContext: TasksContextType = {
  tasks: [],
  isLoading: false,
  error: null,
  
  getTaskById: () => undefined,
  
  addTask: async () => ({ success: false }),
  updateTask: async () => ({ success: false }),
  deleteTask: async () => ({ success: false }),
  completeTask: async () => ({ success: false }),
  
  refreshTasks: async () => {},
  
  filterTasksByStatus: () => [],
  filterTasksByPriority: () => [],
};

const TasksContext = createContext<TasksContextType>(defaultContext);

export const useTasks = () => useContext(TasksContext);

interface TasksProviderProps {
  children: ReactNode;
  service?: ITaskService;
  initialTasks?: Task[];
}

export const TasksProvider: React.FC<TasksProviderProps> = ({ 
  children,
  service,
  initialTasks = []
}) => {
  // Use provided service or get from factory
  const taskService: ITaskService = service || 
    ServiceFactory.getService('TaskService') as ITaskService;
    
  // Get error context for centralized error handling
  const { logError } = useError();
  
  // State
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Cache key for local storage
  const TASKS_CACHE_KEY = 'taskman_tasks_cache';
  
  // Retrieval method
  const getTaskById = useCallback((id: string) => {
    return tasks.find(task => task.id === id);
  }, [tasks]);
  
  // Load tasks from service
  const refreshTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to load from cache first (implement offline-first pattern)
      const cachedTasks = localStorage.getItem(TASKS_CACHE_KEY);
      if (cachedTasks) {
        setTasks(JSON.parse(cachedTasks));
      }
      
      // Then fetch from service
      const result = await taskService.getTasks();
      
      // Handle the response based on the structure
      if (Array.isArray(result)) {
        // If result is an array of tasks directly
        setTasks(result);
        localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(result));
      } else if (result && typeof result === 'object' && 'tasks' in result) {
        // If result has a tasks property (service response wrapper)
        const tasksResponse = result as unknown as { tasks: Task[], error?: Error };
        
        if (tasksResponse.error) {
          throw tasksResponse.error;
        }
        
        setTasks(tasksResponse.tasks);
        localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(tasksResponse.tasks));
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      
      // Log to centralized error service
      logError(error, {
        code: ErrorCode.ERR_TASK_FETCH_FAILED,
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.API,
        userMessage: 'Failed to load tasks. Please try again later.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [taskService, logError]);
  
  // Add a new task
  const addTask = useCallback(async (taskData: any) => {
    try {
      setIsLoading(true);
      
      const result = await taskService.createTask(taskData);
      let taskResult: Task | null = null;
      
      // Handle different result types
      if (result === null) {
        return { success: false };
      } else if (typeof result === 'object' && 'id' in result) {
        // If the result directly has task properties
        taskResult = result as Task;
      } else if (result && typeof result === 'object') {
        // If result is a wrapper object
        const taskResponse = result as unknown as ServiceResponse<Task>;
        
        if (taskResponse.error) {
          throw taskResponse.error;
        }
        
        if (taskResponse.data) {
          taskResult = taskResponse.data;
        }
      }
      
      if (taskResult) {
        // Update local state with the new task
        setTasks(prevTasks => {
          const newTasks = [...prevTasks, taskResult as Task];
          // Update cache
          localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(newTasks));
          return newTasks;
        });
        
        return { success: true, task: taskResult };
      }
      
      return { success: false };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add task');
      
      // Log to centralized error service
      logError(error, {
        code: ErrorCode.ERR_TASK_CREATE_FAILED,
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.API,
        userMessage: 'Failed to create task. Please try again.'
      });
      
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [taskService, logError]);
  
  // Update an existing task
  const updateTask = useCallback(async (id: string, taskData: any) => {
    try {
      setIsLoading(true);
      
      const result = await taskService.updateTask(id, taskData);
      let taskResult: Task | null = null;
      
      // Handle different result types
      if (result === null) {
        return { success: false };
      } else if (typeof result === 'object' && 'id' in result) {
        // If the result directly has task properties
        taskResult = result as Task;
      } else if (result && typeof result === 'object') {
        // If result is a wrapper object
        const taskResponse = result as unknown as ServiceResponse<Task>;
        
        if (taskResponse.error) {
          throw taskResponse.error;
        }
        
        if (taskResponse.data) {
          taskResult = taskResponse.data;
        }
      }
      
      if (taskResult) {
        // Update local state with the updated task
        setTasks(prevTasks => {
          const updatedTasks = prevTasks.map(task => 
            task.id === id ? taskResult as Task : task
          );
          // Update cache
          localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(updatedTasks));
          return updatedTasks;
        });
        
        return { success: true, task: taskResult };
      }
      
      return { success: false };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update task');
      
      // Log to centralized error service
      logError(error, {
        code: ErrorCode.ERR_TASK_UPDATE_FAILED,
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.API,
        userMessage: 'Failed to update task. Please try again.'
      });
      
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [taskService, logError]);
  
  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      
      // Get current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      // Check if user is admin (greg@gjkandsons.com)
      const isAdmin = authData?.user?.email === 'greg@gjkandsons.com';
      
      if (!isAdmin) {
        throw new Error('Insufficient permissions: Admin privileges required for deletion');
      }

      // Delete the task from Supabase
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      // Update local state by removing the deleted task
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.filter(task => task.id !== id);
        // Update cache
        localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(updatedTasks));
        return updatedTasks;
      });
        
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete task');
      
      // Log to centralized error service
      logError(error, {
        code: ErrorCode.ERR_TASK_DELETE_FAILED,
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.API,
        userMessage: 'Failed to delete task. Please try again.'
      });
      
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [logError]);
  
  // Complete a task
  const completeTask = useCallback(async (id: string) => {
    return updateTask(id, { status: 'completed' });
  }, [updateTask]);
  
  // Filter tasks by status
  const filterTasksByStatus = useCallback((status: string) => {
    return tasks.filter(task => task.status === status);
  }, [tasks]);
  
  // Filter tasks by priority
  const filterTasksByPriority = useCallback((priority: string) => {
    return tasks.filter(task => task.priority === priority);
  }, [tasks]);
  
  // Load tasks on first render
  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);
  
  // Context value
  const value: TasksContextType = {
    tasks,
    isLoading,
    error,
    
    getTaskById,
    
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    
    refreshTasks,
    
    filterTasksByStatus,
    filterTasksByPriority,
  };
  
  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};

export default TasksContext;
