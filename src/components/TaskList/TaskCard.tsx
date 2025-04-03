import { useState } from 'react';
import { format } from 'date-fns';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TaskActions } from './TaskActions';
import { TaskCardDetails } from './TaskCardDetails';
import { 
  getTaskCategory, 
  getTaskCategoryInfo, 
  getCategoryColorStyle 
} from '../../lib/categoryUtils';
import { getPriorityBorderColor, getDueDateStyling } from '../../lib/taskUtils';
import { Task, TaskStatus, TaskStatusType } from '../../types/task';
import { TimerControls } from '../Timer/TimerControls';
import { useTimer } from '../../contexts/TimerContext';
import { useTaskActions } from '../../hooks/useTaskActions';
import { useCategories } from '../../contexts/CategoryContext';
import { useTaskContext } from '../../contexts/TaskContext';

interface TaskCardProps {
  task: Task;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTimerStateChange?: () => void;
}

export function TaskCard({ task, onEdit, onDelete, onTimerStateChange }: TaskCardProps) {
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

  // Handle status change - Corrected signature with proper type conversion
  const handleStatusChange = async (taskId: string, newStatus: TaskStatusType) => {
    // Explicitly log parameters to debug
    console.log('TaskCard: handleStatusChange called with:', { taskId, newStatus });
    
    // Validate parameters received
    if (!taskId || typeof taskId !== 'string' || 
        !taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('TaskCard: Invalid task ID format received:', taskId);
      return;
    }
    
    // Convert TaskStatusType (string literal) to TaskStatus (enum)
    // This addresses the type mismatch when calling updateTaskStatus
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
        // If this task is being timed, stop the timer
        if (timerState.taskId === taskId && timerState.status !== 'idle') {
          console.log('Task is being timed and marked as completed. Stopping timer.');
          // Use the stopTimer from TimerContext with the COMPLETED status
          await stopTimer(TaskStatus.COMPLETED);
          return; // stopTimer already updates the task status
        }
        break;
      case 'archived':
        statusEnum = TaskStatus.ARCHIVED;
        // If this task is being timed, stop the timer
        if (timerState.taskId === taskId && timerState.status !== 'idle') {
          console.log('Task is being timed and marked as archived. Stopping timer.');
          await stopTimer(TaskStatus.ARCHIVED);
          return; // stopTimer already updates the task status
        }
        break;
      default:
        console.error('TaskCard: Invalid status value received:', newStatus);
        return;
    }
    
    // Call the hook's updateTaskStatus with the properly converted enum
    await updateTaskStatus(taskId, statusEnum);
    
    // Force a refresh of the task list
    await refreshTasks();
  };

  // Handle task editing
  const handleEdit = () => {
    if (onEdit) {
      onEdit(task.id);
      setIsMenuOpen(false);
    }
  };

  // Handle task deletion
  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id);
      setIsMenuOpen(false);
    }
  };

  // Get priority border color for task
  const priorityColor = getPriorityBorderColor(task.priority);

  return (
    <div 
      className={cn(
        "relative flex flex-col p-5 rounded-lg shadow-sm transition-all",
        "hover:shadow-md mb-3 border border-gray-200 bg-white",
        `border-l-4 ${priorityColor}`  // Apply priority color to entire left border
      )}
    >
      {/* Created Date - top right */}
      <div className="absolute right-2 top-2 z-20 text-xs text-gray-500">
        <span>Created: {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
      </div>
      
      {/* Due Date - below created date */}
      {task.due_date && (
        <div className="absolute right-2 top-6 z-20">
          <span className={cn(getDueDateStyling(task.due_date).className, "text-xs flex items-center")}>
            Due: {format(new Date(task.due_date), 'MMM d')}
            {getDueDateStyling(task.due_date).urgencyText && (
              <span className="ml-1">{getDueDateStyling(task.due_date).urgencyText}</span>
            )}
          </span>
        </div>
      )}
      
      {/* Dropdown Menu Button - middle right */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
        >
          <MoreVertical className={cn("h-5 w-5", getCategoryColor())} />
        </button>
        
        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div 
            className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-30"
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <button
              onClick={handleEdit}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-150"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-150 text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      
      {/* Task Title - Prominent in top left */}
      <h3 className={cn(
        "absolute left-3 top-3 text-left z-10 font-bold text-lg max-w-[55%] truncate shadow-sm px-3 py-1 rounded-r-lg bg-white",
      )}>
        {task.title}
      </h3>
      
      {/* Task Description - Using our reusable component */}
      <div className="mt-14 mb-14">
        <TaskCardDetails 
          task={task} 
          isActive={task.status === 'active'} 
        />
      </div>
      
      {/* Task Actions and Timer Controls */}
      <div className="absolute bottom-3 w-full pr-8 left-0 px-4 flex justify-between items-center">
        {/* Timer controls - bottom left */}
        <div className="flex items-center space-x-2">
          {task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.ARCHIVED && (
            <TimerControls 
              taskId={task.id} 
              compact={true}
              onTimerStateChange={onTimerStateChange}
            />
          )}
        </div>
        
        {/* Action buttons - bottom right */}
        <TaskActions 
          taskId={task.id}
          status={task.status}
          updateTaskStatus={handleStatusChange}
        />
      </div>
    </div>
  );
}
