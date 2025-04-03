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
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-lg py-6">
      <div className="max-w-7xl mx-auto px-6 py-2 flex flex-col md:flex-row items-center justify-between">
        {/* Task information section - much more prominent */}
        <div className="flex flex-col items-start space-y-3 mb-4 md:mb-0 md:w-2/3">
          <div className="flex items-center space-x-3">
            <div className={`rounded-full p-3 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}>
              <Clock className="h-7 w-7" />
            </div>
            <div className="text-base font-semibold uppercase tracking-wider text-indigo-200">CURRENTLY TIMING:</div>
          </div>
          
          <div className="font-bold text-2xl md:text-3xl lg:text-4xl pl-4 border-l-4 border-indigo-400 ml-3">
            {activeTask.title}
          </div>
          
          {activeTask.description && (
            <div className="text-sm text-indigo-200 line-clamp-1 pl-4 ml-3 max-w-lg">
              {activeTask.description}
            </div>
          )}
        </div>
        
        {/* Timer controls section */}
        <div className="flex flex-col space-y-3 items-end md:w-1/3">
          {/* Timer display */}
          <div className="font-mono text-2xl md:text-3xl font-bold">
            {formatElapsedTime()}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Play/Pause button */}
            {isRunning ? (
              <button
                onClick={() => {
                  pauseTimer();
                  if (onTimerStateChange) onTimerStateChange();
                }}
                className="p-4 rounded-full bg-blue-500 hover:bg-blue-400 transition-colors shadow-md"
              >
                <Pause size={24} />
              </button>
            ) : (
              <button
                onClick={() => {
                  startTimer(timerState.taskId!);
                  if (onTimerStateChange) onTimerStateChange();
                }}
                className="p-4 rounded-full bg-green-500 hover:bg-green-400 transition-colors shadow-md"
              >
                <Play size={24} />
              </button>
            )}
            
            {/* Stop button */}
            <button
              onClick={() => {
                stopTimer();
                if (onTimerStateChange) onTimerStateChange();
              }}
              className="p-4 rounded-full bg-red-500 hover:bg-red-400 transition-colors shadow-md"
            >
              <Square size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
