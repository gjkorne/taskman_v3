import { useState, useEffect } from 'react';
import { useTimer } from '../../contexts/TimerCompat';
import { useTaskData } from '../../contexts/task';
import { useTimeSessionData } from '../../contexts/timeSession';
import { Icon } from '../UI/Icon';
import { useAdmin } from '../../contexts/AdminContext';
import { createLogger } from '../../utils/logging';
import { timerStateChangeEvent } from '../../App';

const logger = createLogger('ActiveSession');

interface ActiveSessionProps {
  onTimerStateChange?: () => void;
}

export function ActiveSession({ onTimerStateChange }: ActiveSessionProps) {
  const { timerState, startTimer, pauseTimer, stopTimer, formatElapsedTime } = useTimer();
  const { activeSession } = useTimeSessionData(); // Direct access to activeSession from context
  const { tasks } = useTaskData();
  const [isExpanded, setIsExpanded] = useState(true);
  const { impersonatedUser } = useAdmin();
  
  // Get the task that is currently being timed
  const activeTask = tasks.find(task => task.id === timerState.taskId);
  
  useEffect(() => {
    if (timerState.taskId || activeSession) {
      logger.log("Active session detected:", { 
        timerState: timerState, 
        activeSession: activeSession 
      });
    }
  }, [timerState, activeSession]);
  
  // Handle timer state changes
  const handleTimerStateChange = () => {
    // Call the prop-based callback if provided (for backward compatibility)
    if (onTimerStateChange) {
      onTimerStateChange();
    }
    
    // Dispatch the global event
    window.dispatchEvent(timerStateChangeEvent);
  };
  
  // Don't render the component if user is being impersonated by an admin
  // as we don't want to show/modify real timer state in impersonation mode
  if (impersonatedUser) {
    return null;
  }
  
  // Check both timerState AND activeSession from TimeSessionData context
  const hasActiveSession = 
    (timerState.taskId && timerState.status !== 'idle') || 
    (activeSession && !activeSession.end_time);
  
  if (!hasActiveSession) {
    return null;
  }
  
  // If we have an activeSession but no active task (maybe the task was deleted)
  // show the loading state
  if (!activeTask) {
    return (
      <div className="fixed top-0 left-0 right-0 w-full z-10 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-lg">
        <div className="mx-auto px-4 py-2">
          <div className="animate-pulse flex items-center space-x-2">
            <div className="rounded-full bg-indigo-600 h-4 w-4"></div>
            <div className="text-sm font-medium opacity-90">Loading task details...</div>
          </div>
          
          <div className="font-mono text-lg font-bold">
            {formatElapsedTime()}
          </div>
        </div>
      </div>
    );
  }
  
  const isRunning = timerState.isRunning;
  
  // Compact mode (default when collapsed)
  if (!isExpanded) {
    return (
      <div className="sticky top-0 left-0 right-0 w-full z-10 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-lg">
        <div className="mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsExpanded(true)}
              className="p-1.5 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors"
              aria-label="Expand timer"
            >
              <Icon name="ChevronDown" size={18} />
            </button>
            <div>
              <div className="font-bold text-base">{activeTask.title}</div>
              {/* Status and priority information removed as requested */}
              <div className="font-mono text-lg font-bold">{formatElapsedTime()}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isRunning ? (
              <button
                onClick={() => {
                  pauseTimer();
                  handleTimerStateChange();
                }}
                className="p-2 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors"
                aria-label="Pause timer"
              >
                <Icon name="Pause" size={20} />
              </button>
            ) : (
              <button
                onClick={() => {
                  startTimer(activeTask.id);
                  handleTimerStateChange();
                }}
                className="p-2 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors"
                aria-label="Resume timer"
              >
                <Icon name="Play" size={20} />
              </button>
            )}
            
            <button
              onClick={() => {
                stopTimer();
                handleTimerStateChange();
              }}
              className="p-2 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors"
              aria-label="Stop timer"
            >
              <Icon name="Square" size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Expanded mode
  return (
    <div className="sticky top-0 left-0 right-0 w-full z-10 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start sm:items-center mb-3 sm:mb-0">
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-1.5 mt-1 sm:mt-0 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors mr-3"
              aria-label="Collapse timer"
            >
              <Icon name="ChevronUp" size={18} />
            </button>
            
            <div>
              <h3 className="font-bold text-2xl">{activeTask.title}</h3>
              {/* Status and priority information removed as requested */}
            </div>
          </div>
          
          <div className="flex items-center sm:space-x-6">
            <div className="mr-6 sm:mr-0">
              <div className="text-xs uppercase tracking-wide text-indigo-200 mb-1">Elapsed Time</div>
              <div className="font-mono text-2xl font-bold">{formatElapsedTime()}</div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isRunning ? (
                <button
                  onClick={() => {
                    pauseTimer();
                    handleTimerStateChange();
                  }}
                  className="flex items-center justify-center p-3 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors"
                  aria-label="Pause timer"
                >
                  <Icon name="Pause" size={20} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    startTimer(activeTask.id);
                    handleTimerStateChange();
                  }}
                  className="flex items-center justify-center p-3 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors"
                  aria-label="Resume timer"
                >
                  <Icon name="Play" size={20} />
                </button>
              )}
              
              <button
                onClick={() => {
                  stopTimer();
                  handleTimerStateChange();
                }}
                className="flex items-center justify-center p-3 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors"
                aria-label="Stop timer"
              >
                <Icon name="Square" size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
