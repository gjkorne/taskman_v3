import { Play, Pause, Square, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTimer } from '../../contexts/TimerContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/Toast/ToastContext';
import { TaskStatus } from '../../types/task';

// Debug flag - set to false in production
const DEBUG_TIMER = false;

// Constants
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Helper to validate taskId is a proper UUID
 */
function isValidUUID(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

// Define component props
interface TimerControlsProps {
  taskId: string;
  compact?: boolean;
  className?: string;
  onTimerStateChange?: () => void;
}

/**
 * Button component used across different timer states
 */
const TimerButton = ({ 
  onClick, 
  icon, 
  title, 
  className 
}: { 
  onClick: () => void, 
  icon: React.ReactNode, 
  title: string, 
  className?: string 
}) => (
  <button
    onClick={onClick}
    className={cn("p-1.5 rounded", className)}
    title={title}
  >
    {icon}
  </button>
);

/**
 * Group of control buttons for running timers (pause/resume/stop)
 */
const TimerControlButtons = ({
  isRunning,
  onPause,
  onResume,
  onStop
}: {
  isRunning: boolean,
  onPause: () => void,
  onResume: () => void,
  onStop: () => void
}) => (
  <div className="flex space-x-1">
    {isRunning ? (
      <TimerButton
        onClick={onPause}
        icon={<Pause size={16} />}
        title="Pause timer"
        className="hover:bg-amber-100 text-amber-600"
      />
    ) : (
      <TimerButton
        onClick={onResume}
        icon={<Play size={16} />}
        title="Resume timer"
        className="hover:bg-emerald-100 text-emerald-600"
      />
    )}
    
    <TimerButton
      onClick={onStop}
      icon={<Square size={16} />}
      title="Stop timer"
      className="hover:bg-red-100 text-red-600"
    />
  </div>
);

/**
 * TimerControls component - provides UI for timer interaction for a specific task
 */
export function TimerControls({ 
  taskId, 
  compact = false, 
  className, 
  onTimerStateChange 
}: TimerControlsProps) {
  const { timerState, startTimer, pauseTimer, resumeTimer, stopTimer, formatElapsedTime } = useTimer();
  const { settings } = useSettings();
  const { addToast } = useToast();
  
  const isValid = isValidUUID(taskId);
  const isThisTaskActive = isValid && timerState.taskId === taskId && timerState.status !== 'idle';
  const isRunning = timerState.status === 'running';
  
  /**
   * Notify parent component about timer state changes
   */
  const notifyStateChange = () => {
    if (onTimerStateChange) onTimerStateChange();
  };
  
  /**
   * Handle timer start with task switching logic
   */
  const handleStartTimer = async () => {
    if (!isValid) {
      if (DEBUG_TIMER) console.error('Invalid taskId provided to TimerControls:', taskId);
      return;
    }
    
    if (timerState.status !== 'idle' && timerState.taskId !== taskId) {
      const currentTaskId = timerState.taskId;
      
      if (settings.allowTaskSwitching) {
        if (DEBUG_TIMER) console.log('TimerControls: Switching from task', currentTaskId, 'to', taskId);
        await stopTimer(); 
        await startTimer(taskId); 
        addToast('Switched to new task timer', 'info');
      } else {
        if (DEBUG_TIMER) console.log('TimerControls: Cannot start timer for', taskId, 'because another timer is running');
        addToast('Please stop the current timer before starting a new one', 'warning');
        return;
      }
    } else {
      if (DEBUG_TIMER) console.log('TimerControls: Starting timer for task:', taskId);
      await startTimer(taskId);
    }
    
    notifyStateChange();
  };
  
  /**
   * Timer action handlers with consistent notification
   */
  const handlePauseTimer = async () => {
    // Update task status to in_progress when pausing (replaces 'paused')
    await pauseTimer(TaskStatus.IN_PROGRESS);
    notifyStateChange();
  };
  
  const handleResumeTimer = async () => {
    await resumeTimer();
    notifyStateChange();
  };
  
  const handleStopTimer = async () => {
    await stopTimer();
    notifyStateChange();
  };
  
  // Error state - invalid task ID
  if (!isValid) {
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
  
  // Compact start button
  if (!isThisTaskActive && compact) {
    return (
      <button
        onClick={handleStartTimer}
        className={cn(
          "px-2 py-1 text-xs font-normal rounded flex items-center",
          "bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200",
          "transition-all duration-200",
          className
        )}
        title="Start timing this task"
      >
        <Play size={12} />
      </button>
    );
  }
  
  // Full-size start button
  if (!isThisTaskActive) {
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
  
  // Compact active timer - ENHANCED VISIBILITY per project notes
  if (compact) {
    return (
      <div className={cn(
        "flex space-x-1 p-1 rounded-md", 
        isRunning ? "bg-green-100 border border-green-300 shadow-md animate-pulse" : "bg-amber-100 border border-amber-300",
        className
      )}>
        <div className="flex items-center mr-1">
          <Clock size={14} className={isRunning ? "text-green-600" : "text-amber-600"} />
          <span className="ml-1 font-mono text-xs font-medium">
            {formatElapsedTime(true)}
          </span>
        </div>
        <TimerControlButtons
          isRunning={isRunning}
          onPause={handlePauseTimer}
          onResume={handleResumeTimer}
          onStop={handleStopTimer}
        />
      </div>
    );
  }
  
  // Full-size active timer - ENHANCED VISIBILITY per project notes
  return (
    <div className={cn(
      "flex flex-col space-y-2 p-1 rounded-md", 
      isRunning ? "bg-green-50 shadow-md border border-green-300" : "bg-amber-50 border border-amber-200",
      className
    )}>
      <div className={cn(
        "flex items-center justify-between px-3 py-2 rounded-md border", 
        isRunning ? "border-green-300 bg-green-100 animate-pulse" : "border-amber-300 bg-amber-100"
      )}>
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          ) : (
            <div className="h-3 w-3 rounded-full bg-amber-500" />
          )}
          <span className="font-mono text-lg font-medium">
            {formatElapsedTime()}
          </span>
        </div>
        
        <TimerControlButtons
          isRunning={isRunning}
          onPause={handlePauseTimer}
          onResume={handleResumeTimer}
          onStop={handleStopTimer}
        />
      </div>
      
      <div className="flex justify-between text-xs px-1 font-medium">
        <span className={isRunning ? "text-green-700" : "text-amber-700"}>
          {isRunning ? "Task timing active" : "Timer paused"}
        </span>
        <span className="font-mono">
          {formatElapsedTime()} elapsed
        </span>
      </div>
    </div>
  );
}
