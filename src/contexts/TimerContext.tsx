import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { TimerContextType, TimerState } from '../types/timer';
import { TaskContext } from './TaskContext';

// Load initial state from localStorage if available
const getInitialState = (): TimerState => {
  if (typeof window === 'undefined') {
    return {
      status: 'idle',
      taskId: null,
      sessionId: null,
      startTime: null,
      elapsedTime: 0,
      previouslyElapsed: 0
    };
  }
  
  try {
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      
      // Convert string date back to Date object if needed
      if (parsed.startTime) {
        parsed.startTime = new Date(parsed.startTime);
      }
      
      console.log('Loaded timer state from storage:', parsed);
      return parsed;
    }
  } catch (e) {
    console.error('Error loading timer state from localStorage:', e);
  }
  
  return {
    status: 'idle',
    taskId: null,
    sessionId: null,
    startTime: null,
    elapsedTime: 0,
    previouslyElapsed: 0
  };
};

// Create context with default values
export const TimerContext = createContext<TimerContextType>({
  timerState: getInitialState(),
  startTimer: async () => {},
  pauseTimer: async () => {},
  stopTimer: async () => {},
  formatElapsedTime: () => '',
  resetTimer: () => {}
});

// Timer Provider component
export const TimerProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state with saved values if available
  const [timerState, setTimerState] = useState<TimerState>(getInitialState);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  // Access the task context to refresh tasks after timer operations
  const taskContext = useContext(TaskContext);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    // Skip if we're in a server-side rendering environment
    if (typeof window === 'undefined') return;
    
    try {
      // Create a serializable version of the state (Date objects need special handling)
      const stateToSave = {
        ...timerState,
        startTime: timerState.startTime ? timerState.startTime.toISOString() : null
      };
      
      console.log('Saving timer state to storage:', stateToSave);
      localStorage.setItem('timerState', JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving timer state to localStorage:', e);
    }
  }, [timerState]);

  // Update elapsed time when timer is running
  useEffect(() => {
    if (timerState.status === 'running' && timerState.startTime) {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      // Immediately update elapsed time
      updateElapsedTime();
      
      // Set up interval for continuous updates
      const id = setInterval(updateElapsedTime, 1000);
      setIntervalId(id);
      
      return () => {
        clearInterval(id);
        setIntervalId(null);
      };
    }
  }, [timerState.status, timerState.startTime]);
  
  // Function to update elapsed time
  const updateElapsedTime = () => {
    if (timerState.startTime) {
      const now = new Date();
      const elapsed = now.getTime() - timerState.startTime.getTime() + timerState.previouslyElapsed;
      
      setTimerState(prev => ({
        ...prev,
        elapsedTime: elapsed
      }));
    }
  };
  
  // Format elapsed time as HH:MM:SS or compact version
  const formatElapsedTime = (format: 'short' | 'long' = 'long'): string => {
    const totalSeconds = Math.floor(timerState.elapsedTime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (format === 'short') {
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }
    }
    
    // Long format (HH:MM:SS)
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };
  
  // Start timing a task
  const startTimer = async (taskId: string) => {
    try {
      console.log(`Starting timer for task: ${taskId}`);
      
      // If we're timing a different task, stop that one first
      if (timerState.status !== 'idle' && timerState.taskId && timerState.taskId !== taskId) {
        await stopTimer();
      }
      
      // Create a new session
      const { data: session, error: sessionError } = await supabase
        .from('task_sessions')
        .insert({
          task_id: taskId,
          start_time: new Date().toISOString(),
          created_by: (await supabase.auth.getSession()).data.session?.user.id
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw sessionError;
      }
      
      console.log('Created session:', session);
      
      // Update task activity_state to in_progress and status to active
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          activity_state: 'in_progress',
          status: 'active'
        })
        .eq('id', taskId);
      
      if (taskError) {
        console.error('Task update error:', taskError);
        throw taskError;
      }
      
      console.log('Updated task status successfully');
      
      // Calculate previous elapsed time if resuming
      const previousElapsed = 
        (timerState.status === 'paused' && timerState.taskId === taskId) 
          ? timerState.previouslyElapsed 
          : 0;
      
      // Start the timer immediately
      const now = new Date();
      
      console.log('Setting timer state to running with sessionId:', session.id);
      
      setTimerState({
        status: 'running',
        taskId,
        sessionId: session.id,
        startTime: now,
        elapsedTime: previousElapsed,
        previouslyElapsed: previousElapsed
      });
      
      // Force an immediate update
      setTimeout(updateElapsedTime, 0);
      
      // Refresh task list to update UI
      if (taskContext) {
        console.log('Refreshing task list after starting timer');
        await taskContext.refreshTasks();
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      // Handle error appropriately (show notification, etc.)
    }
  };
  
  // Pause current timer
  const pauseTimer = async () => {
    try {
      // Only proceed if timer is running
      if (timerState.status !== 'running' || !timerState.taskId || !timerState.sessionId) {
        return;
      }
      
      console.log('Pausing timer for session:', timerState.sessionId);
      
      // Calculate elapsed time
      const elapsed = calculateElapsed();
      
      // Add elapsed time to total
      const duration = elapsed + timerState.previouslyElapsed;
      
      // Update session end time
      const { error: sessionError } = await supabase
        .from('task_sessions')
        .update({ 
          end_time: new Date().toISOString(),
          duration
        })
        .eq('id', timerState.sessionId);
      
      if (sessionError) {
        console.error('Error updating session:', sessionError);
        throw sessionError;
      }
      
      // Update task activity_state to paused and status to in_progress
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          activity_state: 'paused',
          status: 'in_progress',  // Set status to in_progress when paused
          actual_time: duration
        })
        .eq('id', timerState.taskId);
      
      if (taskError) {
        console.error('Error updating task:', taskError);
        throw taskError;
      }
      
      console.log('Task and session paused successfully');
      
      // Update timer state
      setTimerState({
        ...timerState,
        status: 'paused',
        elapsedTime: elapsed,
        previouslyElapsed: duration,
        startTime: null
      });
      
      // Clear the interval
      if (intervalId !== null) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      // Refresh task list to update UI
      if (taskContext) {
        console.log('Refreshing task list after pausing timer');
        await taskContext.refreshTasks();
      }
    } catch (error) {
      console.error('Error pausing timer:', error);
      // Handle error appropriately
    }
  };
  
  // Stop and complete the current task
  const stopTimer = async () => {
    try {
      // Only proceed if the timer is active and we have task and session IDs
      if ((timerState.status === 'idle') || !timerState.taskId || !timerState.sessionId) {
        return;
      }
      
      console.log('Stopping timer for task:', timerState.taskId);
      
      // Calculate total elapsed time
      let totalElapsed = timerState.previouslyElapsed;
      
      // Add current session time if timer is running
      if (timerState.status === 'running' && timerState.startTime) {
        const now = new Date();
        totalElapsed += now.getTime() - timerState.startTime.getTime();
      }
      
      // Update session with end time and duration
      const { error: sessionError } = await supabase
        .from('task_sessions')
        .update({ 
          end_time: new Date().toISOString(),
          duration: totalElapsed
        })
        .eq('id', timerState.sessionId);
      
      if (sessionError) {
        console.error('Error updating session:', sessionError);
        throw sessionError;
      }
      
      console.log('Session completed successfully');
      
      // Update task as completed with final time
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          activity_state: 'completed',
          actual_time: totalElapsed,
          completed_date: new Date().toISOString()
        })
        .eq('id', timerState.taskId);
      
      if (taskError) {
        console.error('Error updating task:', taskError);
        throw taskError;
      }
      
      console.log('Task marked as completed');
      
      // Reset timer state to idle
      setTimerState(getInitialState());
      
      // Clear the interval if it's running
      if (intervalId !== null) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      // Refresh task list to update UI
      if (taskContext) {
        console.log('Refreshing task list after completing task');
        await taskContext.refreshTasks();
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      // Handle error appropriately
    }
  };
  
  // Reset the timer state without affecting the database
  const resetTimer = () => {
    // Clear interval if running
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    // Reset state
    setTimerState(getInitialState);
  };
  
  // Calculate elapsed time
  const calculateElapsed = () => {
    if (timerState.startTime) {
      const now = new Date();
      return now.getTime() - timerState.startTime.getTime();
    }
    
    return 0;
  };
  
  return (
    <TimerContext.Provider
      value={{
        timerState,
        startTimer,
        pauseTimer,
        stopTimer,
        resetTimer,
        formatElapsedTime,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

// Custom hook to use timer context
export const useTimer = () => useContext(TimerContext);
