import { Task } from '../../types/task';
import { TaskSection } from './TaskSection';
import { useTaskCategories } from '../../hooks/useTaskCategories';

interface TaskContainerProps {
  tasks: Task[];
  isLoading: boolean;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTimerStateChange?: () => void;
}

// Utility to group tasks by category_name
function groupTasksByCategory(tasks: Task[]) {
  return tasks.reduce((acc: Record<string, Task[]>, task) => {
    const category = task.category_name || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);
}

export function TaskContainer({
  tasks,
  isLoading,
  onEdit,
  onDelete,
  onTimerStateChange
}: TaskContainerProps) {
  // Loading state indicator
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

  // Empty state indicator
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="rounded-full bg-gray-100 p-3 mb-3">
          <svg className="h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
        <p className="mt-2 text-gray-500">Create your first task to get started.</p>
      </div>
    );
  }

  // --- GROUP BY CATEGORY ---
  const groupedByCategory = groupTasksByCategory(tasks);
  const categoryNames = Object.keys(groupedByCategory);

  return (
    <div className="space-y-6">
      {categoryNames.map(category => (
        <TaskSection
          key={category}
          tasks={groupedByCategory[category]}
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
