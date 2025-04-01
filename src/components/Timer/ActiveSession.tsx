import { Play, Pause, Square, Clock } from 'lucide-react';
import { useEffect } from 'react';
import { useTimer } from '../../contexts/TimerContext';
import { useTaskContext } from '../../contexts/TaskContext';

interface ActiveSessionProps {
  onTimerStateChange?: () => void;
}

export function ActiveSession({ onTimerStateChange }: ActiveSessionProps) {
  const { timerState, startTimer, pauseTimer, stopTimer, formatElapsedTime } = useTimer();
  const { tasks, refreshTasks } = useTaskContext();
  
  // Debug logging to see what's happening
  console.log('ActiveSession component rendering:', {
    timerState,
    taskCount: tasks.length,
    isTimerActive: timerState.status !== 'idle' && timerState.taskId !== null
  });
  
  // If no active timer, don't render anything
  if (timerState.status === 'idle' || !timerState.taskId) {
    console.log('No active timer, returning null');
    return null;
  }
  
  // Find active task details
  const activeTask = tasks.find(task => task.id === timerState.taskId);
  
  console.log('Found active task:', activeTask);
  
  // Use an effect to refresh tasks when an active timer exists but the task isn't found
  useEffect(() => {
    if (timerState.status !== 'idle' && timerState.taskId && !activeTask) {
      console.log('Active task not found in tasks array - refreshing tasks from useEffect');
      refreshTasks();
      if (onTimerStateChange) onTimerStateChange();
    }
  }, [timerState.status, timerState.taskId, activeTask, refreshTasks, onTimerStateChange]);
  
  if (!activeTask) {
    console.log('Active task not found in tasks array - refreshing tasks');
    
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Clock className="h-5 w-5" />
            <div>
              <div className="text-xs font-medium opacity-90">Loading timer...</div>
              <div className="h-4 w-32 bg-blue-500 animate-pulse rounded-md mt-1"></div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="font-mono text-lg font-bold">
              {formatElapsedTime()}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const isRunning = timerState.status === 'running';
  console.log('Rendering active session with running state:', isRunning);
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Clock className="h-5 w-5" />
          <div>
            <div className="text-xs font-medium opacity-90">Currently timing:</div>
            <div className="font-medium truncate max-w-xs">{activeTask.title}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Timer display */}
          <div className="font-mono text-lg font-bold">
            {formatElapsedTime()}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Play/Pause button */}
            {isRunning ? (
              <button
                onClick={() => {
                  pauseTimer();
                  if (onTimerStateChange) onTimerStateChange();
                }}
                className="p-2 rounded-full bg-blue-500 hover:bg-blue-400 transition-colors"
              >
                <Pause size={18} />
              </button>
            ) : (
              <button
                onClick={() => {
                  startTimer(timerState.taskId!);
                  if (onTimerStateChange) onTimerStateChange();
                }}
                className="p-2 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
              >
                <Play size={18} />
              </button>
            )}
            
            {/* Stop button */}
            <button
              onClick={() => {
                stopTimer();
                if (onTimerStateChange) onTimerStateChange();
              }}
              className="p-2 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
              title="Complete task"
            >
              <Square size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
