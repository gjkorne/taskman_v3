import React from 'react';
import { Button } from '../UI/base/Button';
import { TaskStatus } from '../../types/task';
import { CompleteButton } from '../tasks/TaskStatusButtons';

interface TaskActionsProps {
  taskId: string;
  status: TaskStatus;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Component for displaying task action buttons (complete, edit, delete)
 * Uses the standardized CompleteButton for consistent status management
 */
export const TaskActions: React.FC<TaskActionsProps> = ({
  taskId,
  status,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex space-x-2">
      <CompleteButton taskId={taskId} status={status} variant="compact" />
      
      {onEdit && (
        <Button
          onClick={onEdit}
          variant="secondary"
          size="small"
          title="Edit task"
        >
          Edit
        </Button>
      )}
      
      {onDelete && (
        <Button
          onClick={onDelete}
          variant="danger"
          size="small"
          title="Delete task"
        >
          Delete
        </Button>
      )}
    </div>
  );
};