import { useQuery } from '@tanstack/react-query';
import { DashboardWidget } from './DashboardWidget';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useTaskData } from '../../contexts/task';
import { formatDistanceToNow, isValid } from 'date-fns';
import { TASK_QUERY_KEYS } from '../../contexts/task/TaskDataContext';
import { Link } from 'react-router-dom';

interface RecentTasksWidgetProps {
  title?: string;
  limit?: number;
}

/**
 * RecentTasksWidget - Shows the most recently created or updated tasks
 * Uses React Query optimized task data
 */
export function RecentTasksWidget({
  title = 'Recent Tasks',
  limit = 5,
}: RecentTasksWidgetProps) {
  const { tasks } = useTaskData();

  // Use React Query for recent tasks
  const { data: recentTasks, isLoading } = useQuery({
    queryKey: [...TASK_QUERY_KEYS.metrics(), 'recent-tasks'],
    queryFn: () => getRecentTasks(tasks, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Use the local data we already have
    enabled: tasks.length > 0,
  });

  // Format time for display with relative times
  const formatTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Unknown date';

    try {
      const date = new Date(dateString);
      if (!isValid(date)) return 'Invalid date';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <DashboardWidget
      title={title}
      isLoading={isLoading}
      className="col-span-1 md:col-span-2"
      footer={
        <Link
          to="/tasks"
          className="text-taskman-blue-600 text-sm hover:underline flex items-center"
        >
          View all tasks <span className="ml-1">→</span>
        </Link>
      }
    >
      <div className="space-y-1">
        {(!recentTasks || recentTasks.length === 0) && !isLoading && (
          <div className="text-center py-3 text-gray-500 text-sm">
            No recent tasks found
          </div>
        )}

        {recentTasks &&
          recentTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center border-b border-gray-100 py-1.5 last:border-0"
            >
              <div className="mr-2 flex-shrink-0">
                {task.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-taskman-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex items-center">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/tasks/${task.id}`}
                    className="text-gray-800 font-medium hover:text-taskman-blue-600 truncate block text-sm"
                  >
                    {task.title}
                  </Link>
                </div>
                <div className="text-xs text-gray-500 ml-2 flex items-center space-x-2 whitespace-nowrap">
                  <span>{formatTime(task.updatedAt || task.createdAt)}</span>
                  {task.category && (
                    <span className="px-2 py-0.5 rounded-full bg-gray-100">
                      {task.category.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </DashboardWidget>
  );
}

/**
 * Helper function to get recent tasks
 * @param tasks All tasks
 * @param limit Number of tasks to return
 * @returns Array of recent tasks
 */
const getRecentTasks = (tasks: any[], limit: number) => {
  return [...tasks]
    .filter((task) => task && (task.updatedAt || task.createdAt)) // Filter out tasks with no dates
    .sort((a, b) => {
      try {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);

        if (!isValid(dateA) || !isValid(dateB)) return 0;
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        return 0; // In case of error, don't change order
      }
    })
    .slice(0, limit);
};

export default RecentTasksWidget;
