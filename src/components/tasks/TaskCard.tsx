import React from 'react';
import { Card } from '../UI/base/Card';
import { Box } from '../UI/base/Box';
import { Button } from '../UI/base/Button';
import { Task, TaskStatus } from '../../types/task';
import { withDensity, WithDensityProps } from '../UI/hoc/withDensity';
import { CompleteButton } from './TaskStatusButtons';

/**
 * Props for the TaskCard component
 */
interface TaskCardProps extends WithDensityProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

/**
 * A density-aware card for displaying task information
 * Demonstrates using the density components in a real application component
 */
const TaskCardBase: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onEdit,
  onDelete,
  densityLevel,
  densitySpacing
}) => {
  const isCompleted = task.status === TaskStatus.COMPLETED;
  
  // Apply density-based styling
  const cardStyle = {
    fontSize: densitySpacing.fontSize,
    margin: densitySpacing.margin,
  };
  
  // Density-specific class
  const densityClass = `density-${densityLevel}`;
  
  // Create header actions for the card
  const headerActions = (
    <div className="task-card-actions">
      {!isCompleted && onComplete && (
        <CompleteButton
          taskId={task.id}
          status={task.status}
          variant="compact"
        />
      )}
      
      {onEdit && (
        <Button
          onClick={() => onEdit(task.id)}
          variant="secondary"
          size="small"
          title="Edit task"
        >
          Edit
        </Button>
      )}
      
      {onDelete && (
        <Button
          onClick={() => onDelete(task.id)}
          variant="danger"
          size="small"
          title="Delete task"
        >
          Delete
        </Button>
      )}
    </div>
  );
  
  return (
    <Card
      className={`task-card ${densityClass} ${isCompleted ? 'line-through text-gray-500' : ''}`}
      style={cardStyle}
      title={task.title}
      headerActions={headerActions}
      bordered
      hoverable
    >
      <Box
        className={`task-content ${densityClass}`}
        style={{ padding: densitySpacing.padding }}
      >
        {task.description && (
          <div className={`task-description ${isCompleted ? 'text-gray-500' : ''}`}>
            {task.description}
          </div>
        )}
        
        <div className="task-metadata">
          <div className="task-status">
            Status: <span className={`status-${task.status.toLowerCase()}`}>
              {task.status}
            </span>
          </div>
          
          {task.due_date && (
            <div className="task-due-date">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
          
          {task.priority && (
            <div className={`task-priority priority-${task.priority.toLowerCase()}`}>
              Priority: {task.priority}
            </div>
          )}
        </div>
      </Box>
    </Card>
  );
};

// Wrap with density HOC to create a density-aware component
export const TaskCard = withDensity(TaskCardBase);
