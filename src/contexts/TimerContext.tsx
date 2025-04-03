import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TaskContext } from './TaskContext'; 
import { Task, TaskStatus, TaskStatusType } from '../types/task';
import { User } from '@supabase/supabase-js';
import { useTaskActions } from '../hooks/useTaskActions';
import { useTimerPersistence, formatTime } from '../hooks/useTimerPersistence';
import { TimerState } from '../types/timer';

// Helper to convert milliseconds to PostgreSQL interval format (e.g., 'PT1H2M3S')
const msToInterval = (ms: number): string => {
  if (ms <= 0) return 'PT0S';
  const seconds = Math.floor(ms / 1000);
  // Simple format: 'X seconds'. More complex PG intervals exist.
  // Consider using a library or more robust conversion if needed.
  return `${seconds} seconds`; 
};

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

  // Update elapsed time when timer is running
  // Use useCallback to prevent recreation on every render
  const updateElapsedTime = useCallback(() => {
    if (timerState.status === 'running' && timerState.startTime) {
      const now = new Date().getTime();
      const currentSessionElapsed = now - timerState.startTime;
      
      setTimerState(prevState => ({
        ...prevState,
        elapsedTime: currentSessionElapsed, // Only the current session's time
        // Display time includes previous + current
        displayTime: formatTime(prevState.previouslyElapsed + currentSessionElapsed)
      }));
    }
  }, [timerState.status, timerState.startTime, setTimerState]); // Dependencies

  // Start/Stop the interval timer based on the status
  useEffect(() => {
    if (timerState.status === 'running') {
      // Clear existing interval just in case
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      // Immediately update display
      updateElapsedTime(); 
      
      // Start new interval
      const id = setInterval(updateElapsedTime, 1000);
      intervalRef.current = id;
      
      // Cleanup function for this effect
      return () => {
        clearInterval(id);
        intervalRef.current = null;
      };
    } else {
      // If status is not 'running', ensure interval is cleared
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [timerState.status, updateElapsedTime]); // Include updateElapsedTime

  // --- Core Timer Logic with Supabase Interaction ---

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

      // 2. Sum the durations (convert from interval string to seconds/ms)
      //    This currently assumes 'X seconds' format from msToInterval
      const totalSeconds = sessions.reduce((sum, session) => {
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

      const totalInterval = `${totalSeconds} seconds`; // Format back for Supabase

      // 3. Update the task's actual_time
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ actual_time: totalInterval })
        .eq('id', taskId);

      if (updateError) throw updateError;

      console.log(`Updated actual_time for task ${taskId} to ${totalInterval}`);

    } catch (error) {
      console.error('Error updating task actual_time:', error);
      // Consider user notification
    }
  };

  // Start timer for a task
  const startTimer = async (taskId: string) => {
    if (!currentUser) {
      console.error('Cannot start timer: user not logged in.');
      return; // Or throw error
    }
    if (timerState.status === 'running') {
      console.warn('Another timer is already running. Stopping it first.');
      // Decide if we should auto-stop or prevent starting
      // await stopTimer(); // Option: Stop existing timer first
       return; // Prevent starting if already running
    }

    const startTime = new Date().getTime();
    let newSessionId: string | null = null;

    try {
      // 1. Create new session record in Supabase
      const { data: newSession, error: insertError } = await supabase
        .from('time_sessions')
        .insert({
          task_id: taskId,
          user_id: currentUser.id,
          start_time: new Date(startTime).toISOString(),
          // end_time and duration are null initially
        })
        .select('id') // Select the ID of the newly created record
        .single(); // Expecting a single record back

      if (insertError) throw insertError;
      if (!newSession || !newSession.id) throw new Error('Failed to create session record or get ID.');
      
      newSessionId = newSession.id;

      // 2. Update task status to ACTIVE using the hook
      await taskActions.startTask(taskId);

      // 3. Update local state
      setTimerState({
        status: 'running',
        taskId: taskId,
        sessionId: newSessionId,
        startTime: startTime,
        elapsedTime: 0, // Reset elapsed time for the new session
        // previouslyElapsed remains the same when starting fresh
        previouslyElapsed: timerState.taskId === taskId ? timerState.previouslyElapsed : 0, 
        displayTime: formatTime(timerState.previouslyElapsed) // Initial display shows previous time
      });

      // No need to explicitly call startTimerInterval, useEffect handles it

    } catch (error) {
      console.error('Error starting timer:', error);
      // Rollback state? Reset local state if DB operations failed?
      setTimerState({ status: 'idle', taskId: null, sessionId: null, startTime: null, elapsedTime: 0, previouslyElapsed: 0, displayTime: '00:00:00' }); // Simple reset on error for now
      // Consider user notification
    }
  };

  // Pause the currently running timer
  const pauseTimer = async (taskStatus: TaskStatusType = TaskStatus.IN_PROGRESS) => {
    if (timerState.status !== 'running' || !timerState.sessionId || !timerState.startTime || !timerState.taskId) {
      console.warn('Cannot pause: Timer not running or state is invalid.');
      return;
    }

    const endTime = new Date().getTime();
    const currentSessionDurationMs = endTime - timerState.startTime;
    const currentSessionDurationInterval = msToInterval(currentSessionDurationMs);
    const totalElapsedMs = timerState.previouslyElapsed + currentSessionDurationMs;

    try {
      // 1. Update the session record in Supabase
      const { error: updateSessionError } = await supabase
        .from('time_sessions')
        .update({
          end_time: new Date(endTime).toISOString(),
          duration: currentSessionDurationInterval,
        })
        .eq('id', timerState.sessionId);

      if (updateSessionError) throw updateSessionError;

      // 2. Update task status using the provided status parameter
      await taskActions.updateTaskStatus(timerState.taskId, taskStatus);
      
      // 3. Update task's total actual_time in DB (still needed after session ends)
      await updateTaskActualTime(timerState.taskId);

      // 4. Update local state
      setTimerState(prevState => ({
        ...prevState,
        status: 'paused',
        startTime: null, // Clear start time as session ended
        elapsedTime: 0, // Reset current session elapsed time
        // Add the just-completed session's duration to previouslyElapsed
        previouslyElapsed: totalElapsedMs,
        displayTime: formatTime(totalElapsedMs) // Display reflects the new total
        // Keep taskId and sessionId potentially for resume?
      }));
      
      // Interval stopping is handled by useEffect

    } catch (error) {
      console.error('Error pausing timer:', error);
      // How to handle partial failures? State might be inconsistent.
      // Consider user notification
    }
  };

  // Resume timer from paused state
  const resumeTimer = async () => {
    // Can only resume if paused and we know the task ID
    if (timerState.status !== 'paused' || !timerState.taskId || !currentUser) {
        console.warn('Cannot resume: Timer not paused or task ID/user unknown.');
        return;
    }

    const startTime = new Date().getTime();
    let newSessionId: string | null = null;

    try {
        // 1. Create a *new* session record for the resumed period
        const { data: newSession, error: insertError } = await supabase
            .from('time_sessions')
            .insert({
                task_id: timerState.taskId,
                user_id: currentUser.id,
                start_time: new Date(startTime).toISOString(),
            })
            .select('id')
            .single();

        if (insertError) throw insertError;
        if (!newSession || !newSession.id) throw new Error('Failed to create resume session record.');

        newSessionId = newSession.id;

        // 2. Update task status to ACTIVE using the hook
        await taskActions.startTask(timerState.taskId); // startTask sets status to ACTIVE

        // 3. Update local timer state
        setTimerState(prevState => ({
            ...prevState, // Keep taskId and previouslyElapsed
            status: 'running',
            sessionId: newSessionId, // Use the new session ID
            startTime: startTime, // Set the new start time
            elapsedTime: 0, // Reset elapsed for this new session
            // displayTime will update via useEffect/updateElapsedTime
        }));
        
        // Interval starting is handled by useEffect

    } catch (error) {
        console.error('Error resuming timer:', error);
        // Consider resetting state or notifying user
    }
  };

  // Stop timer completely (e.g., when task is completed)
  const stopTimer = async (finalStatus: TaskStatusType = TaskStatus.PENDING) => {
    if (timerState.status === 'idle' || !timerState.taskId) return;
    const currentTaskId = timerState.taskId; // Store taskId before potential state changes

    try {
      // If timer is still running, pause it first to record the session
      if (timerState.status === 'running') {
        // We need to update the session end_time and task actual_time
        const endTime = new Date().toISOString();
        const { error: updateSessionError } = await supabase
          .from('time_sessions')
          .update({ end_time: endTime })
          .eq('id', timerState.sessionId);
        if (updateSessionError) throw updateSessionError;

        await updateTaskActualTime(currentTaskId);
      }

      // 2. Update task status to the final desired status using the hook
      // Use specific actions if available, otherwise use updateTaskStatus directly
      if (finalStatus === TaskStatus.COMPLETED) {
        await taskActions.completeTask(currentTaskId);
      } else if (finalStatus === TaskStatus.ARCHIVED) {
        await taskActions.archiveTask(currentTaskId);
      } else {
        // Fallback for other statuses if needed
        await taskActions.updateTaskStatus(currentTaskId, finalStatus);
      }

      // 3. Reset local timer state
      setTimerState({ status: 'idle', taskId: null, sessionId: null, startTime: null, elapsedTime: 0, previouslyElapsed: 0, displayTime: '00:00:00' });
      clearTimerStorage();

    } catch (err) {
      console.error("Exception in stopTimer:", err);
      // Should we attempt to reset local state even on error?
      setTimerState({ status: 'idle', taskId: null, sessionId: null, startTime: null, elapsedTime: 0, previouslyElapsed: 0, displayTime: '00:00:00' }); // Resetting locally anyway
      clearTimerStorage();
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
                return formatTime(seconds * 1000); 
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
