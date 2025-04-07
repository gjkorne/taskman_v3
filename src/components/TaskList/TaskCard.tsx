import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TaskActions } from './TaskActions';
import { 
  getTaskCategory, 
  getTaskCategoryInfo,
} from '../../lib/categoryUtils';
import { getPriorityBorderColor, getDueDateStyling, formatEstimatedTime } from '../../lib/taskUtils';
import { Task, TaskStatus } from '../../types/task';
import { TimerControls } from '../Timer/TimerControls';
import { useCategories } from '../../contexts/CategoryCompat';
import NotesViewer from '../TaskNotes/NotesViewer';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTimerStateChange?: () => void;
}

export function TaskCard({ task, index, onEdit, onDelete, onTimerStateChange }: TaskCardProps) {
  const { categories } = useCategories();
  
  // Get category information from the task
  const categoryName = getTaskCategory(task);
  const { id: _ } = getTaskCategoryInfo(task, categories);

  /**
   * Helper to get a formatted display of the task's status
   */
  const getStatusDisplay = (status: string) => {
    // Replace underscores with spaces and capitalize each word
    return status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  /**
   * Get CSS classes for status badge
   */
  const getStatusBadgeClasses = (status: string) => {
    switch(status) {
      case TaskStatus.ACTIVE:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.ARCHIVED:
        return 'bg-purple-100 text-purple-800';
      case TaskStatus.PAUSED:
        return 'bg-orange-100 text-orange-800';
      case TaskStatus.PENDING:
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Handle task editing
  const handleEdit = () => {
    if (onEdit) {
      onEdit(task.id);
    }
  };

  // Determine priority color for the task
  const priorityColor = getPriorityBorderColor(task.priority);
  
  // Get styling for due date (overdue, etc)
  const dueDateStyle = task.due_date ? getDueDateStyling(task.due_date) : null;
  
  // Convert TaskStatus enum to TaskStatusType string
  const statusAsType = task.status.toLowerCase() as any;
  
  return (
    <div 
      className={cn(
        "flex p-3 sm:p-4 flex-col sm:flex-row group relative", // Base card styling
        "border-b border-gray-200", // Bottom border
        `border-l-2 ${priorityColor}`,  // Thin priority indicator
        index % 2 === 1 ? "bg-gray-50" : "bg-white",  // Alternating row colors
        "hover:bg-gray-100 cursor-pointer" // Darken hover state for better contrast and add pointer cursor
      )}
      onClick={handleEdit} // Make the entire card clickable to edit
    >
      {/* Left Section: Title and Metadata */}
      <div className="flex-grow min-w-0 mb-0.5 sm:mb-0">
        {/* Title and Category Row */}
        <div className="flex items-center mb-0.5 sm:mb-1">
          <h3 className="font-bold text-base truncate mr-1 sm:mr-2 max-w-[70%]">
            {task.title}
          </h3>
          
          {/* Category tag */}
          {categoryName && (
            <span className="px-1 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700 flex-shrink-0">
              {categoryName}
            </span>
          )}
        </div>
        
        {/* Metadata Row */}
        <div className="flex items-center flex-wrap gap-1 sm:gap-2 text-xs text-gray-500">
          {/* Status badge */}
          <span className={cn(
            "px-1.5 py-0.5 rounded-full font-medium",
            getStatusBadgeClasses(task.status)
          )}>
            {getStatusDisplay(task.status)}
          </span>
          
          {/* Estimated time if available */}
          {task.estimated_time && (
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-0.5 text-gray-400" />
              {formatEstimatedTime(task.estimated_time)}
            </span>
          )}
          
          {/* Due date if available */}
          {task.due_date && (
            <span className={cn(
              "px-1 py-0.5 rounded-full", 
              dueDateStyle?.className
            )}>
              Due: {format(new Date(task.due_date), 'MM/dd')}
            </span>
          )}
        </div>
        
        {/* Task notes/list if present */}
        {task.description && (
          <div className="mt-1 sm:mt-2">
            <NotesViewer 
              value={task.description} 
              maxLength={100} 
              maxListItems={3}
              className="mt-0.5 sm:mt-1"
            />
          </div>
        )}
      </div>
      
      {/* Right Section: All Actions */}
      <div 
        className="flex items-center justify-end space-x-1 sm:space-x-2 ml-auto"
        onClick={(e) => e.stopPropagation()} // Prevent clicks on actions from opening edit form
      >
        {/* Timer control */}
        {task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.ARCHIVED && (
          <div className="flex-shrink-0">
            <TimerControls 
              taskId={task.id}
              compact={true}
              onTimerStateChange={onTimerStateChange}
              className="scale-90"
            />
          </div>
        )}
        
        {/* Task action buttons */}
        <div className="flex-shrink-0 scale-90">
          <TaskActions 
            taskId={task.id} 
            status={statusAsType}
            onDelete={onDelete ? () => onDelete(task.id) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
