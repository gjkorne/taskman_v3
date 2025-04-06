import React from 'react';
import { useTasks } from '../../contexts/tasks/TasksContext';
import { Task, TaskStatus } from '../../types/task';

interface TaskListProps {
  filter?: Record<string, any>;
}

export const TaskList: React.FC<TaskListProps> = ({ filter }) => {
  const { tasks, isLoading, error } = useTasks();
  
  // In a real component, we would use the filter
  const filteredTasks = filter ? tasks.filter(task => {
    // Apply filters
    if (filter.priority && task.priority !== filter.priority) return false;
    if (filter.status && task.status !== filter.status) return false;
    return true;
  }) : tasks;

  if (isLoading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="task-list">
      <h2>Tasks</h2>
      {filteredTasks.length === 0 ? (
        <p>No tasks found</p>
      ) : (
        <ul>
          {filteredTasks.map(task => (
            <li key={task.id} className="task-item">
              <div className="task-header">
                <h3>{task.title}</h3>
                <span className={`priority ${task.priority}`}>{task.priority}</span>
              </div>
              <p>{task.description}</p>
              <div className="task-footer">
                <span className={`status ${task.status}`}>{task.status}</span>
                {task.due_date && (
                  <span className="due-date">Due: {new Date(task.due_date).toLocaleDateString()}</span>
                )}
                <div className="task-actions">
                  <button 
                    onClick={() => {/* Complete functionality would go here */}}
                    disabled={task.status === TaskStatus.COMPLETED}
                  >
                    Complete
                  </button>
                  <button onClick={() => {/* Delete functionality would go here */}}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
