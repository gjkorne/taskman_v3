import { Play, Pause, Square } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTimer } from '../../contexts/TimerContext';

interface TimerControlsProps {
  taskId: string;
  compact?: boolean;
  className?: string;
  onTimerStateChange?: () => void;
}

export function TimerControls({ taskId, compact = false, className, onTimerStateChange }: TimerControlsProps) {
  const { timerState, startTimer, pauseTimer, resumeTimer, stopTimer, formatElapsedTime } = useTimer();
  // const { refreshTasks } = useTaskContext(); // No longer needed here
  
  // Validate taskId to ensure it's a UUID
  const isValidTaskId = typeof taskId === 'string' && 
    taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
  
  // Safely start the timer with validation
  const handleStartTimer = async () => {
    if (!isValidTaskId) {
      console.error('Invalid taskId provided to TimerControls:', taskId);
      return;
    }
    console.log('TimerControls: Starting timer for task:', taskId);
    await startTimer(taskId);
    
    if (onTimerStateChange) onTimerStateChange();
  };
  
  // Add handlers for pause, resume and stop with task list refresh
  const handlePauseTimer = async () => {
    await pauseTimer();
    if (onTimerStateChange) onTimerStateChange();
  };
  
  const handleResumeTimer = async () => {
    await resumeTimer();
    if (onTimerStateChange) onTimerStateChange();
  };
  
  const handleStopTimer = async () => {
    await stopTimer();
    if (onTimerStateChange) onTimerStateChange();
  };
  
  const isThisTaskActive = isValidTaskId && timerState.taskId === taskId && timerState.status !== 'idle';
  const isRunning = timerState.status === 'running';
  
  // If taskId is invalid, show an error button
  if (!isValidTaskId) {
    return (
      <button
        disabled
        className={cn(
          "px-2 py-1 text-xs font-normal rounded flex items-center space-x-1",
          "bg-red-100 text-red-700 border border-red-200",
          className
        )}
        title="Invalid task ID"
      >
        <span>Timer Error</span>
      </button>
    );
  }
  
  // Different layouts based on timer state and compact mode
  if (!isThisTaskActive && compact) {
    // Compact start button when timer is idle
    return (
      <button
        onClick={handleStartTimer}
        className={cn(
          "px-2 py-1 text-xs font-normal rounded flex items-center space-x-1",
          "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200",
          "transition-all duration-200",
          className
        )}
        title="Start timing this task"
      >
        <Play size={12} />
        <span>Time</span>
      </button>
    );
  }
  
  if (!isThisTaskActive) {
    // Full start button when timer is idle
    return (
      <button
        onClick={handleStartTimer}
        className={cn(
          "px-3 py-1.5 text-sm rounded-md flex items-center space-x-2",
          "bg-emerald-500 hover:bg-emerald-600 text-white",
          "transition-all duration-200 shadow-sm",
          className
        )}
        title="Start timing this task"
      >
        <Play size={14} />
        <span>Start Timer</span>
      </button>
    );
  }
  
  // Active timer controls
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {/* Timer display */}
      <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-amber-500" />
          )}
          <span className="font-mono text-sm font-medium">
            {formatElapsedTime()}
          </span>
        </div>
        
        {/* Control buttons */}
        <div className="flex space-x-1">
          {isRunning ? (
            <button
              onClick={handlePauseTimer}
              className="p-1 rounded hover:bg-amber-100 text-amber-600"
              title="Pause timer"
            >
              <Pause size={14} />
            </button>
          ) : (
            <button
              onClick={handleResumeTimer}
              className="p-1 rounded hover:bg-emerald-100 text-emerald-600"
              title="Resume timer"
            >
              <Play size={14} />
            </button>
          )}
          
          <button
            onClick={handleStopTimer}
            className="p-1 rounded hover:bg-red-100 text-red-600"
            title="Stop timer"
          >
            <Square size={14} />
          </button>
        </div>
      </div>
      
      {/* Total time indicator */}
      {!compact && (
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>Task timing active</span>
          <span>{formatElapsedTime()} elapsed</span>
        </div>
      )}
    </div>
  );
}
