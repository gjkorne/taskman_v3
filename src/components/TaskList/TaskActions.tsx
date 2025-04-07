import React from 'react';
import { TaskStatusType } from '../../types/task';
import { CompleteButton } from '../tasks/TaskStatusButtons';

interface TaskActionsProps {
  taskId: string;
  status: TaskStatusType;
}

/**
 * Component for displaying task action buttons (complete, edit, delete)
 * Uses the standardized CompleteButton for consistent status management
 */
export const TaskActions: React.FC<TaskActionsProps> = ({
  taskId,
  status,
}) => {
  return (
    <div className="flex space-x-2">
      <CompleteButton taskId={taskId} status={status} variant="compact" />
    </div>
  );
};