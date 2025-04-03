import { useState } from 'react';
import { format } from 'date-fns';
import { MoreVertical, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TaskActions } from './TaskActions';
import { 
  getTaskCategory, 
  getTaskCategoryInfo, 
  getCategoryColorStyle 
} from '../../lib/categoryUtils';
import { getPriorityBorderColor, getDueDateStyling, formatEstimatedTime } from '../../lib/taskUtils';
import { Task, TaskStatus, TaskStatusType } from '../../types/task';
import { TimerControls } from '../Timer/TimerControls';
import { useTimer } from '../../contexts/TimerContext';
import { useTaskActions } from '../../hooks/useTaskActions';
import { useCategories } from '../../contexts/CategoryContext';
import { useTaskContext } from '../../contexts/TaskContext';
import NotesViewer from '../TaskNotes/NotesViewer';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTimerStateChange?: () => void;
}

export function TaskCard({ task, index, onEdit, onDelete, onTimerStateChange }: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { categories } = useCategories();
  const { timerState, stopTimer } = useTimer();
  const { refreshTasks } = useTaskContext();
  const { updateTaskStatus } = useTaskActions({
    refreshTasks,
    onSuccess: () => {
      // If we wanted to show a success message or trigger side effects
    },
    onError: (error) => {
      console.error('Task action failed:', error);
      // Could display an error toast here
    }
  });
  
  // Get category information from the task
  const categoryName = getTaskCategory(task);
  const { id: categoryId } = getTaskCategoryInfo(task, categories);
  
  // Get the color for the ellipsis menu based on category
  const getCategoryColor = () => {
    const categoryStyle = getCategoryColorStyle(categoryName, categoryId, categories);
    return categoryStyle.text;
  };

  // Handle status change with proper type conversion
  const handleStatusChange = async (taskId: string, newStatus: TaskStatusType) => {
    // Validate parameters received
    if (!taskId || typeof taskId !== 'string' || 
        !taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('TaskCard: Invalid task ID format received:', taskId);
      return;
    }
    
    // Convert TaskStatusType (string literal) to TaskStatus (enum)
    let statusEnum: TaskStatus;
    switch(newStatus) {
      case 'active':
        statusEnum = TaskStatus.ACTIVE;
        break;
      case 'pending':
        statusEnum = TaskStatus.PENDING;
        break;
      case 'in_progress':
        statusEnum = TaskStatus.IN_PROGRESS;
        break;
      case 'completed':
        statusEnum = TaskStatus.COMPLETED;
        if (timerState.taskId === taskId && timerState.status !== 'idle') {
          await stopTimer(TaskStatus.COMPLETED);
          return; 
        }
        break;
      case 'archived':
        statusEnum = TaskStatus.ARCHIVED;
        if (timerState.taskId === taskId && timerState.status !== 'idle') {
          await stopTimer(TaskStatus.ARCHIVED);
          return;
        }
        break;
      default:
        console.error('TaskCard: Invalid status value received:', newStatus);
        return;
    }
    
    await updateTaskStatus(taskId, statusEnum);
    await refreshTasks();
  };

  // Handle task editing and deletion
  const handleEdit = () => {
    if (onEdit) {
      onEdit(task.id);
      setIsMenuOpen(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id);
      setIsMenuOpen(false);
    }
  };

  // Get priority colors and styles
  const priorityColor = getPriorityBorderColor(task.priority);
  const dueDateStyle = task.due_date ? getDueDateStyling(task.due_date) : null;

  return (
    <div 
      className={cn(
        "group relative flex flex-col sm:flex-row py-1 sm:py-2 px-2 sm:px-3 border-b border-gray-100 transition-colors",
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
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-500">
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
            status={task.status as TaskStatusType} 
            updateTaskStatus={handleStatusChange}
          />
        </div>
        
        {/* Menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <MoreVertical className={`h-4 w-4 ${getCategoryColor()}`} />
        </button>
        
        {/* Menu popup */}
        {isMenuOpen && (
          <div className="absolute top-full right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10 py-1">
            <button
              onClick={handleEdit}
              className="block w-full text-left px-4 py-1 text-sm text-gray-700 hover:bg-gray-100"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="block w-full text-left px-4 py-1 text-sm text-red-600 hover:bg-gray-100"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
