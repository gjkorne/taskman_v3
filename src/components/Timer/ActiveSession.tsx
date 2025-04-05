import { useState, useEffect } from 'react';
import { useTimer } from '../../contexts/TimerCompat';
import { useTaskData } from '../../contexts/task';
import { useTimeSessionData } from '../../contexts/timeSession';
import { Icon } from '../UI/Icon';
import { useAdmin } from '../../contexts/AdminContext';
import { createLogger } from '../../utils/logging';

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
      <div className="sticky top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-lg">
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
      <div className="sticky top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-lg">
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
              <div className="font-medium text-sm">{activeTask.title}</div>
              <div className="font-mono text-lg font-bold">{formatElapsedTime()}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isRunning ? (
              <button
                onClick={() => {
                  pauseTimer();
                  if (onTimerStateChange) onTimerStateChange();
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
                  if (onTimerStateChange) onTimerStateChange();
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
                if (onTimerStateChange) onTimerStateChange();
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
  
  // Full expanded mode
  return (
    <div className="sticky top-0 left-0 right-0 w-full z-50 bg-gradient-to-r from-violet-700 to-indigo-800 text-white shadow-lg">
      <div className="mx-auto px-4 py-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <div className={`h-3 w-3 rounded-full mr-2 ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
              <span className="font-medium text-sm">{isRunning ? 'Timer running' : 'Timer paused'}</span>
            </div>
            
            <h3 className="text-lg font-semibold mb-1 truncate pr-8">{activeTask.title}</h3>
            
            <div className="text-sm opacity-90 mb-2">
              {activeTask.category_name && (
                <span className="inline-flex items-center mr-3">
                  <Icon name="Tag" size={14} className="mr-1" />
                  {activeTask.category_name}
                </span>
              )}
              {activeTask.due_date && (
                <span className="inline-flex items-center">
                  <Icon name="Calendar" size={14} className="mr-1" />
                  {new Date(activeTask.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
            
            <div className="text-2xl font-mono font-bold">
              {formatElapsedTime()}
            </div>
          </div>
          
          <div>
            <button 
              onClick={() => setIsExpanded(false)} 
              className="p-1.5 rounded-full bg-indigo-800 hover:bg-indigo-600 transition-colors"
              aria-label="Collapse timer"
            >
              <Icon name="ChevronUp" size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex mt-3 pt-3 border-t border-indigo-600 justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-sm">
              Started at {timerState.startTime ? new Date(timerState.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isRunning ? (
              <button 
                onClick={() => {
                  pauseTimer(); 
                  if (onTimerStateChange) onTimerStateChange();
                }}
                className="py-1.5 px-4 rounded-md bg-indigo-800 hover:bg-indigo-600 flex items-center space-x-2 transition-colors"
              >
                <Icon name="Pause" size={18} />
                <span>Pause</span>
              </button>
            ) : (
              <button 
                onClick={() => {
                  startTimer(activeTask.id);
                  if (onTimerStateChange) onTimerStateChange();
                }}
                className="py-1.5 px-4 rounded-md bg-indigo-800 hover:bg-indigo-600 flex items-center space-x-2 transition-colors"
              >
                <Icon name="Play" size={18} />
                <span>Resume</span>
              </button>
            )}
            
            <button
              onClick={() => {
                stopTimer();
                if (onTimerStateChange) onTimerStateChange();
              }}
              className="py-1.5 px-4 rounded-md bg-red-700 hover:bg-red-600 flex items-center space-x-2 transition-colors"
            >
              <Icon name="Square" size={18} />
              <span>Stop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
