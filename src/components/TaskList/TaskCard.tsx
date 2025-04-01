import { useState } from 'react';
import { format } from 'date-fns';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

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

  // Get category color based on task id or assigned category
  const getCategoryStyle = (task: Task) => {
    // Use category_name or category if available
    if (task.category_name === 'work' || task.category === 'work' || task.category === 1) {
      return "border-l-green-500";
    } else if (task.category_name === 'personal' || task.category === 'personal' || task.category === 2) {
      return "border-l-blue-500";
    } else if (task.category_name === 'childcare' || task.category === 'childcare' || task.category === 3) {
      return "border-l-cyan-500";
    }
    
    // If no category, assign one based on task ID
    const taskIdNum = parseInt(task.id.replace(/-/g, '').substring(0, 8), 16);
    const categoryIndex = taskIdNum % 3;
    
    switch(categoryIndex) {
      case 0: return "border-l-green-500"; // Work
      case 1: return "border-l-blue-500";  // Personal
      case 2: return "border-l-cyan-500";  // Childcare
      default: return "border-l-gray-500";
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className={cn(
        "relative flex flex-col p-4 rounded-lg shadow-sm transition-all",
        "hover:shadow-md mb-2 border border-gray-200 bg-white"
      )}
    >
      {/* Dropdown Menu Button */}
      <div className="absolute right-2 top-2 z-20">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <MoreVertical className="h-4 w-4 text-gray-500" />
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
      
      {/* Status Badge - top right */}
      <div className="absolute right-10 top-3">
        <span className={cn(
          "px-2 py-1 text-xs rounded-full",
          getStatusColor(task.status)
        )}>
          {formatStatus(task.status)}
        </span>
      </div>
      
      {/* Task Title - Prominent in top left */}
      <h3 className={cn(
        "absolute left-3 top-3 text-left z-10 font-bold text-lg max-w-[65%] truncate shadow-sm px-3 py-1 rounded-r-lg bg-white",
        "border-l-4",
        getCategoryStyle(task)
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
        <div className="flex space-x-2">
          {task.status === 'pending' && (
            <button 
              onClick={() => updateTaskStatus(task.id, 'active')}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              title="Start task"
            >
              Start
            </button>
          )}
          {task.status === 'active' && (
            <>
              <button 
                onClick={() => updateTaskStatus(task.id, 'in_progress')}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded mr-1"
                title="Pause task"
              >
                Pause
              </button>
              <button 
                onClick={() => updateTaskStatus(task.id, 'completed')}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                title="Complete task"
              >
                Complete
              </button>
            </>
          )}
          {task.status === 'in_progress' && (
            <button 
              onClick={() => updateTaskStatus(task.id, 'active')}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              title="Resume task"
            >
              Resume
            </button>
          )}
        </div>
        
        {/* Date added - bottom right */}
        <div className="text-xs text-gray-500">
          {format(new Date(task.created_at), 'MMM d, yyyy')}
        </div>
      </div>
    </div>
  );
}
