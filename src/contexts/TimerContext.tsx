import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { TaskContext } from './TaskContext'; // Assuming TaskContext provides refreshTasks
import { Task, TaskStatus, TaskStatusType } from '../types/task';
import { User } from '@supabase/supabase-js';

// Helper to convert milliseconds to PostgreSQL interval format (e.g., 'PT1H2M3S')
// Supabase client might handle Date/ISO strings directly for intervals, but manual is safer
const msToInterval = (ms: number): string => {
  if (ms <= 0) return 'PT0S';
  const seconds = Math.floor(ms / 1000);
  // Simple format: 'X seconds'. More complex PG intervals exist.
  // Consider using a library or more robust conversion if needed.
  return `${seconds} seconds`; 
};

interface TimerState {
  status: 'idle' | 'running' | 'paused';
  taskId: string | null;
  sessionId: string | null; // ID of the current record in time_sessions
  startTime: number | null; // Time in milliseconds
  elapsedTime: number; // Milliseconds for the *current* session
  previouslyElapsed: number; // Milliseconds from *previous* sessions for this task
  displayTime: string; // Formatted HH:MM:SS of total time (previouslyElapsed + elapsedTime)
}

interface TimerContextType {
  timerState: TimerState;
  startTimer: (taskId: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>; // Added resume function
  stopTimer: (finalStatus?: TaskStatusType) => Promise<void>; // Can set final status (e.g., completed)
  resetTimer: () => void;
  formatElapsedTime: () => string; // Consider renaming? Maybe formatTotalTime?
  getDisplayTime: (task: Task) => string;
  loadTimerState: () => void;
  clearTimerStorage: () => void;
}

// Create Context with a default undefined value
const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Factory function for getting initial timer state
function getInitialState(): TimerState {
  return {
    status: 'idle',
    taskId: null,
    sessionId: null,
    startTime: null,
    elapsedTime: 0,
    previouslyElapsed: 0,
    displayTime: '00:00:00'
  };
}

// Load initial state from localStorage if available
const loadInitialState = (): TimerState => {
  if (typeof window === 'undefined') {
    return getInitialState();
  }
  
  try {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      
      // Convert string date back to Date object
      if (parsed.startTime) {
        parsed.startTime = new Date(parsed.startTime).getTime();
      }
      
      // Recalculate displayTime based on loaded elapsed/previous times
      parsed.displayTime = formatTime(parsed.elapsedTime + parsed.previouslyElapsed);
      
      console.log('Loaded timer state from storage:', parsed);
      return parsed; 
    }
  } catch (e) {
    console.error('Error loading timer state from localStorage:', e);
  }
  
  return getInitialState();
};

