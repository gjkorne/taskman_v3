import { Task } from '../../types/task';
import { TaskCard } from './TaskCard';

interface GridViewProps {
  tasks: Task[];
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTimerStateChange?: () => void;
}

export function GridView({ tasks, onEdit, onDelete, onTimerStateChange }: GridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          onTimerStateChange={onTimerStateChange}
        />
      ))}
    </div>
  );
}
