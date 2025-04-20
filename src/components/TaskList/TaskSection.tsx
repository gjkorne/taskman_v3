import { Task } from '../../types/task';
import { TaskCard } from './TaskCard';
import {
  TASK_SECTION_STYLES,
  TaskSectionKey,
} from '../../constants/taskSectionStyles';

interface TaskSectionProps {
  tasks: Task[];
  sectionKey: TaskSectionKey;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTimerStateChange?: () => void;
  customTitle?: string;
}

/**
 * Reusable component to render a section of tasks with consistent styling
 */
export function TaskSection({
  tasks,
  sectionKey,
  onEdit,
  onDelete,
  onTimerStateChange,
  customTitle,
}: TaskSectionProps) {
  if (tasks.length === 0) return null;

  const { title, bgColor } = TASK_SECTION_STYLES[sectionKey] || {
    title: sectionKey,
    bgColor: 'bg-gray-200',
  };
  const displayTitle = customTitle || title;

  return (
    <div className="mb-6" key={displayTitle}>
      {/* Section header with count and styled background */}
      <div
        className={`flex items-center px-3 py-1.5 rounded-t-md ${bgColor} mb-1`}
      >
        <h2 className="text-sm font-semibold">
          {displayTitle}
          <span className="ml-2 px-1.5 py-0.5 bg-white bg-opacity-90 rounded-full text-xs">
            {tasks.length}
          </span>
        </h2>
      </div>

      {/* Container for the tasks */}
      <div className="px-4">
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
    </div>
  );
}
