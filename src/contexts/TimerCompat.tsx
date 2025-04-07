import { useEffect } from 'react';
import { useTimeSessionData } from './timeSession';
import { useTimeSessionUI } from './timeSession';
import { Task } from '../types/task';
import { supabase } from '../lib/supabase'; // Import supabase instance directly

// Define an extended session interface for our compatibility layer
interface TimerSession {
  id: string;
  task_id: string;
  start_time: string;
  end_time: string | null;
  // These metadata fields are stored in a local state
  // We'll simulate them in our compatibility layer
  _isRunning?: boolean;
  _elapsed?: number;
  _lastChecked?: number;
}

// This is a compatibility layer to allow components using the old useTimer hook
// to continue working with our new context structure
export const useTimer = () => {
  const {
    activeSession,
    sessions,
    createSession,
    stopSession,
    refreshSessions
  } = useTimeSessionData();
  
  // We don't actually use these in the compatibility layer
  // but keeping reference to ensure context is accessed
  useTimeSessionUI();

  // Check if we have an active task that's already completed
  useEffect(() => {
    const checkForCompletedTasks = async () => {
      if (activeSession) {
        try {
          // Get the task directly from Supabase to ensure we have latest status
          const { data: taskData } = await supabase
            .from('tasks')
            .select('status')
            .eq('id', activeSession.task_id)
            .single();
            
          if (taskData && taskData.status === 'completed') {
            console.log(`[TimerCompat] Found active session for completed task ${activeSession.task_id}, stopping it`);
            await stopSession(activeSession.id);
            refreshSessions();
          }
        } catch (error) {
          console.error('Error checking task status:', error);
        }
      }
    };
    
    checkForCompletedTasks();
  }, [activeSession, stopSession, refreshSessions]);
  
  // Calculate elapsed time based on session data
  const calculateElapsedTime = (session: TimerSession): number => {
    if (!session.start_time) return 0;
    
    const startTime = new Date(session.start_time).getTime();
    const endTime = session.end_time ? new Date(session.end_time).getTime() : Date.now();
    
    return endTime - startTime;
  };
  
  // Map the old TimerState structure to our new data
  const timerState = {
    taskId: activeSession?.task_id || null,
    isRunning: !!activeSession && !activeSession.end_time,
    startTime: activeSession?.start_time ? new Date(activeSession.start_time).getTime() : 0,
    pausedAt: activeSession?.end_time ? new Date(activeSession.end_time).getTime() : 0,
    totalPausedTime: 0, // We don't track paused time separately
    elapsed: activeSession ? calculateElapsedTime(activeSession) : 0,
    status: !activeSession ? 'idle' : 
            (activeSession && !activeSession.end_time ? 'running' : 'paused')
  };
  
  // Map the old API to the new one
  const startTimer = async (taskId: string) => {
    await createSession(taskId);
  };
  
  const pauseTimer = async () => {
    if (activeSession && !activeSession.end_time) {
      // In the new model, we'll stop the session rather than pause it
      await stopSession(activeSession.id);
    }
  };
  
  const resumeTimer = async () => {
    if (activeSession) {
      // Create a new session for the same task
      await createSession(activeSession.task_id);
    }
  };
  
  // Accept TaskStatus parameter for backward compatibility but ignore it
  const stopTimer = async (newStatus?: any) => {
    if (activeSession) {
      await stopSession(activeSession.id);
      
      // Get the taskId before stopping
      const taskId = activeSession.task_id;
      
      // If we're stopping with a 'completed' status, update the task status
      if (newStatus === 'completed' && taskId) {
        try {
          // Import dynamically to avoid circular dependencies
          const { taskService } = await import('../services/api');
          console.log(`Marking completed task ${taskId} via compatibility layer`);
          await taskService.updateTaskStatus(taskId, 'completed');
        } catch (error) {
          console.error('Error updating task status on timer stop:', error);
        }
      }
    }
  };
  
  const resetTimer = () => {
    // No direct equivalent, but we could stop the current session
    if (activeSession) {
      stopSession(activeSession.id);
    }
  };
  
  // Updated to handle both boolean and string parameters for backwards compatibility
  const formatElapsedTime = (compactParam: boolean | string = false) => {
    if (!activeSession) return '00:00:00';
    
    // Normalize the parameter - both 'short' string and true boolean should result in compact format
    const compact = compactParam === true || compactParam === 'short';
    
    let elapsed = timerState.elapsed;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    elapsed -= hours * 1000 * 60 * 60;
    const minutes = Math.floor(elapsed / (1000 * 60));
    elapsed -= minutes * 1000 * 60;
    const seconds = Math.floor(elapsed / 1000);
    
    if (compact) {
      return hours > 0 
        ? `${hours}h ${minutes}m` 
        : `${minutes}m ${seconds}s`;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const getDisplayTime = (task: Task) => {
    // Check if this task has an active session
    if (activeSession && activeSession.task_id === task.id) {
      return formatElapsedTime(true);
    }
    
    // Find all sessions for this task
    const taskSessions = sessions.filter(s => s.task_id === task.id);
    if (taskSessions.length === 0) return '0m';
    
    // Calculate total time spent
    const totalMs = taskSessions.reduce((total, session) => {
      return total + calculateElapsedTime(session);
    }, 0);
    
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };
  
  const clearTimerStorage = () => {
    // No direct equivalent in the new context
    console.warn('clearTimerStorage is deprecated and has no effect with the new context structure');
  };
  
  // Add a completeTask method for compatibility
  const completeTask = async (taskId: string) => {
    console.log(`Completing task ${taskId} via compatibility layer`);
    
    // If this task is currently being timed, stop the timer
    if (activeSession?.task_id === taskId) {
      await stopTimer('completed');
    } else {
      // Import dynamically to avoid circular dependencies
      try {
        const { taskService } = await import('../services/api');
        await taskService.updateTaskStatus(taskId, 'completed');
      } catch (error) {
        console.error('Error updating task status on complete:', error);
      }
    }
  };
  
  return {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    formatElapsedTime,
    getDisplayTime,
    clearTimerStorage,
    completeTask
  };
};
