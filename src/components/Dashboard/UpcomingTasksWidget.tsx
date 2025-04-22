import { useQuery } from '@tanstack/react-query';
import { DashboardWidget } from './DashboardWidget';
import { Calendar, Clock, Tag } from 'lucide-react';
import { useTaskData } from '../../contexts/task/TaskDataContext';
import {
  format,
  addDays,
  isBefore,
  isToday,
  isTomorrow,
  isThisWeek,
} from 'date-fns';
import { TASK_QUERY_KEYS } from '../../contexts/task/TaskDataContext';

interface UpcomingTasksWidgetProps {
  title?: string;
}

/**
 * UpcomingTasksWidget - Shows upcoming tasks sorted by due date
 * Uses our React Query optimized task data
 */
export function UpcomingTasksWidget({
  title = 'Upcoming Tasks',
}: UpcomingTasksWidgetProps) {
  const { tasks } = useTaskData();

  // Use React Query for upcoming tasks
  const { data: upcomingTasks, isLoading } = useQuery({
    queryKey: [...TASK_QUERY_KEYS.metrics(), 'upcoming-tasks'],
    queryFn: () => getUpcomingTasks(tasks),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Use the local data we already have
    enabled: tasks.length > 0,
  });

  // Format due date for display with relative times
  const formatDueDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE'); // Day name
    return format(date, 'MMM d'); // Month and day
  };

  // Show a visual indicator for task proximity
  const getDueDateIndicator = (date: Date) => {
    const now = new Date();
    if (isBefore(date, now)) {
      return <span className="w-2 h-2 bg-red-500 rounded-full"></span>;
    }
    if (isToday(date)) {
      return <span className="w-2 h-2 bg-amber-500 rounded-full"></span>;
    }
    if (isTomorrow(date)) {
      return <span className="w-2 h-2 bg-blue-500 rounded-full"></span>;
    }
    return <span className="w-2 h-2 bg-green-500 rounded-full"></span>;
  };

  return (
    <DashboardWidget
      title={title}
      isLoading={isLoading}
      className="col-span-1 md:col-span-2"
      footer={
        <div className="flex items-center justify-between">
          <span>Showing the next {upcomingTasks?.length || 0} tasks</span>
          <button className="text-indigo-600 hover:text-indigo-800">
            View all
          </button>
        </div>
      }
    >
      {upcomingTasks && upcomingTasks.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {upcomingTasks.map((task) => (
            <div
              key={task.id}
              className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  {getDueDateIndicator(new Date(task.due_date))}
                  <h3 className="ml-2 font-medium text-gray-800 line-clamp-1">
                    {task.title}
                  </h3>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  {task.priority && (
                    <span
                      className={`px-2 py-0.5 rounded-full mr-2 ${
                        task.priority === 'high' || task.priority === 'urgent'
                          ? 'bg-red-100 text-red-800'
                          : task.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {task.priority}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span className="mr-3">
                  {formatDueDate(new Date(task.due_date))}
                </span>

                {task.estimated_time && (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    <span className="mr-3">{task.estimated_time}</span>
                  </>
                )}

                {task.category_name && (
                  <>
                    <Tag className="h-3 w-3 mr-1" />
                    <span>{task.category_name}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-gray-500">No upcoming tasks</p>
          <button className="mt-2 text-sm text-indigo-600 font-medium">
            Create a task with a due date
          </button>
        </div>
      )}
    </DashboardWidget>
  );
}

// Helper function to get upcoming tasks
function getUpcomingTasks(tasks: any[]) {
  const now = new Date();
  const maxDate = addDays(now, 14); // Show tasks due in the next 14 days

  // Filter tasks that are not completed, not deleted, and have a due date
  const upcomingTasks = tasks
    .filter(
      (task) =>
        !task.is_deleted &&
        task.status !== 'completed' &&
        task.status !== 'archived' &&
        task.due_date
    )
    // Parse due dates to Date objects for comparison
    .map((task) => ({
      ...task,
      parsedDueDate: new Date(task.due_date),
    }))
    // Only include tasks due within our date range
    .filter((task) => isBefore(task.parsedDueDate, maxDate))
    // Sort by due date (closest first)
    .sort((a, b) => a.parsedDueDate.getTime() - b.parsedDueDate.getTime())
    // Limit to 10 tasks
    .slice(0, 10)
    // Remove our temporary parsed date field
    .map(({ parsedDueDate, ...task }) => task);

  return upcomingTasks;
}

export default UpcomingTasksWidget;
