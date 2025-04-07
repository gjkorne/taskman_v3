import { CheckCircle, PlayCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { TaskStatus, TaskStatusType } from '../../types/task';
import { useTaskStatusActions } from '../../hooks/useTaskStatusActions';
import { cn } from '../../lib/utils';

// Interface for the complete button props
interface CompleteButtonProps {
  taskId: string;
  status: TaskStatusType;
  variant?: 'default' | 'compact' | 'icon'; // Different visual variants
  className?: string;
}

/**
 * A standardized button for marking tasks as complete
 * Used across the application for consistent behavior and styling
 */
export function CompleteButton({ 
  taskId, 
  status, 
  variant = 'default',
  className 
}: CompleteButtonProps) {
  const { markTaskAsComplete } = useTaskStatusActions();
  
  // Only show for tasks that aren't already completed
  if (status === TaskStatus.COMPLETED || status === TaskStatus.ARCHIVED) {
    return null;
  }

  // Determine button text based on status
  const buttonText = status === TaskStatus.ACTIVE 
    ? "Complete" 
    : "Complete";
  
  // Icon-only variant
  if (variant === 'icon') {
    return (
      <button
        onClick={() => markTaskAsComplete(taskId, status)}
        className={cn(
          "rounded-full p-1.5 text-green-700 bg-green-100 hover:bg-green-200",
          "border border-green-200 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-green-500",
          className
        )}
        title="Mark task as complete"
      >
        <CheckCircle size={16} className="transition-transform hover:scale-110" />
      </button>
    );
  }
  
  // Compact variant - smaller with optional text
  if (variant === 'compact') {
    return (
      <button
        onClick={() => markTaskAsComplete(taskId, status)}
        className={cn(
          "rounded font-medium inline-flex items-center justify-center",
          "px-2 py-1 text-sm bg-green-100 hover:bg-green-200",
          "text-green-700 border border-green-200",
          "focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
          "shadow-sm transition-all duration-200 hover:shadow group",
          className
        )}
        title="Mark task as complete"
      >
        <CheckCircle size={16} className="transition-transform group-hover:scale-110" />
        <span className="ml-1.5 hidden sm:inline">Complete</span>
      </button>
    );
  }
  
  // Default full-sized button
  return (
    <Button 
      onClick={() => markTaskAsComplete(taskId, status)}
      variant="success"
      size="sm"
      icon={<CheckCircle size={16} className="transition-transform group-hover:scale-110" />}
      title="Mark task as complete"
      className={cn(
        "min-w-[130px] md:min-w-[130px] shadow-sm transition-all duration-200 hover:shadow group",
        className
      )}
    >
      <span className="hidden md:inline">
        {buttonText}
      </span>
    </Button>
  );
}

// Interface for the in-progress button props
interface InProgressButtonProps {
  taskId: string;
  status: TaskStatusType;
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
}

/**
 * A standardized button for marking tasks as in progress
 */
export function InProgressButton({ 
  taskId, 
  status, 
  variant = 'default',
  className 
}: InProgressButtonProps) {
  const { markTaskAsInProgress } = useTaskStatusActions();
  
  // Only show for tasks that can be moved to in-progress
  if (status !== TaskStatus.ACTIVE && status !== TaskStatus.PENDING) {
    return null;
  }
  
  // Icon-only variant
  if (variant === 'icon') {
    return (
      <button
        onClick={() => markTaskAsInProgress(taskId)}
        className={cn(
          "rounded-full p-1.5 text-blue-700 bg-blue-100 hover:bg-blue-200",
          "border border-blue-200 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500",
          className
        )}
        title="Mark task as in progress"
      >
        <PlayCircle size={16} className="transition-transform hover:scale-110" />
      </button>
    );
  }
  
  // Compact variant
  if (variant === 'compact') {
    return (
      <button
        onClick={() => markTaskAsInProgress(taskId)}
        className={cn(
          "rounded font-medium inline-flex items-center justify-center",
          "px-2 py-1 text-sm bg-blue-100 hover:bg-blue-200",
          "text-blue-700 border border-blue-200",
          "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "shadow-sm transition-all duration-200 hover:shadow group",
          className
        )}
        title="Mark task as in progress"
      >
        <PlayCircle size={16} className="transition-transform group-hover:scale-110" />
        <span className="ml-1.5 hidden sm:inline">In Progress</span>
      </button>
    );
  }
  
  // Default button implementation
  return (
    <Button 
      onClick={() => markTaskAsInProgress(taskId)}
      variant="primary"
      size="sm"
      icon={<PlayCircle size={16} className="transition-transform group-hover:scale-110" />}
      title="Mark task as in progress"
      className={cn(
        "min-w-[130px] md:min-w-[130px] shadow-sm transition-all duration-200 hover:shadow group",
        className
      )}
    >
      <span className="hidden md:inline">In Progress</span>
    </Button>
  );
}