// Utility function for formatting time (remains mostly the same)
const formatTime = (totalMs: number): string => {
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

// Timer Provider component
export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [timerState, setTimerState] = useState<TimerState>(loadInitialState);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get task context to update UI after timer actions
  const taskContext = useContext(TaskContext);

  // Function to ensure task list updates after timer actions
  const refreshTasksAfterAction = async () => {
    // Wait a small delay to ensure DB operations complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force a task list refresh
    if (taskContext) {
      console.log('Refreshing tasks after timer action');
      await taskContext.refreshTasks();
    }
  };
  
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

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stateToSave = {
        ...timerState,
        // Convert Date to ISO string for serialization
        startTime: timerState.startTime ? new Date(timerState.startTime).toISOString() : null
      };
      // No need to save displayTime, it's derived
      delete (stateToSave as any).displayTime; 
      localStorage.setItem('timerState', JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving timer state to localStorage:', e);
    }
  }, [timerState]);

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
  }, [timerState.status, timerState.startTime]); // Dependencies

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

      // 2. Update task status to 'active'
      const { error: statusError } = await supabase
        .from('tasks')
        .update({ status: TaskStatus.ACTIVE })
        .eq('id', taskId);

      if (statusError) throw statusError;

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
      
      // Refresh task list in UI
      await refreshTasksAfterAction();

    } catch (error) {
      console.error('Error starting timer:', error);
      // Rollback state? Reset local state if DB operations failed?
      setTimerState(getInitialState()); // Simple reset on error for now
      // Consider user notification
    }
  };

  // Pause the currently running timer
  const pauseTimer = async () => {
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

      // 2. Update task status to 'paused'
      const { error: statusError } = await supabase
        .from('tasks')
        .update({ status: TaskStatus.PAUSED })
        .eq('id', timerState.taskId);
        
      if (statusError) throw statusError;
      
      // 3. Update task's total actual_time (using helper for robustness)
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

      // Refresh task list in UI
      await refreshTasksAfterAction();

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

        // 2. Update task status back to 'active'
        const { error: statusError } = await supabase
            .from('tasks')
            .update({ status: TaskStatus.ACTIVE })
            .eq('id', timerState.taskId);

        if (statusError) throw statusError;

        // 3. Update local state
        setTimerState(prevState => ({
            ...prevState, // Keep taskId and previouslyElapsed
            status: 'running',
            sessionId: newSessionId, // Use the new session ID
            startTime: startTime, // Set the new start time
            elapsedTime: 0, // Reset elapsed for this new session
            // displayTime will update via useEffect/updateElapsedTime
        }));
        
        // Interval starting is handled by useEffect

        // Refresh task list in UI
        await refreshTasksAfterAction();

    } catch (error) {
        console.error('Error resuming timer:', error);
        // Consider resetting state or notifying user
    }
  };

  // Stop timer completely (e.g., when task is completed)
  const stopTimer = async (finalStatus: TaskStatusType = TaskStatus.COMPLETED) => {
    // If timer was running, first pause it to log the final session
    if (timerState.status === 'running') {
        try {
            await pauseTimer(); // Reuse pause logic to end the session
            // Note: pauseTimer already updates actual_time
        } catch (error) {
            console.error('Error during pause step in stopTimer:', error);
            // Decide if we should proceed or abort stopping
            // return; // Option: abort if pausing failed
        }
    }
    // Even if paused, we might want to set a final status
    if (timerState.taskId) {
        try {
             // Update task status to the final desired status
            const { error: statusError } = await supabase
                .from('tasks')
                .update({ status: finalStatus })
                .eq('id', timerState.taskId);

            if (statusError) throw statusError;
            
             // If final status requires it, ensure actual_time is up-to-date
             // (pauseTimer should have done this if timer was running)
             if (timerState.status === 'paused') {
                 await updateTaskActualTime(timerState.taskId);
             }

            // Reset local state completely
            setTimerState(getInitialState());
            localStorage.removeItem('timerState'); // Clear storage too

            // Refresh task list in UI
            await refreshTasksAfterAction();

        } catch (error) {
            console.error(`Error setting final status (${finalStatus}) or resetting timer:`, error);
            // Maybe just reset local state anyway?
             setTimerState(getInitialState());
             localStorage.removeItem('timerState');
        }
    } else {
         // If no task ID, just reset local state
         setTimerState(getInitialState());
         localStorage.removeItem('timerState');
    }
  };

  // Reset local timer state without affecting DB
  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerState(getInitialState());
    localStorage.removeItem('timerState'); // Clear storage
  };

  // Loads state from storage (useful if localStorage wasn't read initially)
  const loadTimerState = () => {
      setTimerState(loadInitialState());
  };
  
  // Clears timer state from storage
  const clearTimerStorage = () => {
      localStorage.removeItem('timerState');
  };
  
  // Format total time for display (previously formatElapsedTime)
  const formatTotalTime = useCallback(() => {
      // This uses the state's displayTime which is updated by the interval
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
    resumeTimer, // Expose resumeTimer
    stopTimer,
    resetTimer,
    formatElapsedTime: formatTotalTime, // Use the renamed function
    getDisplayTime,
    loadTimerState,
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
