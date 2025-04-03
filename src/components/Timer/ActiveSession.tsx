import { Play, Pause, Square, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTimer } from '../../contexts/TimerContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { TaskStatus } from '../../types/task';

interface ActiveSessionProps {
  onTimerStateChange?: () => void;
}

export function ActiveSession({ onTimerStateChange }: ActiveSessionProps) {
  const { timerState, startTimer, pauseTimer, stopTimer, formatElapsedTime } = useTimer();
  const { tasks } = useTaskContext();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get the task that is currently being timed
  const activeTask = tasks.find(task => task.id === timerState.taskId);
  
  if (!timerState.taskId) {
    return null;
  }
  
  if (!activeTask) {
    console.log('Active task not found in tasks array - refreshing tasks');
    
    return (
      <div className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-lg py-2">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5" />
            <div className="text-xs font-medium opacity-90">Loading timer...</div>
          </div>
          
          <div className="font-mono text-lg font-bold">
            {formatElapsedTime()}
          </div>
        </div>
      </div>
    );
  }
  
  const isRunning = timerState.status === 'running';
  console.log('Rendering active session with running state:', isRunning);
  
  // Compact mode (default when collapsed)
  if (!isExpanded) {
    return (
      <div className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors"
              aria-label="Expand timer"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            
            <div className={`rounded-full p-1.5 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}>
              <Clock className="h-5 w-5" />
            </div>
            
            <div className="font-medium truncate max-w-[200px] md:max-w-sm lg:max-w-md">
              {activeTask.title}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="font-mono font-bold">
              {formatElapsedTime()}
            </div>
            
            <div className="flex items-center space-x-1.5">
              {isRunning ? (
                <button
                  onClick={() => {
                    pauseTimer();
                    if (onTimerStateChange) onTimerStateChange();
                  }}
                  className="p-1.5 rounded-full bg-blue-500 hover:bg-blue-400 transition-colors"
                >
                  <Pause size={16} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    startTimer(timerState.taskId!);
                    if (onTimerStateChange) onTimerStateChange();
                  }}
                  className="p-1.5 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
                >
                  <Play size={16} />
                </button>
              )}
              
              <button
                onClick={() => {
                  stopTimer(TaskStatus.PENDING);
                  if (onTimerStateChange) onTimerStateChange();
                }}
                className="p-1.5 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
                aria-label="Stop timing and move task to Todo list"
              >
                <Square size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Expanded mode (when expanded button is clicked)
  return (
    <div className="sticky top-0 left-0 right-0 z-50 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-3 w-full justify-between md:justify-start md:w-auto">
          <button 
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors"
            aria-label="Collapse timer"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          
          <div className={`rounded-full p-3 ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}>
            <Clock className="h-7 w-7" />
          </div>
          
          <div className="flex flex-col">
            <div className="text-sm font-semibold uppercase tracking-wider text-indigo-200">CURRENTLY TIMING:</div>
            <div className="font-bold text-xl md:text-2xl truncate max-w-xs md:max-w-sm">
              {activeTask.title}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-3 md:mt-0">
          <div className="font-mono text-xl md:text-2xl font-bold">
            {formatElapsedTime()}
          </div>
          
          <div className="flex items-center space-x-2">
            {isRunning ? (
              <button
                onClick={() => {
                  pauseTimer();
                  if (onTimerStateChange) onTimerStateChange();
                }}
                className="p-3 rounded-full bg-blue-500 hover:bg-blue-400 transition-colors shadow-sm"
              >
                <Pause size={20} />
              </button>
            ) : (
              <button
                onClick={() => {
                  startTimer(timerState.taskId!);
                  if (onTimerStateChange) onTimerStateChange();
                }}
                className="p-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors shadow-sm"
              >
                <Play size={20} />
              </button>
            )}
            
            <button
              onClick={() => {
                stopTimer(TaskStatus.PENDING);
                if (onTimerStateChange) onTimerStateChange();
              }}
              className="p-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors shadow-sm"
              aria-label="Stop timing and move task to Todo list"
            >
              <Square size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
