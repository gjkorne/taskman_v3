// Import icons and utility function
import { CheckCircle } from 'lucide-react';
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
      {status === TaskStatus.ACTIVE && (
        <Button 
          onClick={() => handleStatusUpdate(TaskStatus.COMPLETED)}
          variant="info"
          size="xs"
          icon={<CheckCircle size={12} />}
          title="Complete task"
        >
          Complete
        </Button>
      )}
    </div>
  );
}
