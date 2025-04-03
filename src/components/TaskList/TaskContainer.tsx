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

  // Render tasks in their respective sections
  const renderTaskCard = (task: Task, index: number) => (
    <TaskCard
      key={task.id}
      task={task}
      index={index}
      onEdit={onEdit}
      onDelete={onDelete}
      onTimerStateChange={onTimerStateChange}
    />
  );

  // Helper function to render task section with heading
  const renderTaskSection = (tasks: Task[], title: string, bgColor: string = 'bg-white') => {
    if (tasks.length === 0) return null;
    
    return (
      <div className={`mb-8 pb-6 ${bgColor} rounded-lg shadow-sm border border-gray-100`}>
        <div className="border-b border-gray-200 mb-4 px-4 py-3">
          <h2 className="text-lg font-medium text-gray-800 flex items-center">
            {title}
            <span className="ml-2 bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </h2>
        </div>
        <div className="px-4">
          {tasks.map((task, index) => renderTaskCard(task, index))}
        </div>
      </div>
    );
  };

  // Decide on the layout based on viewMode
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {renderTaskSection(activeTasks, 'Active Now', 'bg-blue-50')}
        {renderTaskSection(pausedTasks, 'Paused', 'bg-amber-50')}
        {renderTaskSection(inProgressTasks, 'In Progress', 'bg-indigo-50')}

        {/* Split other tasks by status */}
        {renderTaskSection(otherTasks.filter(t => t.status === TaskStatus.PENDING), 'Todo', 'bg-white')}
        {renderTaskSection(otherTasks.filter(t => t.status === TaskStatus.COMPLETED), 'Completed', 'bg-green-50')}
        {renderTaskSection(otherTasks.filter(t => t.status === TaskStatus.ARCHIVED), 'Archived', 'bg-gray-50')}
      </div>
    );
  } else {
    // Grid view layout
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <h2 className="text-lg font-medium px-2">Active & In Progress</h2>
          {activeTasks.map((task, index) => renderTaskCard(task, index))}
          {pausedTasks.map((task, index) => renderTaskCard(task, index))}
          {inProgressTasks.map((task, index) => renderTaskCard(task, index))}
        </div>
        
        <div className="space-y-6">
          <h2 className="text-lg font-medium px-2">Todo</h2>
          {otherTasks
            .filter(t => t.status === TaskStatus.PENDING)
            .map((task, index) => renderTaskCard(task, index))}
        </div>
        
        <div className="space-y-6">
          <h2 className="text-lg font-medium px-2">Completed</h2>
          {otherTasks
            .filter(t => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.ARCHIVED)
            .map((task, index) => renderTaskCard(task, index))}
        </div>
      </div>
    );
  }
}
