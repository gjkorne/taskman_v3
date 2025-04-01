// No imports needed since we're not using cn

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
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
          title="Start task"
        >
          Start
        </button>
      )}
      {status === 'active' && (
        <>
          <button 
            onClick={() => updateTaskStatus(taskId, 'in_progress')}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded mr-1"
            title="Pause task"
          >
            Pause
          </button>
          <button 
            onClick={() => updateTaskStatus(taskId, 'completed')}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
            title="Complete task"
          >
            Complete
          </button>
        </>
      )}
      {status === 'in_progress' && (
        <button 
          onClick={() => updateTaskStatus(taskId, 'active')}
          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
          title="Resume task"
        >
          Resume
        </button>
      )}
    </div>
  );
}
