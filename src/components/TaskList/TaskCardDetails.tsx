import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  formatEstimatedTime,
  getEstimatedTimeClass,
} from '../../lib/taskUtils';
import { Task } from '../../types/task';

interface TaskCardDetailsProps {
  task: Task;
  isActive?: boolean;
  className?: string;
  hideCreatedDate?: boolean;
}

export function TaskCardDetails({
  task,
  isActive = false,
  className,
  hideCreatedDate = false,
}: TaskCardDetailsProps) {
  return (
    <div className={cn('text-gray-600 text-sm', className)}>
      {task.description ? (
        <p className="line-clamp-2">{task.description}</p>
      ) : (
        <span className="text-gray-400 italic">No description</span>
      )}

      {/* Estimated Time Display */}
      {task.estimated_time && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1 text-gray-400" />
              <span
                className={cn(
                  'text-xs',
                  getEstimatedTimeClass(task.estimated_time)
                )}
              >
                Est. {formatEstimatedTime(task.estimated_time)}
              </span>
            </div>
            {isActive && (
              <span className="text-xs text-indigo-500 animate-pulse font-medium">
                In Progress
              </span>
            )}
          </div>

          {/* Time Indicator Bar */}
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                task.estimated_time &&
                  getEstimatedTimeClass(task.estimated_time).includes('green')
                  ? 'bg-green-400'
                  : task.estimated_time &&
                    getEstimatedTimeClass(task.estimated_time).includes('blue')
                  ? 'bg-blue-400'
                  : task.estimated_time &&
                    getEstimatedTimeClass(task.estimated_time).includes('amber')
                  ? 'bg-amber-400'
                  : 'bg-red-400',
                task.status === 'completed'
                  ? 'w-full'
                  : task.status === 'active'
                  ? 'w-1/2 animate-pulse'
                  : 'w-0'
              )}
            />
          </div>
        </div>
      )}

      {/* Created Date - conditionally rendered based on the hideCreatedDate prop */}
      {!hideCreatedDate && (
        <div className="text-xs text-gray-500 mt-1">
          <span>
            Created: {format(new Date(task.created_at), 'MMM d, yyyy')}
          </span>
        </div>
      )}
    </div>
  );
}
