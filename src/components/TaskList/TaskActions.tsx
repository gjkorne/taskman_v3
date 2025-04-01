// Import icons and utility function
import { Play, Pause, CheckCircle, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TaskActionsProps {
  taskId: string;
  status: string;
  updateTaskStatus: (taskId: string, status: string) => void;
}

export function TaskActions({ taskId, status, updateTaskStatus }: TaskActionsProps) {
  return (
    <div className="flex space-x-2">
      {status === 'pending' && (
        <button 
          onClick={() => updateTaskStatus(taskId, 'active')}
          className={cn(
            "px-2 py-1 text-xs font-normal rounded flex items-center space-x-1",
            "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200",
            "transition-all duration-200"
          )}
          title="Start task"
        >
          <Play size={12} />
          <span>Start</span>
        </button>
      )}
      {status === 'active' && (
        <>
          <button 
            onClick={() => updateTaskStatus(taskId, 'in_progress')}
            className={cn(
              "px-2 py-1 text-xs font-normal rounded flex items-center space-x-1",
              "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200",
              "transition-all duration-200"
            )}
            title="Pause task"
          >
            <Pause size={12} />
            <span>Pause</span>
          </button>
          <button 
            onClick={() => updateTaskStatus(taskId, 'completed')}
            className={cn(
              "px-2 py-1 text-xs font-normal rounded flex items-center space-x-1",
              "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200",
              "transition-all duration-200"
            )}
            title="Complete task"
          >
            <CheckCircle size={12} />
            <span>Complete</span>
          </button>
        </>
      )}
      {status === 'in_progress' && (
        <button 
          onClick={() => updateTaskStatus(taskId, 'active')}
          className={cn(
            "px-2 py-1 text-xs font-normal rounded flex items-center space-x-1",
            "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200",
            "transition-all duration-200"
          )}
          title="Resume task"
        >
          <RotateCcw size={12} />
          <span>Resume</span>
        </button>
      )}
    </div>
  );
}
