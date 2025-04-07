import { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo } from 'react';
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
  completeTask: (taskId: string) => Promise<void>;
}

// Create Context with a default undefined value
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Timer Provider component
export const TimerProvider = ({ children }: { children: ReactNode }) => {
  // Use our new timer persistence hook
  const { state: timerState, setState: setTimerState, clearTimerStorage, syncWithRemote } = useTimerPersistence();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get task context to update UI after timer actions
  const taskContext = useContext(TaskContext);

  // Create a timer context value first before using it in hooks
  const timerContextValue = useMemo(() => {
    // Format elapsed time for display
    const formatElapsedTime = (compact = false) => {
      if (!timerState.elapsedTime) return '00:00:00';
      
      const totalSeconds = Math.floor(timerState.elapsedTime / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      if (compact && hours === 0) {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    // Get display time for a task - combines actual time and current session time
    const getDisplayTime = (task: Task) => {
      if (!task) return '00:00:00';
      
      // Base time is the task's recorded actual time
      let baseTimeMs = 0;
      if (task.actual_time) {
        // Convert PostgreSQL interval to milliseconds
        baseTimeMs = typeof task.actual_time === 'number' ? task.actual_time * 1000 : 0;
      }
      
      // If this task is being timed currently, add the elapsed time
      if (timerState.taskId === task.id && timerState.status !== 'idle') {
        return formatMillisecondsToTime(baseTimeMs + (timerState.elapsedTime || 0));
      }
      
      return formatMillisecondsToTime(baseTimeMs);
    };
    
    return {
      timerState,
      startTimer: async () => {},
      pauseTimer: async () => {},
      resumeTimer: async () => {},
      stopTimer: async () => {},
      resetTimer: () => {},
      formatElapsedTime,
      getDisplayTime,
      clearTimerStorage
    };
  }, [timerState, clearTimerStorage]);
  
  // Now use the task actions hook, passing the timer context
  const taskActions = useTaskActions({
    refreshTasks: taskContext?.refreshTasks,
    showToasts: false,
    timerContext: timerContextValue
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

  // Periodically check for active sessions from other devices
  useEffect(() => {
    // Initial sync when component mounts
    syncWithRemote();
    
    // Set up an interval to check for remote timer sessions periodically
    syncIntervalRef.current = setInterval(() => {
      // Only sync if we're not currently timing something locally
      // This avoids overriding our active local session with a remote one
      if (timerState.status !== 'running') {
        syncWithRemote();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [syncWithRemote, timerState.status]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start the timer tick interval
  const startTimerTick = () => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Start a new interval to update the elapsed time
    intervalRef.current = setInterval(() => {
      // Get current state values
      if (timerState.status !== 'running' || !timerState.startTime) return;
      
      const now = Date.now();
      const elapsedSinceStart = now - timerState.startTime;
      const totalElapsed = elapsedSinceStart + (timerState.previouslyElapsed || 0);
      
      // Update state directly instead of using a function
      setTimerState({
        ...timerState,
        elapsedTime: totalElapsed,
        displayTime: formatMillisecondsToTime(totalElapsed)
      });
    }, 1000);
  };

  // Timer tick effect - updates the elapsed time while timer is running
  useEffect(() => {
    if (timerState.status === 'running' && timerState.startTime) {
      startTimerTick();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [timerState.status, timerState.startTime]);

  // Create a new time session in the database
  const createTimeSession = async (taskId: string) => {
    if (!currentUser) return null;
    
    try {
      const { data: session, error } = await supabase
        .from('time_sessions')
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          start_time: new Date().toISOString(),
          status: 'ACTIVE'
        })
        .select('id')
        .single();
        
      if (error) throw error;
      return session?.id || null;
    } catch (error) {
      console.error('Error creating time session:', error);
      return null;
    }
  };
  
  // Update a time session's status in the database
  const updateTimeSession = async (status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED') => {
    if (!timerState.sessionId) return;
    
    try {
      const updates: Record<string, any> = {};
      
      // If completing or cancelling, add end time and duration
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        const endTime = new Date().toISOString();
        const durationMs = timerState.elapsedTime || 0;
        
        updates.end_time = endTime;
        updates.duration = msToPostgresInterval(durationMs);
        updates.status = status; // Add status to the updates object
      } else {
        // Just update the status field
        updates.status = status;
      }
      
      console.log(`Updating time session ${timerState.sessionId} to ${status}`, updates);
      
      const { error } = await supabase
        .from('time_sessions')
        .update(updates)
        .eq('id', timerState.sessionId);
        
      if (error) {
        console.error(`Error updating time session: ${error.message}`);
        throw error;
      }
    } catch (error) {
      console.error(`Error updating time session to ${status}:`, error);
    }
  };

  // Update a task's actual time in the database
  const updateTaskTime = async (taskId: string, durationMs: number) => {
    if (!taskId) return;
    
    try {
      // Format the duration as a PostgreSQL interval
      const interval = msToPostgresInterval(durationMs);
      
      // Update the task
      const { error } = await supabase
        .from('tasks')
        .update({ actual_time: interval })
        .eq('id', taskId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating task time:', error);
    }
  };

  // Implement the actual timer functions with access to taskActions
  // Start timer for a task
  const startTimer = async (taskId: string) => {
    if (!taskId || !currentUser) return;
    
    try {
      // Update the task status to active
      await taskActions.updateTaskStatus(taskId, TaskStatus.ACTIVE);
      
      // Create a new time session
      const sessionId = await createTimeSession(taskId);
      if (!sessionId) throw new Error('Failed to create time session');
      
      // Start the timer
      const now = Date.now();
      setTimerState({
        status: 'running',
        taskId,
        sessionId,
        startTime: now,
        elapsedTime: 0,
        previouslyElapsed: 0,
        displayTime: '00:00:00'
      });
      
      // Start our timer tick
      startTimerTick();
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };
  
  // Pause the current timer
  const pauseTimer = async (taskStatus?: TaskStatusType) => {
    if (timerState.status !== 'running' || !timerState.taskId) return;
    
    try {
      // Calculate current elapsed time
      const now = Date.now();
      const currentElapsed = timerState.startTime 
        ? (now - timerState.startTime) + timerState.previouslyElapsed
        : timerState.previouslyElapsed;
      
      // Update the timer state
      setTimerState({
        ...timerState,
        status: 'paused',
        elapsedTime: currentElapsed,
        displayTime: formatMillisecondsToTime(currentElapsed)
      });
      
      // Update the time session status
      await updateTimeSession('PAUSED');
      
      // Update the task status if provided
      if (taskStatus) {
        await taskActions.updateTaskStatus(timerState.taskId, taskStatus);
      } else {
        await taskActions.updateTaskStatus(timerState.taskId, TaskStatus.PAUSED);
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  };
  
  // Resume a paused timer
  const resumeTimer = async () => {
    if (timerState.status !== 'paused' || !timerState.taskId) return;
    
    try {
      // Create a new session if needed
      let sessionId = timerState.sessionId;
      if (!sessionId) {
        sessionId = await createTimeSession(timerState.taskId);
      }
      
      // Update timer state
      const now = Date.now();
      setTimerState({
        ...timerState,
        status: 'running',
        startTime: now,
        sessionId,
        previouslyElapsed: timerState.elapsedTime || 0,
      });
      
      // Update session status if we still have the same session
      if (timerState.sessionId) {
        await updateTimeSession('ACTIVE');
      }
      
      // Update task status
      await taskActions.updateTaskStatus(timerState.taskId, TaskStatus.ACTIVE);
    } catch (error) {
      console.error('Error resuming timer:', error);
    }
  };
  
  // Stop the timer completely
  const stopTimer = async (finalStatus: TaskStatusType = TaskStatus.COMPLETED) => {
    if (timerState.status === 'idle' || !timerState.taskId) return;
    
    try {
      console.log(`Stopping timer for task ${timerState.taskId}`);
      
      // If running, pause it first to calculate the proper elapsed time
      if (timerState.status === 'running') {
        // Calculate final elapsed time
        const now = Date.now();
        const finalElapsed = timerState.startTime 
          ? (now - timerState.startTime) + (timerState.previouslyElapsed || 0)
          : timerState.elapsedTime;
        
        // Update the timer state directly to paused
        setTimerState({
          ...timerState,
          status: 'paused',
          elapsedTime: finalElapsed,
          displayTime: formatMillisecondsToTime(finalElapsed)
        });
      }
      
      // Get the final elapsed time from the current state
      const finalElapsed = timerState.elapsedTime || 0;
      
      // Update the task's actual time
      await updateTaskTime(timerState.taskId, finalElapsed);
      
      // Close the time session
      if (timerState.sessionId) {
        await updateTimeSession('COMPLETED');
      }
      
      // Update the task status
      await taskActions.updateTaskStatus(timerState.taskId, finalStatus);
      
      // Reset the timer state
      setTimerState({
        status: 'idle',
        taskId: null,
        sessionId: null,
        startTime: null,
        elapsedTime: 0,
        previouslyElapsed: 0,
        displayTime: '00:00:00'
      });
      
      console.log(`Timer stopped and task ${timerState.taskId} marked as ${finalStatus}`);
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  // Implement the pause timer function for completed tasks
  const completeTask = async (taskId: string) => {
    console.log(`Completing task ${taskId}`);
    
    // If this task is currently being timed, stop the timer
    if (timerState.taskId === taskId && timerState.status !== 'idle') {
      await stopTimer(TaskStatus.COMPLETED);
    } else {
      // Otherwise just update the status
      await taskActions.updateTaskStatus(taskId, TaskStatus.COMPLETED);
    }
  };

  // Reset the timer state without affecting DB
  const resetTimer = () => {
    setTimerState({
      status: 'idle',
      taskId: null,
      sessionId: null,
      startTime: null,
      elapsedTime: 0,
      previouslyElapsed: 0,
      displayTime: '00:00:00'
    });
  };
  
  // Create the complete timer context
  const timerContextComplete: TimerContextType = useMemo(() => ({
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    formatElapsedTime: timerContextValue.formatElapsedTime,
    getDisplayTime: timerContextValue.getDisplayTime,
    clearTimerStorage,
    completeTask
  }), [timerState, clearTimerStorage]);
  
  return (
    <TimerContext.Provider value={timerContextComplete}>
      {children}
    </TimerContext.Provider>
  );
};

// Custom hook to use the Timer Context
export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
