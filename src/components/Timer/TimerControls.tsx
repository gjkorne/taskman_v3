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
  const { timerState, startTimer, pauseTimer, stopTimer, formatElapsedTime } = useTimer();
  
  // Validate taskId to ensure it's a UUID
  const isValidTaskId = typeof taskId === 'string' && 
    taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
  
  // Safely start the timer with validation
  const handleStartTimer = () => {
    if (!isValidTaskId) {
      console.error('Invalid taskId provided to TimerControls:', taskId);
      return;
    }
    console.log('TimerControls: Starting timer for task:', taskId);
    startTimer(taskId);
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
              onClick={pauseTimer}
              className="p-1 rounded-full hover:bg-slate-200 text-amber-600"
              title="Pause timer"
            >
              <Pause size={16} />
            </button>
          ) : (
            <button
              onClick={handleStartTimer}
              className="p-1 rounded-full hover:bg-slate-200 text-emerald-600"
              title="Resume timer"
            >
              <Play size={16} />
            </button>
          )}
          
          <button
            onClick={stopTimer}
            className="p-1 rounded-full hover:bg-slate-200 text-blue-600"
            title="Complete and stop timer"
          >
            <Square size={16} />
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
