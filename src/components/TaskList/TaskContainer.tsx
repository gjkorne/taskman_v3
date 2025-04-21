import { Task } from '../../types/task';
import { useTaskGrouping } from '../../hooks/useTaskGrouping';
import { TaskContainerView } from './TaskContainerView';

interface TaskContainerProps {
  tasks: Task[];
  isLoading: boolean;
  viewMode?: 'list' | 'grid';
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTimerStateChange?: () => void;
}

export function TaskContainer({
  tasks,
  isLoading,
  viewMode,
  onEdit,
  onDelete,
  onTimerStateChange,
}: TaskContainerProps) {
  const groupedTasks = useTaskGrouping(tasks);
  return (
    <TaskContainerView
      tasks={tasks}
      groupedTasks={groupedTasks}
      isLoading={isLoading}
      viewMode={viewMode}
      onEdit={onEdit}
      onDelete={onDelete}
      onTimerStateChange={onTimerStateChange}
    />
  );
}
