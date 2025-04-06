import React from 'react';
import { useTasks } from '../../contexts/tasks/TasksContext';
import { TaskStatus } from '../../types/task';
import { List, ListItem } from '../UI/base/List';
import { Box } from '../UI/base/Box';
import { Button } from '../UI/base/Button';
import { Card } from '../UI/base/Card';
import { TaskCard } from './TaskCard';
import { withDensity, WithDensityProps } from '../UI/hoc/withDensity';

interface TaskListProps extends WithDensityProps {
  filter?: Record<string, any>;
}

const TaskListBase: React.FC<TaskListProps> = ({ 
  filter, 
  densityLevel,
  densitySpacing 
}) => {
  const { tasks, isLoading, error, deleteTask, updateTask } = useTasks();
  
  // Handle completing a task
  const handleCompleteTask = (taskId: string) => {
    updateTask(taskId, { status: TaskStatus.COMPLETED });
  };
  
  // Handle deleting a task
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };
  
  // In a real component, we would use the filter
  const filteredTasks = filter ? tasks.filter(task => {
    // Apply filters
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.status && task.status !== filter.status) return false;
    return true;
  }) : tasks;

  // Apply density-based styling
  const containerStyle = {
    padding: densitySpacing.padding,
    fontSize: densitySpacing.fontSize,
  };
  
  // Density-specific class
  const densityClass = `density-${densityLevel}`;

  if (isLoading) {
    return (
      <Card className={`task-list-loader ${densityClass}`} style={containerStyle}>
        <div className="loading-spinner">Loading tasks...</div>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={`task-list-error ${densityClass}`} elevation={2} style={containerStyle}>
        <div className="error-message">
          <h3>Error Loading Tasks</h3>
          <p>{error.message}</p>
          <Button 
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Box className={`task-list-container ${densityClass}`} style={containerStyle}>
      <Card 
        title="Tasks" 
        headerActions={
          <Button 
            variant="primary" 
            size="small"
          >
            New Task
          </Button>
        }
      >
        {filteredTasks.length === 0 ? (
          <Box className="empty-state">
            <p>No tasks found</p>
            <Button variant="secondary">Create your first task</Button>
          </Box>
        ) : (
          <List hoverable divided>
            {filteredTasks.map(task => (
              <ListItem
                key={task.id}
                className={`task-item-${task.status}`}
                active={task.status === TaskStatus.ACTIVE}
                selected={false}
                disabled={task.is_deleted}
              >
                <TaskCard 
                  task={task}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onEdit={(id) => console.log('Edit task', id)}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    </Box>
  );
};

// Wrap with density HOC
export const TaskList = withDensity(TaskListBase);
