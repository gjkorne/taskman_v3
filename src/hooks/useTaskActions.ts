import { useState, useCallback } from 'react';
import { Task, TaskStatusValues } from '../types/task';
import { taskService } from '../services/api';
import { useTaskContext } from '../contexts/TaskContext';
import { useToast } from '../components/Toast';

// Helper to check for development environment
const isDevelopment = process.env.NODE_ENV !== 'production';

export interface UseTaskActionsOptions {
  onSuccess?: (action: string, task?: Task) => void;
  onError?: (error: string, action: string) => void;
  showToasts?: boolean;
}

export function useTaskActions(options: UseTaskActionsOptions = {}) {
  const { onSuccess, onError, showToasts = true } = options;
  
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Access the task context for global tasks state
  const { refreshTasks } = useTaskContext();
  
  // Access toast notifications
  const { addToast } = useToast();

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
      
      // Show success toast
      if (showToasts) {
        // Make sure we're displaying a valid status name, not a task ID or other invalid value
        const validStatuses = ['active', 'completed', 'archived', 'pending', 'in_progress'];
        
        if (validStatuses.includes(status.toLowerCase())) {
          // Format the status string for display
          const statusText = status.replace('_', ' ');
          addToast(`Task marked as ${statusText}`, 'success');
        } else {
          // Fallback for unrecognized status values
          addToast(`Task status updated successfully`, 'success');
        }
      }
      
      // Trigger success callback
      onSuccess?.('update-status');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update task status';
      
      if (isDevelopment) {
        console.error('Error updating task status:', err);
      }
      
      // Show error toast
      if (showToasts) {
        addToast(errorMessage, 'error');
      }
      
      setError(errorMessage);
      onError?.(errorMessage, 'update-status');
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, onSuccess, onError, addToast, showToasts]);

  /**
   * Mark a task as completed
   */
  const completeTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, TaskStatusValues.COMPLETED);
  }, [updateTaskStatus]);

  /**
   * Start a task
   */
  const startTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, TaskStatusValues.ACTIVE);
  }, [updateTaskStatus]);

  /**
   * Mark a task as active (ready to start)
   */
  const activateTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, TaskStatusValues.ACTIVE);
  }, [updateTaskStatus]);

  /**
   * Return a task to pending status
   */
  const resetTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, TaskStatusValues.PENDING);
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
      
      // Show success toast
      if (showToasts) {
        addToast('Task deleted successfully', 'success');
      }
      
      // Trigger success callback
      onSuccess?.('delete');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete task';
      
      if (isDevelopment) {
        console.error('Error deleting task:', err);
      }
      
      // Show error toast
      if (showToasts) {
        addToast(errorMessage, 'error');
      }
      
      setError(errorMessage);
      onError?.(errorMessage, 'delete');
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, onSuccess, onError, addToast, showToasts]);

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
      
      // Show success toast
      if (showToasts) {
        addToast(`${taskIds.length} tasks deleted successfully`, 'success');
      }
      
      // Trigger success callback
      onSuccess?.('batch-delete');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete tasks';
      
      if (isDevelopment) {
        console.error('Error batch deleting tasks:', err);
      }
      
      // Show error toast
      if (showToasts) {
        addToast(errorMessage, 'error');
      }
      
      setError(errorMessage);
      onError?.(errorMessage, 'batch-delete');
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, onSuccess, onError, addToast, showToasts]);

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
