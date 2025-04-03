import { Task, TaskStatus } from '../../types/task';
import { TaskFilter } from './FilterPanel';
import { TaskCard } from './TaskCard';
import { useTimer } from '../../contexts/TimerContext';

// Define section styles configuration for consistent UI
const SECTION_STYLES = {
  activeNow: { title: 'Active Now', bgColor: 'bg-blue-50' },
  paused: { title: 'Paused', bgColor: 'bg-amber-50' },
  inProgress: { title: 'In Progress', bgColor: 'bg-indigo-50' },
  todo: { title: 'Todo', bgColor: 'bg-white' },
  completed: { title: 'Completed', bgColor: 'bg-green-50' },
  archived: { title: 'Archived', bgColor: 'bg-gray-50' }
};

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
  // Get the current timer state to accurately identify the active task
  const { timerState } = useTimer();

  // Loading state indicator
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

  // Empty state indicator
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="rounded-full bg-gray-100 p-3 mb-3">
          <svg className="h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
        <p className="mt-2 text-gray-500">Create your first task to get started.</p>
      </div>
    );
  }

  // Utility function to categorize tasks
  const categorizeTasks = (tasks: Task[]) => {
    // ACTIVE TASKS: Tasks that are currently being TIMED (timer running)
    const activeTasks = tasks.filter(task => 
      timerState.taskId === task.id && timerState.status === 'running'
    );
    
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

    const todoTasks = otherTasks.filter(t => t.status === TaskStatus.PENDING);
    const completedTasks = otherTasks.filter(t => t.status === TaskStatus.COMPLETED);
    const archivedTasks = otherTasks.filter(t => t.status === TaskStatus.ARCHIVED);

    return {
      activeTasks,
      pausedTasks,
      inProgressTasks,
      todoTasks,
      completedTasks,
      archivedTasks
    };
  };

  // Categorize the tasks
  const {
    activeTasks,
    pausedTasks,
    inProgressTasks,
    todoTasks,
    completedTasks,
    archivedTasks
  } = categorizeTasks(tasks);

  // Helper function to render a single task card
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

  // Helper function to render task section with consistent heading style
  const renderTaskSection = (tasks: Task[], sectionKey: keyof typeof SECTION_STYLES) => {
    if (tasks.length === 0) return null;
    
    const { title, bgColor } = SECTION_STYLES[sectionKey];
    
    return (
      <div className="mb-6" key={title}>
        {/* Section header with count and styled background */}
        <div className={`flex items-center px-3 py-1.5 rounded-t-md ${bgColor} mb-1`}>
          <h2 className="text-sm font-semibold">
            {title}
            <span className="ml-2 px-1.5 py-0.5 bg-white bg-opacity-90 rounded-full text-xs">
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

  // Render in list view (vertically stacked sections)
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {renderTaskSection(activeTasks, 'activeNow')}
        {renderTaskSection(pausedTasks, 'paused')}
        {renderTaskSection(inProgressTasks, 'inProgress')}
        {renderTaskSection(todoTasks, 'todo')}
        {renderTaskSection(completedTasks, 'completed')}
        {renderTaskSection(archivedTasks, 'archived')}
      </div>
    );
  } 
  
  // Render in board view (horizontally arranged columns)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Column 1: Active tasks */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium px-2">Active & In Progress</h2>
        {/* Section for active tasks */}
        <div className="px-2">
          {activeTasks.map((task, index) => renderTaskCard(task, index))}
          {pausedTasks.map((task, index) => renderTaskCard(task, index))}
          {inProgressTasks.map((task, index) => renderTaskCard(task, index))}
        </div>
      </div>
      
      {/* Column 2: Pending tasks */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium px-2">Todo</h2>
        <div className="px-2">
          {todoTasks.map((task, index) => renderTaskCard(task, index))}
        </div>
      </div>
      
      {/* Column 3: Completed & Archived tasks */}
      <div className="space-y-6">
        <h2 className="text-lg font-medium px-2">Completed & Archived</h2>
        <div className="px-2">
          {completedTasks.map((task, index) => renderTaskCard(task, index))}
          {archivedTasks.map((task, index) => renderTaskCard(task, index))}
        </div>
      </div>
    </div>
  );
}
