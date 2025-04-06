import React from 'react';
import { Card } from '../UI/base/Card';
import { Box } from '../UI/base/Box';
import { Button } from '../UI/base/Button';
import { Task, TaskStatus } from '../../types/task';
import { withDensity, WithDensityProps } from '../UI/hoc/withDensity';

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
        <Button
          onClick={() => onComplete(task.id)}
          variant="success"
          size="small"
          title="Mark as complete"
        >
          Complete
        </Button>
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
  
  // Generate the priority badge with appropriate styling
  const PriorityBadge = () => {
    const priorityClass = `priority-badge priority-${task.priority.toLowerCase()}`;
    
    return (
      <span className={priorityClass} style={{ padding: densitySpacing.padding }}>
        {task.priority}
      </span>
    );
  };
  
  // Generate status badge with appropriate styling
  const StatusBadge = () => {
    const statusClass = `status-badge status-${task.status.toLowerCase()}`;
    
    return (
      <span className={statusClass} style={{ padding: densitySpacing.padding }}>
        {task.status}
      </span>
    );
  };
  
  return (
    <Card
      title={task.title}
      headerActions={headerActions}
      bordered
      hoverable
      className={`task-card ${isCompleted ? 'task-completed' : ''} ${densityClass}`}
      elevation={1}
      style={cardStyle}
    >
      <Box className="task-card-content">
        {task.description && (
          <div className="task-description">
            {task.description}
          </div>
        )}
        
        <div className="task-metadata">
          <div className="task-badges">
            <PriorityBadge />
            <StatusBadge />
          </div>
          
          {task.due_date && (
            <div className="task-due-date">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
          
          {task.category_name && (
            <div className="task-category">
              Category: {task.category_name}
            </div>
          )}
          
          {task.tags && task.tags.length > 0 && (
            <div className="task-tags">
              {task.tags.map((tag, index) => (
                <span key={index} className="task-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Box>
    </Card>
  );
};

// Wrap with density HOC to create a density-aware component
export const TaskCard = withDensity(TaskCardBase);
