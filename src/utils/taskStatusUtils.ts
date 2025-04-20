import { TaskStatus, TaskStatusType } from '../types/task';

/**
 * Task status utilities
 * Centralizes all task status related operations and validations
 */

// Map of valid status transitions
// This defines which status changes are permitted in the application
export const VALID_STATUS_TRANSITIONS: Record<
  TaskStatusType,
  TaskStatusType[]
> = {
  [TaskStatus.PENDING]: [
    TaskStatus.ACTIVE,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
    TaskStatus.ARCHIVED,
  ],
  [TaskStatus.ACTIVE]: [
    TaskStatus.PENDING,
    TaskStatus.IN_PROGRESS,
    TaskStatus.PAUSED,
    TaskStatus.COMPLETED,
    TaskStatus.ARCHIVED,
  ],
  [TaskStatus.IN_PROGRESS]: [
    TaskStatus.PENDING,
    TaskStatus.ACTIVE,
    TaskStatus.PAUSED,
    TaskStatus.COMPLETED,
    TaskStatus.ARCHIVED,
  ],
  [TaskStatus.PAUSED]: [
    TaskStatus.PENDING,
    TaskStatus.ACTIVE,
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
    TaskStatus.ARCHIVED,
  ],
  [TaskStatus.COMPLETED]: [
    TaskStatus.PENDING,
    TaskStatus.ACTIVE,
    TaskStatus.ARCHIVED,
  ],
  [TaskStatus.ARCHIVED]: [TaskStatus.PENDING, TaskStatus.COMPLETED],
};

// Status display configurations
export const STATUS_DISPLAY_CONFIG: Record<
  TaskStatusType,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
  }
> = {
  [TaskStatus.PENDING]: {
    label: 'Pending',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'circle',
  },
  [TaskStatus.ACTIVE]: {
    label: 'Active',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'play-circle',
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: 'loader',
  },
  [TaskStatus.PAUSED]: {
    label: 'Paused',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: 'pause-circle',
  },
  [TaskStatus.COMPLETED]: {
    label: 'Completed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'check-circle',
  },
  [TaskStatus.ARCHIVED]: {
    label: 'Archived',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: 'archive',
  },
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  currentStatus: TaskStatusType,
  targetStatus: TaskStatusType
): boolean {
  // Always allow if staying in the same status
  if (currentStatus === targetStatus) return true;

  // Check the transition is valid
  return (
    VALID_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) || false
  );
}

/**
 * Get appropriate status for a task when timer is stopped
 */
export function getStatusAfterTimerStop(
  markAsCompleted: boolean = false
): TaskStatusType {
  if (markAsCompleted) {
    return TaskStatus.COMPLETED;
  }

  // Default to PENDING for non-completed tasks when timer stops
  // This ensures tasks don't stay in ACTIVE/PAUSED state without a timer
  return TaskStatus.PENDING;
}

/**
 * Get appropriate status for a task when timer is started
 */
export function getStatusOnTimerStart(): TaskStatusType {
  // Tasks should be ACTIVE when timer is running
  return TaskStatus.ACTIVE;
}

/**
 * Get appropriate status for a task when timer is paused
 */
export function getStatusOnTimerPause(): TaskStatusType {
  // Tasks should be PAUSED when timer is paused
  return TaskStatus.PAUSED;
}

/**
 * Get display configuration for a task status
 */
export function getStatusDisplayConfig(status: TaskStatusType) {
  return (
    STATUS_DISPLAY_CONFIG[status] || STATUS_DISPLAY_CONFIG[TaskStatus.PENDING]
  );
}

/**
 * Get color classes for task status badge
 */
export function getStatusBadgeClasses(status: TaskStatusType): string {
  const config = getStatusDisplayConfig(status);
  return `${config.bgColor} ${config.color}`;
}
