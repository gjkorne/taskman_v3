import { Play, Pause, Square, Clock } from 'lucide-react';
import { useTimer } from '../../contexts/TimerContext';
import { useTaskContext } from '../../contexts/TaskContext';

export function ActiveSession() {
  const { timerState, startTimer, pauseTimer, stopTimer, formatElapsedTime } = useTimer();
  const { tasks } = useTaskContext();
  
  // If no active timer, don't render anything
  if (timerState.status === 'idle' || !timerState.taskId) {
    return null;
  }
  
  // Find active task details
  const activeTask = tasks.find(task => task.id === timerState.taskId);
  const isRunning = timerState.status === 'running';
  
  if (!activeTask) {
    return null;
  }
  
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
                onClick={() => pauseTimer()}
                className="p-2 rounded-full bg-blue-500 hover:bg-blue-400 transition-colors"
              >
                <Pause size={18} />
              </button>
            ) : (
              <button
                onClick={() => startTimer(timerState.taskId!)}
                className="p-2 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
              >
                <Play size={18} />
              </button>
            )}
            
            {/* Stop button */}
            <button
              onClick={() => stopTimer()}
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
