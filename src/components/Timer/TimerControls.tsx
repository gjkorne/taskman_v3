import { Play, Pause, Square, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTimer } from '../../contexts/TimerCompat';
import { useSettings } from '../../contexts/SettingsCompat';
import { useToast } from '../../components/Toast/ToastContext';

//

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
  onClick: (e: React.MouseEvent) => void, 
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

export { TimerButton };

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
  <div className="flex space-x-2">
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
    
    <button
      onClick={onStop}
      className="p-1.5 rounded hover:bg-red-100 text-red-600"
      title="Stop timer"
      aria-label="Stop timer"
    >
      <Square size={16} />
    </button>
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
  const isThisTaskActive = isValid && timerState.taskId === taskId;
  const isRunning = isThisTaskActive && timerState.status === 'running';
  const isPaused = isThisTaskActive && timerState.status === 'paused';
  
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
        addToast('Previous timer has been stopped and a new one started.', 'info');
        notifyStateChange();
      } else {
        addToast('Please stop the current timer before starting a new one.', 'warning');
      }
    } else {
      await startTimer(taskId);
      notifyStateChange();
    }
  };

  /**
   * Handle pausing the timer
   */
  const handlePauseTimer = async () => {
    if (isThisTaskActive && isRunning) {
      await pauseTimer();
      notifyStateChange();
    }
  };

  /**
   * Handle resuming the timer
   */
  const handleResumeTimer = async () => {
    if (isThisTaskActive && isPaused) {
      await resumeTimer();
      notifyStateChange();
    }
  };

  /**
   * Handle stopping the timer
   */
  const handleStopTimer = async () => {
    if (isThisTaskActive) {
      await stopTimer();
      notifyStateChange();
    }
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
  
  // Compact start button - when task is not being timed at all
  if (!isThisTaskActive) {
    return (
      <button
        onClick={handleStartTimer}
        className={cn(
          "rounded font-medium inline-flex items-center justify-center",
          "px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200",
          "text-blue-700 border border-blue-200",
          "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "min-w-[10px] shadow-sm transition-all duration-200 hover:shadow group",
          className
        )}
        title="Start timing this task"
      >
        <Play size={16} className="mr-1.5 transition-transform group-hover:scale-110" />
        Start
      </button>
    );
  }
  
  // Compact active timer - when timer is running or paused
  if (compact) {
    // If timer is running, show active compact timer
    if (isRunning) {
      return (
        <div className={cn(
          "flex space-x-1 p-1 rounded-md", 
          "bg-green-100 border border-green-300 shadow-md animate-pulse",
          className
        )}>
          <div className="flex items-center mr-1">
            <Clock size={14} className="text-green-600" />
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
    
    // If timer is paused, show paused compact timer
    if (isPaused) {
      return (
        <div className={cn(
          "flex space-x-1 p-1 rounded-md", 
          "bg-amber-100 border border-amber-300",
          className
        )}>
          <div className="flex items-center mr-1">
            <Clock size={14} className="text-amber-600" />
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
    
    // If we get here, something is wrong with the timer state, show restart button
    return (
      <button
        onClick={handleStartTimer}
        className={cn(
          "rounded font-medium inline-flex items-center justify-center",
          "px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200",
          "text-blue-700 border border-blue-200",
          "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          "min-w-[100px] shadow-sm transition-all duration-200 hover:shadow group",
          className
        )}
        title="Restart timing this task"
      >
        <Play size={16} className="mr-1.5 transition-transform group-hover:scale-110" />
        Restart
      </button>
    );
  }
  
  // Full-size active timer - when timer is running
  if (isRunning) {
    return (
      <div className={cn(
        "flex flex-col space-y-2 p-1 rounded-md", 
        "bg-green-50 shadow-md border border-green-300",
        className
      )}>
        <div className={cn(
          "flex items-center justify-between px-3 py-2 rounded-md border", 
          "border-green-300 bg-green-100 animate-pulse"
        )}>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
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
          <span className="text-green-700">
            Task timing active
          </span>
          <span className="font-mono">
            {formatElapsedTime()} elapsed
          </span>
        </div>
      </div>
    );
  }
  
  // Full-size paused timer - when timer is paused
  if (isPaused) {
    return (
      <div className={cn(
        "flex flex-col space-y-2 p-1 rounded-md", 
        "bg-amber-50 border border-amber-200",
        className
      )}>
        <div className={cn(
          "flex items-center justify-between px-3 py-2 rounded-md border", 
          "border-amber-300 bg-amber-100"
        )}>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
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
          <span className="text-amber-700">
            Timer paused
          </span>
          <span className="font-mono">
            {formatElapsedTime()} elapsed
          </span>
        </div>
      </div>
    );
  }
  
  // If we get here, something is wrong with the timer state, show start button
  return (
    <button
      onClick={handleStartTimer}
      className={cn(
        "rounded font-medium inline-flex items-center justify-center",
        "px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200",
        "text-blue-700 border border-blue-200",
        "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        "min-w-[100px] shadow-sm transition-all duration-200 hover:shadow group",
        className
      )}
      title="Start timing this task"
    >
      <Play size={16} className="mr-1.5 transition-transform group-hover:scale-110" />
      Start
    </button>
  );
}
