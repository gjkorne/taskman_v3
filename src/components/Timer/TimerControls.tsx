import { Play, Pause, Square } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTimer } from '../../contexts/TimerContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useToast } from '../../components/Toast/ToastContext';

interface TimerControlsProps {
  taskId: string;
  compact?: boolean;
  className?: string;
  onTimerStateChange?: () => void;
}

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
    className={cn("p-1 rounded", className)}
    title={title}
  >
    {icon}
  </button>
);

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
        icon={<Pause size={14} />}
        title="Pause timer"
        className="hover:bg-amber-100 text-amber-600"
      />
    ) : (
      <TimerButton
        onClick={onResume}
        icon={<Play size={14} />}
        title="Resume timer"
        className="hover:bg-emerald-100 text-emerald-600"
      />
    )}
    
    <TimerButton
      onClick={onStop}
      icon={<Square size={14} />}
      title="Stop timer"
      className="hover:bg-red-100 text-red-600"
    />
  </div>
);

export function TimerControls({ taskId, compact = false, className, onTimerStateChange }: TimerControlsProps) {
  const { timerState, startTimer, pauseTimer, resumeTimer, stopTimer, formatElapsedTime } = useTimer();
  const { settings } = useSettings();
  const { addToast } = useToast();
  
  const isValidTaskId = typeof taskId === 'string' && 
    taskId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) !== null;
  
  const handleStartTimer = async () => {
    if (!isValidTaskId) {
      console.error('Invalid taskId provided to TimerControls:', taskId);
      return;
    }
    
    if (timerState.status !== 'idle' && timerState.taskId !== taskId) {
      const currentTaskId = timerState.taskId;
      
      if (settings.allowTaskSwitching) {
        console.log('TimerControls: Switching from task', currentTaskId, 'to', taskId);
        await stopTimer(); 
        await startTimer(taskId); 
        addToast('Switched to new task timer', 'info');
      } else {
        console.log('TimerControls: Cannot start timer for', taskId, 'because another timer is running');
        addToast('Please stop the current timer before starting a new one', 'warning');
        return;
      }
    } else {
      console.log('TimerControls: Starting timer for task:', taskId);
      await startTimer(taskId);
    }
    
    if (onTimerStateChange) onTimerStateChange();
  };
  
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
  
  if (compact) {
    return (
      <div className={cn("flex space-x-1", className)}>
        <TimerControlButtons
          isRunning={isRunning}
          onPause={handlePauseTimer}
          onResume={handleResumeTimer}
          onStop={handleStopTimer}
        />
      </div>
    );
  } else {
    return (
      <div className={cn("flex flex-col space-y-2", className)}>
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
          
          <TimerControlButtons
            isRunning={isRunning}
            onPause={handlePauseTimer}
            onResume={handleResumeTimer}
            onStop={handleStopTimer}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>Task timing active</span>
          <span>{formatElapsedTime()} elapsed</span>
        </div>
      </div>
    );
  }
}
