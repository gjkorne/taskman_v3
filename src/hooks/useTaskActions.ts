import { useState, useCallback } from 'react';
import { taskService } from '../services/api';
import { TaskStatus, TaskStatusType } from '../types/task';

interface UseTaskActionsOptions {
  showToasts?: boolean;
  refreshTasks?: () => Promise<void>;
  onSuccess?: (action: string) => void;
  onError?: (error: string, action: string) => void;
}

/**
 * Hook for common task actions that update task status or other properties
 */
export function useTaskActions({
  showToasts = true,
  refreshTasks = async () => {},
  onSuccess,
  onError
}: UseTaskActionsOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Toast notifications function - simplified from previous implementation
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    console.log(`Toast (${type}): ${message}`);
    // In a real implementation, this would show a toast notification
  };

  /**
   * Update the status of a task
   */
  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatusType) => {
    if (!taskId) return;
    
    // Validate parameters - both types and order
    console.log('useTaskActions.updateTaskStatus - Params received:', { taskId, status });
    
    // Detect and fix swapped parameters
    if (status.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) && 
        (typeof taskId === 'string' && ['pending', 'active', 'paused', 'completed', 'archived'].includes(taskId))) {
      console.error('Parameters are definitely swapped. Fixing automatically.');
      // Swap parameters
      [taskId, status] = [status, taskId as any];
    }
    
    // Validate taskId format
    if (!taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('Invalid UUID format for taskId:', taskId);
      setError('Invalid task ID format');
      if (onError) onError('Invalid task ID format', 'update-status');
      return;
    }
    
    // If status is a UUID (incorrect parameter order), use a default status
    if (status.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('Status parameter is a UUID - using "active" as fallback');
      status = 'active' as TaskStatusType;
    }
    
    // Validate status value
    const validStatuses = Object.values(TaskStatus);
    if (!validStatuses.includes(status as any)) {
      console.error('Invalid status value:', status);
      setError('Invalid status value');
      if (onError) onError('Invalid status value', 'update-status');
      return;
    }
    
    console.log('useTaskActions: Calling API with validated params:', { taskId, status });
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: apiError } = await taskService.updateTaskStatus(taskId, status);
      
      if (apiError) throw apiError;
      
      // Refresh task data
      await refreshTasks();
      
      // Show success toast
      if (showToasts) {
        // Make sure we're displaying a valid status name
        addToast(`Task marked as ${status}`, 'success');
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess('update-status');
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task status';
      setError(errorMessage);
      
      if (showToasts) {
        addToast('Failed to update task status', 'error');
      }
      
      if (onError) {
        onError(errorMessage, 'update-status');
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, onSuccess, onError, showToasts]);

  /**
   * Mark a task as completed
   */
  const completeTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, 'completed');
  }, [updateTaskStatus]);

  /**
   * Start a task
   */
  const startTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, 'active');
  }, [updateTaskStatus]);

  /**
   * Mark a task as active (ready to start)
   */
  const activateTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, 'active');
  }, [updateTaskStatus]);

  /**
   * Pause a task
   */
  const pauseTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, 'paused');
  }, [updateTaskStatus]);

  /**
   * Return a task to pending status
   */
  const resetTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, 'pending');
  }, [updateTaskStatus]);

  /**
   * Archive a task
   */
  const archiveTask = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, 'archived');
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
      if (onSuccess) {
        onSuccess('delete');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      
      if (showToasts) {
        addToast('Failed to delete task', 'error');
      }
      
      if (onError) {
        onError(errorMessage, 'delete');
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, onSuccess, onError, showToasts]);

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
      if (onSuccess) {
        onSuccess('batch-delete');
      }
    } catch (err) {
      console.error('Error batch deleting tasks:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tasks';
      setError(errorMessage);
      
      if (showToasts) {
        addToast('Failed to delete tasks', 'error');
      }
      
      if (onError) {
        onError(errorMessage, 'batch-delete');
      }
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
    pauseTask,
    resetTask,
    archiveTask,
    deleteTask,
    batchDeleteTasks
  };
}
