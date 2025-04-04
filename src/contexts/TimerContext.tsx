import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TaskContext } from './TaskContext'; 
import { Task, TaskStatus, TaskStatusType } from '../types/task';
import { User } from '@supabase/supabase-js';
import { useTaskActions } from '../hooks/useTaskActions';
import { useTimerPersistence } from '../hooks/useTimerPersistence';
import { TimerState } from '../types/timer';
import { msToPostgresInterval, formatMillisecondsToTime } from '../utils/timeUtils';

interface TimerContextType {
  timerState: TimerState;
  startTimer: (taskId: string) => Promise<void>;
  pauseTimer: (taskStatus?: TaskStatusType) => Promise<void>;
  resumeTimer: () => Promise<void>; 
  stopTimer: (finalStatus?: TaskStatusType) => Promise<void>; 
  resetTimer: () => void;
  formatElapsedTime: (compact?: boolean) => string; 
  getDisplayTime: (task: Task) => string;
  clearTimerStorage: () => void;
}

// Create Context with a default undefined value
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Timer Provider component
export const TimerProvider = ({ children }: { children: ReactNode }) => {
  // Use our new timer persistence hook
  const { state: timerState, setState: setTimerState, clearTimerStorage } = useTimerPersistence();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get task context to update UI after timer actions
  const taskContext = useContext(TaskContext);

  // Use the task actions hook, passing the refreshTasks function from context
  const taskActions = useTaskActions({
    refreshTasks: taskContext?.refreshTasks,
    showToasts: false // Optionally disable toasts if they are redundant here
  });
 
  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer tick effect - updates the elapsed time while timer is running
  useEffect(() => {
    if (timerState.status === 'running' && timerState.startTime) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Start a new interval
      intervalRef.current = setInterval(() => {
        const now = new Date().getTime();
        // Add null check to prevent TypeScript error
        const currentSessionElapsed = timerState.startTime ? now - timerState.startTime : 0;
        
        // Update state with new elapsed time
        setTimerState({
          elapsedTime: currentSessionElapsed
          // The displayTime will be automatically calculated by the updateState function in useTimerPersistence
        });
      }, 1000); // Update every second
      
      // Clean up interval on unmount or when deps change
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else if (intervalRef.current) {
      // Stop the interval if timer is not running
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timerState.status, timerState.startTime, setTimerState]); // Dependencies

  // Start timer for a task
  const startTimer = async (taskId: string) => {
    if (!taskId || !currentUser) {
      console.warn('Cannot start timer: Missing task ID or user');
      return;
    }

    try {
      // 1. Reset timer for different task, otherwise continue with current
      if (timerState.taskId && timerState.taskId !== taskId) {
        // If switching tasks, first stop the current one
        await stopTimer();
      }

      // 2. Create a session record in DB
      const { data: newSession, error: insertError } = await supabase
        .from('time_sessions')
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          start_time: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      if (!newSession || !newSession.id) throw new Error('Failed to create session record');

      const newSessionId = newSession.id;

      // Set task to ACTIVE status if needed
      await taskActions.startTask(taskId);

      // 3. Update local state
      setTimerState({
        status: 'running',
        taskId: taskId,
        sessionId: newSessionId,
        startTime: new Date().getTime(),
        elapsedTime: 0, // Reset elapsed time for the new session
        // Keep previous elapsed if continuing with same task, otherwise reset
        previouslyElapsed: timerState.taskId === taskId ? timerState.previouslyElapsed : 0
        // displayTime will be calculated by useTimerPersistence
      });

      // No need to explicitly call startTimerInterval, useEffect handles it

    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  // Pause the currently running timer
  const pauseTimer = async (taskStatus?: TaskStatusType) => {
    if (timerState.status !== 'running' || !timerState.startTime || !timerState.taskId || !timerState.sessionId) {
      console.warn('Cannot pause: Timer not running or missing data');
      return;
    }

    const endTime = new Date().getTime();
    const currentSessionDurationMs = endTime - timerState.startTime;
    const currentSessionDurationInterval = msToPostgresInterval(currentSessionDurationMs);
    const totalElapsedMs = timerState.previouslyElapsed + currentSessionDurationMs;

    try {
      // 1. Update the time session in Supabase 
      const { error: sessionError } = await supabase
        .from('time_sessions')
        .update({
          end_time: new Date().toISOString(),
          duration: currentSessionDurationInterval
        })
        .eq('id', timerState.sessionId);

      if (sessionError) throw sessionError;

      // If a task status update was requested, update the task
      if (taskStatus) {
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ status: taskStatus })
          .eq('id', timerState.taskId);
          
        if (taskError) throw taskError;
      }

      // 2. Update local timer state
      setTimerState({
        status: 'paused',
        startTime: null,
        elapsedTime: 0, // Reset current session elapsed time
        // Add the just-completed session's duration to previouslyElapsed
        previouslyElapsed: totalElapsedMs
        // displayTime will be calculated by useTimerPersistence
      });
      
      // 3. Refresh tasks to show updated times
      if (taskContext?.refreshTasks) {
        taskContext.refreshTasks();
      }
    } catch (err) {
      console.error('Error pausing timer:', err);
    }
  };

  // Resume a paused timer
  const resumeTimer = async () => {
    if (timerState.status !== 'paused' || !timerState.taskId) {
      console.warn('Cannot resume: Timer not paused or missing task ID');
      return;
    }

    try {
      // Create a new session in the database
      const { data, error } = await supabase
        .from('time_sessions')
        .insert({
          task_id: timerState.taskId,
          user_id: currentUser?.id,
          start_time: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      // Update timer state
      setTimerState({
        status: 'running',
        startTime: new Date().getTime(),
        sessionId: data.id,
        elapsedTime: 0
        // Keep previouslyElapsed unchanged
        // displayTime will be calculated by useTimerPersistence
      });
    } catch (err) {
      console.error('Error resuming timer:', err);
    }
  };

  // Helper function to update the total actual_time in the tasks table
  const updateTaskActualTime = async (taskId: string) => {
    if (!taskId) return;

    try {
      // 1. Fetch all completed sessions for this task
      const { data: sessions, error: sessionError } = await supabase
        .from('time_sessions')
        .select('duration')
        .eq('task_id', taskId)
        .not('duration', 'is', null); // Only sessions with a duration

      if (sessionError) throw sessionError;
      if (!sessions) return;

      // 2. Sum the durations (convert from interval string to seconds/ms)
      const totalSeconds = sessions.reduce((sum: number, session: any) => {
        if (session.duration && typeof session.duration === 'string') {
          // Example: Parse '3600 seconds' -> 3600
          const parts = session.duration.split(' ');
          if (parts.length === 2 && parts[1] === 'seconds') {
            const seconds = parseInt(parts[0], 10);
            if (!isNaN(seconds)) return sum + seconds;
          }
        }
        return sum;
      }, 0);

      const totalInterval = msToPostgresInterval(totalSeconds * 1000); // Format back for Supabase

      // 3. Update the task's actual_time
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ actual_time: totalInterval })
        .eq('id', taskId);

      if (updateError) throw updateError;

      console.log(`Updated actual_time for task ${taskId} to ${totalInterval}`);
    } catch (error) {
      console.error('Error updating task actual_time:', error);
    }
  };

  // Stop timer completely (e.g., when task is completed)
  const stopTimer = async (finalStatus?: TaskStatusType) => {
    if (timerState.status === 'idle' || !timerState.taskId) return;
    const currentTaskId = timerState.taskId; // Store taskId before potential state changes
    
    // Ensure finalStatus is a valid TaskStatusType
    const taskStatus = finalStatus || TaskStatus.PENDING;

    try {
      // If status is running, pause it first (which will also update the session)
      if (timerState.status === 'running') {
        await pauseTimer(taskStatus);
      } else {
        // If it was already paused, just update the task status
        await taskActions.updateTaskStatus(currentTaskId, taskStatus);
      }
      
      // Update task's total time
      await updateTaskActualTime(currentTaskId);

      // Clean up timer state completely
      setTimerState({
        status: 'idle',
        taskId: null,
        sessionId: null,
        startTime: null,
        elapsedTime: 0,
        previouslyElapsed: 0
        // displayTime will be calculated to 00:00:00 by useTimerPersistence
      });

      // Refresh the task list to show updated times
      if (taskContext?.refreshTasks) {
        taskContext.refreshTasks();
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  // Reset local timer state without affecting DB
  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerState({ status: 'idle', taskId: null, sessionId: null, startTime: null, elapsedTime: 0, previouslyElapsed: 0, displayTime: '00:00:00' });
    clearTimerStorage(); // Clear storage
  };

  // Format total time for display with compact option
  const formatTotalTime = useCallback((compact: boolean = false) => {
      // This uses the state's displayTime which is updated by the interval
      if (compact) {
        // For compact displays, show mini time format (e.g., "1h 23m")
        const time = timerState.displayTime.split(':');
        const hours = parseInt(time[0], 10);
        const minutes = parseInt(time[1], 10);
        
        if (hours > 0) {
          return `${hours}h ${minutes}m`;
        } else {
          return `${minutes}m`;
        }
      }
      return timerState.displayTime;
  }, [timerState.displayTime]);

  // --- TODO: Review getDisplayTime --- 
  // This function seems less useful now that the context manages the active timer's display
  // It might be used for displaying *historical* actual_time on non-active tasks?
  const getDisplayTime = (task: Task): string => {
    if (timerState.taskId === task.id) {
      return formatTotalTime(); // If it's the active task, use live state
    }
    // If not active, display the stored actual_time (needs conversion from interval)
    if (task.actual_time && typeof task.actual_time === 'string') { 
        // Basic parser for 'X seconds' interval format
        const parts = (task.actual_time as string).split(' '); // Temporary type assertion
        if (parts.length === 2 && parts[1] === 'seconds') {
            const seconds = parseInt(parts[0], 10);
            if (!isNaN(seconds)) {
                return formatMillisecondsToTime(seconds * 1000); 
            }
        }
        // Fallback or handle other interval formats if necessary
        return '--:--:--'; // Or task.actual_time directly?
    }
    return '00:00:00';
  };

  // Value provided to consumers of the context
  const value = {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer, 
    stopTimer,
    resetTimer,
    formatElapsedTime: formatTotalTime, 
    getDisplayTime,
    clearTimerStorage,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

// Custom hook to use the Timer Context
export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
