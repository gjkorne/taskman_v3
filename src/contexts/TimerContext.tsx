import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { TimerContextType, TimerState } from '../types/timer';

// Initial timer state
const initialTimerState: TimerState = {
  status: 'idle',
  taskId: null,
  sessionId: null,
  startTime: null,
  elapsedTime: 0,
  previouslyElapsed: 0
};

// Create context with default values
export const TimerContext = createContext<TimerContextType>({
  timerState: initialTimerState,
  startTimer: async () => {},
  pauseTimer: async () => {},
  stopTimer: async () => {},
  resetTimer: () => {},
  formatElapsedTime: () => '00:00:00',
});

// Timer Provider component
export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [timerState, setTimerState] = useState<TimerState>(initialTimerState);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

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
  
  // Convert elapsed milliseconds to PostgreSQL interval
  const msToPostgresInterval = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours} hours ${minutes} minutes ${seconds} seconds`;
  };
  
  // Start timing a task
  const startTimer = async (taskId: string) => {
    try {
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
      
      if (sessionError) throw sessionError;
      
      // Update task activity_state to in_progress and status to active
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          activity_state: 'in_progress',
          status: 'active'
        })
        .eq('id', taskId);
      
      if (taskError) throw taskError;
      
      // Calculate previous elapsed time if resuming
      const previousElapsed = 
        (timerState.status === 'paused' && timerState.taskId === taskId) 
          ? timerState.previouslyElapsed 
          : 0;
      
      // Start the timer immediately
      const now = new Date();
      setTimerState({
        status: 'running',
        taskId,
        sessionId: session.id,
        startTime: now,
        elapsedTime: previousElapsed, // Start with previous elapsed time if resuming
        previouslyElapsed: previousElapsed
      });
      
      // Force an immediate update
      setTimeout(updateElapsedTime, 0);
      
    } catch (error) {
      console.error('Error starting timer:', error);
      // Handle error appropriately (show notification, etc.)
    }
  };
  
  // Pause the current timing session
  const pauseTimer = async () => {
    if (timerState.status !== 'running' || !timerState.taskId || !timerState.sessionId) {
      return;
    }
    
    try {
      // Calculate current elapsed time before pausing
      const now = new Date();
      const currentElapsed = timerState.previouslyElapsed + 
        (timerState.startTime ? now.getTime() - timerState.startTime.getTime() : 0);
      const duration = msToPostgresInterval(currentElapsed);
      
      // Update the session with end time and duration
      const { error: sessionError } = await supabase
        .from('task_sessions')
        .update({
          end_time: now.toISOString(),
          duration
        })
        .eq('id', timerState.sessionId);
      
      if (sessionError) throw sessionError;
      
      // Update task activity_state to paused and status to in_progress
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          activity_state: 'paused',
          status: 'in_progress',
          actual_time: duration
        })
        .eq('id', timerState.taskId);
      
      if (taskError) throw taskError;
      
      // Update local timer state
      setTimerState(prev => ({
        ...prev,
        status: 'paused',
        elapsedTime: currentElapsed,
        previouslyElapsed: currentElapsed
      }));
    } catch (error) {
      console.error('Error pausing timer:', error);
      // Handle error appropriately
    }
  };
  
  // Complete the current timing session
  const stopTimer = async () => {
    if (!timerState.taskId || !timerState.sessionId) {
      return;
    }
    
    try {
      // Calculate final elapsed time
      const now = new Date();
      const finalElapsed = timerState.previouslyElapsed + 
        (timerState.startTime && timerState.status === 'running' 
          ? now.getTime() - timerState.startTime.getTime() 
          : 0);
      const duration = msToPostgresInterval(finalElapsed);
      
      // Update the session with end time and duration
      const { error: sessionError } = await supabase
        .from('task_sessions')
        .update({
          end_time: now.toISOString(),
          duration
        })
        .eq('id', timerState.sessionId);
      
      if (sessionError) throw sessionError;
      
      // Update task with completed status and reset activity_state to idle
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          activity_state: 'idle',
          actual_time: duration
        })
        .eq('id', timerState.taskId);
      
      if (taskError) throw taskError;
      
      // Reset timer state
      resetTimer();
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
    setTimerState(initialTimerState);
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
