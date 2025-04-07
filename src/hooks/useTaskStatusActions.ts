import { useCallback, useContext } from 'react';
import { TaskStatus, TaskStatusType } from '../types/task';
import TasksContext from '../contexts/tasks/TasksContext';
import { useTimer } from '../contexts/TimerCompat';

/**
 * Custom hook to consolidate task status management actions
 * Provides consistent methods for marking tasks as complete, in progress, etc.
 */
export function useTaskStatusActions() {
  const tasksContext = useContext(TasksContext);
  const { completeTask } = useTimer();

  /**
   * Mark a task as complete, handling any active timers for the task
   */
  const markTaskAsComplete = useCallback((taskId: string, currentStatus: TaskStatusType) => {
    console.log('Marking task as complete:', { taskId, currentStatus });
    
    // Validate taskId is a UUID
    if (!taskId || !taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('Invalid taskId provided to markTaskAsComplete:', taskId);
      return;
    }

    // Use the completeTask method which will handle active timers
    completeTask(taskId);
    
    // Also use the tasks context completeTask for consistency
    tasksContext.completeTask(taskId);
  }, [tasksContext, completeTask]);

  /**
   * Mark a task as in progress
   */
  const markTaskAsInProgress = useCallback((taskId: string) => {
    console.log('Marking task as in progress:', taskId);
    
    // Validate taskId 
    if (!taskId || !taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('Invalid taskId provided to markTaskAsInProgress:', taskId);
      return;
    }
    
    // Use updateTask to change the status
    tasksContext.updateTask(taskId, { status: TaskStatus.IN_PROGRESS });
  }, [tasksContext]);

  /**
   * Mark a task as active
   */
  const markTaskAsActive = useCallback((taskId: string) => {
    console.log('Marking task as active:', taskId);
    
    // Validate taskId
    if (!taskId || !taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('Invalid taskId provided to markTaskAsActive:', taskId);
      return;
    }
    
    // Use updateTask to change the status
    tasksContext.updateTask(taskId, { status: TaskStatus.ACTIVE });
  }, [tasksContext]);

  return {
    markTaskAsComplete,
    markTaskAsInProgress,
    markTaskAsActive
  };
}