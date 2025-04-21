import { Task } from '../../types/task';
import { TaskSection } from './TaskSection';

interface ListViewProps {
  tasks: Task[];
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTimerStateChange?: () => void;
}

export function ListView({ tasks, onEdit, onDelete, onTimerStateChange }: ListViewProps) {
  // We can opt to group or flatten; for now, group by category
  const grouped = {} as Record<string, Task[]>;
  tasks.forEach((task) => {
    const key = task.category_name || 'Uncategorized';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(task);
  });
  const categories = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <TaskSection
          key={category}
          tasks={grouped[category]}
          sectionKey={category as any}
          onEdit={onEdit}
          onDelete={onDelete}
          onTimerStateChange={onTimerStateChange}
          customTitle={category}
        />
      ))}
    </div>
  );
}
