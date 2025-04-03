// Import icons and utility function
import { CheckCircle, PlayCircle, ArchiveIcon } from 'lucide-react';
import { Button } from '../UI/Button';
import { TaskStatus, TaskStatusType } from '../../types/task';

interface TaskActionsProps {
  taskId: string;
  status: TaskStatusType;
  updateTaskStatus: (taskId: string, status: TaskStatusType) => void;
}

export function TaskActions({ taskId, status, updateTaskStatus }: TaskActionsProps) {
  // Ensure parameters are correctly typed and never swapped
  const handleStatusUpdate = (newStatus: TaskStatusType) => {
    console.log('TaskActions: Updating task status:', { 
      taskId, 
      currentStatus: status, 
      newStatus 
    });
    
    // Validate taskId is a UUID
    if (!taskId || !taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.error('Invalid taskId provided to TaskActions:', taskId);
      return;
    }
    
    // Proceed with the update with correct parameter order
    updateTaskStatus(taskId, newStatus);
  };

  return (
    <div className="flex space-x-2">
      {/* Mark Complete button - per project notes */}
      {(status === TaskStatus.ACTIVE || status === TaskStatus.PENDING || status === TaskStatus.IN_PROGRESS) && (
        <Button 
          onClick={() => handleStatusUpdate(TaskStatus.COMPLETED)}
          variant="success"
          size="sm"
          icon={<CheckCircle size={16} className="transition-transform group-hover:scale-110" />}
          title="Mark task as complete"
          className="min-w-[130px] md:min-w-[130px] shadow-sm transition-all duration-200 hover:shadow group"
        >
          <span className="hidden md:inline">
            {status === TaskStatus.ACTIVE ? "Complete" : "Mark as Complete"}
          </span>
        </Button>
      )}

      {/* Resume button - for paused tasks */}
      {status === TaskStatus.IN_PROGRESS && (
        <Button 
          onClick={() => handleStatusUpdate(TaskStatus.ACTIVE)}
          variant="primary"
          size="sm"
          icon={<PlayCircle size={16} className="transition-transform group-hover:scale-110" />}
          title="Resume task"
          className="min-w-[100px] md:min-w-[100px] shadow-sm transition-all duration-200 hover:shadow group"
        >
          <span className="hidden md:inline">
            Resume
          </span>
        </Button>
      )}

      {/* Archive button - for completed tasks */}
      {status === TaskStatus.COMPLETED && (
        <Button 
          onClick={() => handleStatusUpdate(TaskStatus.ARCHIVED)}
          variant="secondary"
          size="sm"
          icon={<ArchiveIcon size={16} className="transition-transform group-hover:scale-110" />}
          title="Archive task"
          className="min-w-[100px] md:min-w-[100px] shadow-sm transition-all duration-200 hover:shadow group"
        >
          <span className="hidden md:inline">
            Archive
          </span>
        </Button>
      )}
    </div>
  );
}
