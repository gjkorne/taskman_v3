import { Task, TaskStatus } from '../../types/task';
import { TaskFilter } from './FilterPanel';
import { TaskCard } from './TaskCard';
import { useTimer } from '../../contexts/TimerContext';

interface TaskContainerProps {
  tasks: Task[];
  isLoading: boolean;
  viewMode: TaskFilter['viewMode'];
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTimerStateChange?: () => void;
}

export function TaskContainer({
  tasks,
  isLoading,
  viewMode,
  onEdit,
  onDelete,
  onTimerStateChange
}: TaskContainerProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-blue-200 rounded-full mb-2"></div>
          <div className="h-4 w-24 bg-blue-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <svg 
            className="h-12 w-12 text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
        <p className="mt-2 text-gray-500">Create your first task to get started.</p>
      </div>
    );
  }

  // Get the current timer state to accurately identify the active task
  const { timerState } = useTimer();

  // FIXED: Improved active task filtering to ensure categories are mutually exclusive
  // ACTIVE TASKS: Tasks that are currently being TIMED (timer running)
  const activeTasks = tasks.filter(task => {
    return timerState.taskId === task.id && timerState.status === 'running';
  });
  
  // PAUSED TASKS: Tasks with paused timers BUT NOT in completed/archived status
  const pausedTasks = tasks.filter(task => {
    const isPaused = timerState.taskId === task.id && timerState.status === 'paused';
    const isCompletedOrArchived = 
      task.status === TaskStatus.COMPLETED || 
      task.status === TaskStatus.ARCHIVED;
    
    // Only show in paused section if timer is paused AND task isn't completed/archived
    return isPaused && !isCompletedOrArchived;
  });

  // PROGRESS TASKS: Tasks with in_progress status but NOT currently being timed or paused
  const inProgressTasks = tasks.filter(task => {
    const isBeingTimed = timerState.taskId === task.id && 
                        (timerState.status === 'running' || timerState.status === 'paused');
    const hasInProgressStatus = task.status === TaskStatus.IN_PROGRESS;
    
    // Only show in this section if it has in_progress status but no active timer
    return hasInProgressStatus && !isBeingTimed;
  });

  // OTHER TASKS: Everything else (not being timed, not paused, not in progress)
  const otherTasks = tasks.filter(task => {
    // Not being timed
    const isBeingTimed = timerState.taskId === task.id && 
                        (timerState.status === 'running' || timerState.status === 'paused');
    
    // Not in progress
    const hasInProgressStatus = task.status === TaskStatus.IN_PROGRESS;
    
    // A task should be in Other Tasks only if it's not in any other section
    return !isBeingTimed && !hasInProgressStatus;
  });

  // Log overall counts for debugging
  console.log(`Total tasks: ${tasks.length}, Active: ${activeTasks.length}, Paused: ${pausedTasks.length}, In Progress: ${inProgressTasks.length}, Other: ${otherTasks.length}`);

  return (
    <div className="space-y-6">
      {/* Active Tasks Section - Tasks currently being timed */}
      {activeTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-green-600 mb-3 flex items-center">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Active Tasks ({activeTasks.length})
          </h2>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onTimerStateChange={onTimerStateChange}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Paused Tasks Section - Tasks with paused timers */}
      {pausedTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-amber-600 mb-3 flex items-center">
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500 mr-2"></span>
            Paused Tasks ({pausedTasks.length})
          </h2>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {pausedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onTimerStateChange={onTimerStateChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* In Progress Tasks Section - Tasks marked as in_progress but not being timed */}
      {inProgressTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-indigo-600 mb-3 flex items-center">
            <span className="inline-block h-3 w-3 rounded-full bg-indigo-500 mr-2"></span>
            In Progress Tasks ({inProgressTasks.length})
          </h2>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onTimerStateChange={onTimerStateChange}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Other Tasks Section */}
      {otherTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            {activeTasks.length > 0 || pausedTasks.length > 0 || inProgressTasks.length > 0 ? 'Other Tasks' : 'All Tasks'} ({otherTasks.length})
          </h2>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {otherTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onTimerStateChange={onTimerStateChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
