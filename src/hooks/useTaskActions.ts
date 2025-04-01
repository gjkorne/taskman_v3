import { useState, useCallback } from 'react';
import { Task, TaskStatus } from '../types/task';
import { taskService } from '../services/api';
import { useTaskContext } from '../contexts/TaskContext';

// Helper to check for development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

export interface UseTaskActionsOptions {
  onSuccess?: (action: string, task?: Task) => void;
  onError?: (error: string, action: string) => void;
}

export function useTaskActions(options: UseTaskActionsOptions = {}) {
  const { onSuccess, onError } = options;
  
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Access the task context for global tasks state
  const { refreshTasks } = useTaskContext();

  /**
   * Update a task's status
   */
  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    if (!taskId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: apiError } = await taskService.updateTaskStatus(taskId, status);
      
      if (apiError) throw apiError;
      
      // Refresh task data
      await refreshTasks();
      
      // Trigger success callback
      onSuccess?.('update-status');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update task status';
      
      if (isDevelopment) {
        console.error('Error updating task status:', err);
      }
      
      setError(errorMessage);
      onError?.(errorMessage, 'update-status');
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, onSuccess, onError]);

  /**
   * Mark a task as completed
   */
  const completeTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, TaskStatus.COMPLETED);
  }, [updateTaskStatus]);

  /**
   * Set a task to in-progress status
   */
  const startTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);
  }, [updateTaskStatus]);

  /**
   * Mark a task as active (ready to start)
   */
  const activateTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, TaskStatus.ACTIVE);
  }, [updateTaskStatus]);

  /**
   * Return a task to pending status
   */
  const resetTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, TaskStatus.PENDING);
  }, [updateTaskStatus]);

  /**
   * Delete a task (soft delete)
   */
  const deleteTask = useCallback(async (taskId: string) => {
    if (!taskId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: apiError } = await taskService.deleteTask(taskId);
      
      if (apiError) throw apiError;
      
      // Refresh task data
      await refreshTasks();
      
      // Trigger success callback
      onSuccess?.('delete');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete task';
      
      if (isDevelopment) {
        console.error('Error deleting task:', err);
      }
      
      setError(errorMessage);
      onError?.(errorMessage, 'delete');
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, onSuccess, onError]);

  /**
   * Batch delete multiple tasks
   */
  const batchDeleteTasks = useCallback(async (taskIds: string[]) => {
    if (!taskIds.length) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: apiError } = await taskService.batchDeleteTasks(taskIds);
      
      if (apiError) throw apiError;
      
      // Refresh task data
      await refreshTasks();
      
      // Trigger success callback
      onSuccess?.('batch-delete');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete tasks';
      
      if (isDevelopment) {
        console.error('Error batch deleting tasks:', err);
      }
      
      setError(errorMessage);
      onError?.(errorMessage, 'batch-delete');
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, onSuccess, onError]);

  return {
    // State
    isLoading,
    error,
    
    // Task action methods
    updateTaskStatus,
    completeTask,
    startTask,
    activateTask,
    resetTask,
    deleteTask,
    batchDeleteTasks
  };
}
