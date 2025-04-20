import { useState, useCallback } from 'react';
import { taskService } from '../services/api';
import { TaskStatus, TaskStatusType } from '../types/task';
import {
  isValidStatusTransition,
  getStatusOnTimerStart,
  getStatusOnTimerPause,
} from '../utils/taskStatusUtils';
import {
  processError,
  logError,
  getUserFriendlyErrorMessage,
} from '../utils/errorUtils';

// Set of statuses that can be used in status updates
// This should align with the database constraints
const allowedStatuses: TaskStatusType[] = [
  'pending',
  'active',
  'in_progress',
  'paused',
  'completed',
  'archived',
];

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
  onError,
}: UseTaskActionsOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast notifications function - simplified from previous implementation
  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning'
  ) => {
    console.log(`Toast (${type}): ${message}`);
    // In a real implementation, this would show a toast notification
  };

  /**
   * Update the status of a task with validation
   */
  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatusType) => {
      if (!taskId) return;

      // Validate parameters - both types and order
      console.log('useTaskActions.updateTaskStatus - Params received:', {
        taskId,
        status,
      });

      // Parameter validation logic
      try {
        const isValidUuid =
          typeof taskId === 'string' &&
          taskId.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          );

        // Validate the status is allowed
        if (!allowedStatuses.includes(status)) {
          throw new Error(`Invalid status: ${status}`);
        }

        if (!isValidUuid) {
          throw new Error('Invalid task ID format');
        }

        setIsLoading(true);
        setError(null);

        // Fetch current task to validate status transition
        const { data: currentTask, error: fetchError } =
          await taskService.getTaskById(taskId);

        if (fetchError) {
          throw fetchError;
        }

        // Validate the status transition
        if (
          currentTask &&
          !isValidStatusTransition(currentTask.status, status)
        ) {
          throw new Error(
            `Invalid status transition from ${currentTask.status} to ${status}`
          );
        }

        // Update the task status
        const { error: updateError } = await taskService.updateTaskStatus(
          taskId,
          status
        );

        if (updateError) {
          throw updateError;
        }

        // Refresh task data
        await refreshTasks();

        // Show success toast
        if (showToasts) {
          addToast('Task status updated successfully', 'success');
        }

        // Trigger success callback
        if (onSuccess) {
          onSuccess('update-status');
        }
      } catch (err) {
        // Process and log the error
        const processedError = processError(err);
        logError(processedError, 'updateTaskStatus');

        // Get user-friendly error message
        const errorMessage = getUserFriendlyErrorMessage(processedError);
        setError(errorMessage);

        if (showToasts) {
          addToast(errorMessage, 'error');
        }

        if (onError) {
          onError(errorMessage, 'update-status');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [refreshTasks, onSuccess, onError, showToasts]
  );

  /**
   * Mark a task as completed
   */
  const completeTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, TaskStatus.COMPLETED);
    },
    [updateTaskStatus]
  );

  /**
   * Start a task
   */
  const startTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, getStatusOnTimerStart());
    },
    [updateTaskStatus]
  );

  /**
   * Mark a task as active (ready to start)
   */
  const activateTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, TaskStatus.ACTIVE);
    },
    [updateTaskStatus]
  );

  /**
   * Pause a task
   */
  const pauseTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, getStatusOnTimerPause());
    },
    [updateTaskStatus]
  );

  /**
   * Return a task to pending status
   */
  const resetTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, TaskStatus.PENDING);
    },
    [updateTaskStatus]
  );

  /**
   * Archive a task
   */
  const archiveTask = useCallback(
    async (taskId: string) => {
      await updateTaskStatus(taskId, TaskStatus.ARCHIVED);
    },
    [updateTaskStatus]
  );

  /**
   * Create a new task
   */
  const createTask = useCallback(
    async (taskData: any) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: apiError } = await taskService.createTask(
          taskData
        );

        if (apiError) {
          throw apiError;
        }

        // Refresh task data
        await refreshTasks();

        // Show success toast
        if (showToasts) {
          addToast('Task created successfully', 'success');
        }

        // Trigger success callback
        if (onSuccess) {
          onSuccess('create');
        }

        return data;
      } catch (err) {
        // Process and log the error
        const processedError = processError(err);
        logError(processedError, 'createTask');

        // Get user-friendly error message
        const errorMessage = getUserFriendlyErrorMessage(processedError);
        setError(errorMessage);

        if (showToasts) {
          addToast(errorMessage, 'error');
        }

        if (onError) {
          onError(errorMessage, 'create');
        }

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshTasks, onSuccess, onError, addToast, showToasts]
  );

  /**
   * Delete a task (soft delete)
   */
  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!taskId) return;

      setIsLoading(true);
      setError(null);

      try {
        const { error: apiError } = await taskService.deleteTask(taskId);

        if (apiError) {
          throw apiError;
        }

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
        // Process and log the error
        const processedError = processError(err);
        logError(processedError, 'deleteTask');

        // Get user-friendly error message
        const errorMessage = getUserFriendlyErrorMessage(processedError);
        setError(errorMessage);

        if (showToasts) {
          addToast(errorMessage, 'error');
        }

        if (onError) {
          onError(errorMessage, 'delete');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [refreshTasks, onSuccess, onError, showToasts]
  );

  /**
   * Batch delete multiple tasks
   */
  const batchDeleteTasks = useCallback(
    async (taskIds: string[]) => {
      if (!taskIds.length) return;

      setIsLoading(true);
      setError(null);

      try {
        const { error: apiError } = await taskService.batchDeleteTasks(taskIds);

        if (apiError) {
          throw apiError;
        }

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
        // Process and log the error
        const processedError = processError(err);
        logError(processedError, 'batchDeleteTasks');

        // Get user-friendly error message
        const errorMessage = getUserFriendlyErrorMessage(processedError);
        setError(errorMessage);

        if (showToasts) {
          addToast(errorMessage, 'error');
        }

        if (onError) {
          onError(errorMessage, 'batch-delete');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [refreshTasks, onSuccess, onError, addToast, showToasts]
  );

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
    batchDeleteTasks,
    createTask,
  };
}
