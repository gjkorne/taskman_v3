// Import icons and utility function
import { Play, Pause, CheckCircle, RotateCcw } from 'lucide-react';
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
      {status === TaskStatus.PENDING && (
        <Button 
          onClick={() => handleStatusUpdate(TaskStatus.ACTIVE)}
          variant="success"
          size="xs"
          icon={<Play size={12} />}
          title="Start task"
        >
          Start
        </Button>
      )}
      {status === TaskStatus.ACTIVE && (
        <>
          <Button 
            onClick={() => handleStatusUpdate(TaskStatus.PAUSED)}
            variant="warning"
            size="xs"
            icon={<Pause size={12} />}
            title="Pause task"
          >
            Pause
          </Button>
          <Button 
            onClick={() => handleStatusUpdate(TaskStatus.COMPLETED)}
            variant="info"
            size="xs"
            icon={<CheckCircle size={12} />}
            title="Complete task"
          >
            Complete
          </Button>
        </>
      )}
      {status === TaskStatus.PAUSED && (
        <Button 
          onClick={() => handleStatusUpdate(TaskStatus.ACTIVE)}
          variant="primary"
          size="xs"
          icon={<RotateCcw size={12} />}
          title="Resume task"
        >
          Resume
        </Button>
      )}
    </div>
  );
}
