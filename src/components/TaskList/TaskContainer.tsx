import { Task } from '../../types/task';
import { TaskFilter } from './FilterPanel';
import { TaskCard } from './TaskCard';

interface TaskContainerProps {
  tasks: Task[];
  isLoading: boolean;
  viewMode: TaskFilter['viewMode'];
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskContainer({
  tasks,
  isLoading,
  viewMode,
  onStatusChange,
  onEdit,
  onDelete
}: TaskContainerProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-200 rounded-full mb-2"></div>
          <div className="h-4 w-24 bg-blue-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <svg 
            className="h-12 w-12 text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
        <p className="mt-2 text-gray-500">Create your first task to get started.</p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          updateTaskStatus={onStatusChange}
        />
      ))}
    </div>
  );
}
