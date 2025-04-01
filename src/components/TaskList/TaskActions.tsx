// Import icons and utility function
import { Play, Pause, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '../UI/Button';

interface TaskActionsProps {
  taskId: string;
  status: string;
  updateTaskStatus: (taskId: string, status: string) => void;
}

export function TaskActions({ taskId, status, updateTaskStatus }: TaskActionsProps) {
  return (
    <div className="flex space-x-2">
      {status === 'pending' && (
        <Button 
          onClick={() => updateTaskStatus(taskId, 'active')}
          variant="success"
          size="xs"
          icon={<Play size={12} />}
          title="Start task"
        >
          Start
        </Button>
      )}
      {status === 'active' && (
        <>
          <Button 
            onClick={() => updateTaskStatus(taskId, 'in_progress')}
            variant="warning"
            size="xs"
            icon={<Pause size={12} />}
            title="Pause task"
          >
            Pause
          </Button>
          <Button 
            onClick={() => updateTaskStatus(taskId, 'completed')}
            variant="info"
            size="xs"
            icon={<CheckCircle size={12} />}
            title="Complete task"
          >
            Complete
          </Button>
        </>
      )}
      {status === 'in_progress' && (
        <Button 
          onClick={() => updateTaskStatus(taskId, 'active')}
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
