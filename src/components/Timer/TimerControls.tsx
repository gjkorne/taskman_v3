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
  
  const isThisTaskActive = timerState.taskId === taskId && timerState.status !== 'idle';
  const isRunning = timerState.status === 'running';
  
  // Different layouts based on timer state and compact mode
  if (!isThisTaskActive && compact) {
    // Compact start button when timer is idle
    return (
      <button
        onClick={() => startTimer(taskId)}
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
        onClick={() => {
          startTimer(taskId);
          if (onTimerStateChange) onTimerStateChange();
        }}
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
              onClick={() => startTimer(taskId)}
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
          <span>{formatElapsedTime('short')} elapsed</span>
        </div>
      )}
    </div>
  );
}
