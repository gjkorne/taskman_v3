import { TaskStatus, TaskStatusType } from '../types/task';

/**
 * Task status utilities
 * Centralizes all task status related operations and validations
 */

// Map of valid status transitions
// This defines which status changes are permitted in the application
export const VALID_STATUS_TRANSITIONS: Record<TaskStatusType, TaskStatusType[]> = {
  [TaskStatus.PENDING]: [
    TaskStatus.ACTIVE,
    TaskStatus.COMPLETED,
    TaskStatus.ARCHIVED
  ],
  [TaskStatus.ACTIVE]: [
    TaskStatus.PENDING,
    TaskStatus.PAUSED,
    TaskStatus.COMPLETED,
    TaskStatus.ARCHIVED
  ],
  [TaskStatus.PAUSED]: [
    TaskStatus.PENDING,
    TaskStatus.ACTIVE,
    TaskStatus.COMPLETED,
    TaskStatus.ARCHIVED
  ],
  [TaskStatus.COMPLETED]: [
    TaskStatus.PENDING,
    TaskStatus.ACTIVE,
    TaskStatus.ARCHIVED
  ],
  [TaskStatus.ARCHIVED]: [
    TaskStatus.PENDING,
    TaskStatus.COMPLETED
  ]
};

// Status display configurations
export const STATUS_DISPLAY_CONFIG: Record<TaskStatusType, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  [TaskStatus.PENDING]: {
    label: 'Pending',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: 'clock'
  },
  [TaskStatus.ACTIVE]: {
    label: 'Active',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: 'play-circle'
  },
  [TaskStatus.PAUSED]: {
    label: 'Paused',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: 'pause-circle'
  },
  [TaskStatus.COMPLETED]: {
    label: 'Completed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: 'check-circle'
  },
  [TaskStatus.ARCHIVED]: {
    label: 'Archived',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: 'archive'
  }
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
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus) || false;
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
  return STATUS_DISPLAY_CONFIG[status] || STATUS_DISPLAY_CONFIG[TaskStatus.PENDING];
}

/**
 * Get color classes for task status badge
 */
export function getStatusBadgeClasses(status: TaskStatusType): string {
  const config = getStatusDisplayConfig(status);
  return `${config.bgColor} ${config.color}`;
}

/**
 * Determines the appropriate status for a task based on sessions data
 * @param currentStatus Current status of the task
 * @param hasSessions Whether the task has any time sessions
 * @param isCurrentlyTimed Whether the task is currently being timed
 * @returns Corrected task status
 */
export const determineStatusFromSessions = (
  currentStatus: TaskStatusType,
  hasSessions: boolean,
  isCurrentlyTimed: boolean
): TaskStatusType => {
  // Don't change completed or archived tasks
  if (currentStatus === TaskStatus.COMPLETED || currentStatus === TaskStatus.ARCHIVED) {
    return currentStatus;
  }
  
  // If currently being timed, task is active
  if (isCurrentlyTimed) {
    return TaskStatus.ACTIVE;
  }
  
  // Determine status based on sessions
  if (hasSessions) {
    return TaskStatus.PAUSED; // Tasks with sessions but not currently timed are paused
  } else {
    return TaskStatus.PENDING; // No sessions means pending
  }
}

/**
 * Validates a task status transition to prevent database constraint violations
 * @param currentStatus The current status of the task
 * @param newStatus The proposed new status
 * @returns Object with validation result and error message if any
 */
export const validateTaskStatus = (
  currentStatus: TaskStatusType,
  newStatus: TaskStatusType
): { isValid: boolean; errorMessage?: string } => {
  
  // 1. Check if newStatus is a valid TaskStatus value
  const validStatuses = Object.values(TaskStatus) as TaskStatusType[];
  if (!validStatuses.includes(newStatus)) {
    return { 
      isValid: false, 
      errorMessage: `Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}` 
    };
  }
  
  // 2. Check if the status transition is allowed
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedTransitions.includes(newStatus) && currentStatus !== newStatus) {
    return { 
      isValid: false, 
      errorMessage: `Cannot transition from ${currentStatus} to ${newStatus}` 
    };
  }
  
  return { isValid: true };
};

/**
 * Centralizes status change logic with validation
 * Use this function whenever changing a task's status to ensure database integrity
 */
export const changeTaskStatus = (
  task: { id: string; status: TaskStatusType }, 
  newStatus: TaskStatusType,
  updateFunction: (id: string, data: any) => Promise<any>
): Promise<any> => {
  
  // Validate the status transition
  const validation = validateTaskStatus(task.status, newStatus);
  if (!validation.isValid) {
    console.error(validation.errorMessage);
    return Promise.reject(new Error(validation.errorMessage));
  }
  
  // Format data for the update with current timestamp
  const updateData = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };
  
  // Perform the update using the provided function
  return updateFunction(task.id, updateData);
};
