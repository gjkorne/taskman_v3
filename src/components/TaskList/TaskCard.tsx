import { useState } from 'react';
import { format } from 'date-fns';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TaskActions } from './TaskActions';
import { StatusBadge } from './StatusBadge';
import { getTaskCategory } from '../../lib/categoryUtils';
import { getPriorityBorderColor, getDueDateStyling } from '../../lib/taskUtils';

// Task interface
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_time: string | null;
  tags: string[] | null;
  created_at: string;
  created_by: string;
  category?: string | number;
  category_name?: string;
  subcategory?: string;
};

interface TaskCardProps {
  task: Task;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, updateTaskStatus }: TaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const category = getTaskCategory(task);

  // Get the color for the ellipsis menu based on category
  const getCategoryColor = () => {
    switch(category) {
      case 'work': return 'text-green-600'; // Bold green
      case 'personal': return 'text-blue-600'; // Bold blue
      case 'childcare': return 'text-cyan-600'; // Bold cyan
      default: return 'text-gray-600'; // Bold gray
    }
  };

  return (
    <div 
      className={cn(
        "relative flex flex-col p-4 rounded-lg shadow-sm transition-all",
        "hover:shadow-md mb-2 border border-gray-200 bg-white"
      )}
    >
      {/* Due Date - top right */}
      {task.due_date && (
        <div className="absolute right-2 top-2 z-20">
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
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <MoreVertical className={cn("h-6 w-6", getCategoryColor())} />
        </button>
        
        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div 
            className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-30"
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <button
              onClick={() => {
                onEdit(task.id);
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onDelete(task.id);
                setIsMenuOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      
      {/* Status Badge - middle right */}
      <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
        <StatusBadge status={task.status} />
      </div>
      
      {/* Task Title - Prominent in top left */}
      <h3 className={cn(
        "absolute left-3 top-3 text-left z-10 font-bold text-lg max-w-[55%] truncate shadow-sm px-3 py-1 rounded-r-lg bg-white",
        "border-l-4",
        getPriorityBorderColor(task.priority)
      )}>
        {task.title}
      </h3>
      
      {/* Task Description */}
      <div className="mt-12 mb-14 text-gray-600 text-sm">
        {task.description || <span className="text-gray-400 italic">No description</span>}
      </div>
      
      {/* Task Actions and Date */}
      <div className="absolute bottom-3 w-full pr-8 left-0 px-4 flex justify-between items-center">
        {/* Action buttons - bottom left */}
        <TaskActions 
          taskId={task.id}
          status={task.status}
          updateTaskStatus={updateTaskStatus}
        />
        
        {/* Date information - bottom right */}
        <div className="text-xs text-gray-500 flex flex-col items-end">
          <span>Created: {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
}
