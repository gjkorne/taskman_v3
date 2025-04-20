import { useMemo } from 'react';
import { Task, TaskStatus } from '../types/task';
import { useTimer } from '../contexts/TimerCompat';

/**
 * Custom hook to categorize tasks based on their status and timer state
 * This separates task categorization logic from UI components
 */
export function useTaskCategories(tasks: Task[]) {
  const { timerState } = useTimer();

  return useMemo(() => {
    // ACTIVE TASKS: Tasks that are currently being TIMED (timer running)
    const activeTasks = tasks.filter(
      (task) => timerState.taskId === task.id && timerState.status === 'running'
    );

    // PAUSED TASKS: Tasks with paused timers BUT NOT in completed/archived status
    const pausedTasks = tasks.filter((task) => {
      const isPaused =
        timerState.taskId === task.id && timerState.status === 'paused';
      const isCompletedOrArchived =
        task.status === TaskStatus.COMPLETED ||
        task.status === TaskStatus.ARCHIVED;

      // Only show in paused section if timer is paused AND task isn't completed/archived
      return isPaused && !isCompletedOrArchived;
    });

    // PROGRESS TASKS: Tasks with in_progress status but NOT currently being timed or paused
    const inProgressTasks = tasks.filter((task) => {
      const isBeingTimed =
        timerState.taskId === task.id &&
        (timerState.status === 'running' || timerState.status === 'paused');
      const hasInProgressStatus = task.status === TaskStatus.IN_PROGRESS;

      // Only show in this section if it has in_progress status but no active timer
      return hasInProgressStatus && !isBeingTimed;
    });

    // OTHER TASKS: Everything else (not being timed, not paused, not in progress)
    const otherTasks = tasks.filter((task) => {
      // Not being timed
      const isBeingTimed =
        timerState.taskId === task.id &&
        (timerState.status === 'running' || timerState.status === 'paused');

      // Not in progress
      const hasInProgressStatus = task.status === TaskStatus.IN_PROGRESS;

      // A task should be in Other Tasks only if it's not in any other section
      return !isBeingTimed && !hasInProgressStatus;
    });

    const todoTasks = otherTasks.filter((t) => t.status === TaskStatus.PENDING);
    const completedTasks = otherTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED
    );
    const archivedTasks = otherTasks.filter(
      (t) => t.status === TaskStatus.ARCHIVED
    );

    // Separate starred tasks from todo tasks
    const starredTasks = todoTasks.filter(
      (t) => t.is_starred !== undefined && t.is_starred === true
    );
    // Remove starred tasks from todoTasks
    const regularTodoTasks = todoTasks.filter(
      (t) => t.is_starred === undefined || !t.is_starred
    );

    return {
      activeTasks,
      pausedTasks,
      inProgressTasks,
      starredTasks,
      todoTasks: regularTodoTasks,
      completedTasks,
      archivedTasks,

      // Additional helper functions
      isTaskActive: (taskId: string) =>
        timerState.taskId === taskId && timerState.status === 'running',

      isTaskPaused: (taskId: string) =>
        timerState.taskId === taskId && timerState.status === 'paused',
    };
  }, [tasks, timerState]);
}
