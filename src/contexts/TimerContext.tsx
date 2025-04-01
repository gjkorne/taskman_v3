import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { TaskContext } from './TaskContext';
import { Task } from '../types/task';

interface TimerState {
  status: 'idle' | 'running' | 'paused';
  taskId: string | null;
  sessionId: string | null;
  startTime: Date | null;
  elapsedTime: number;
  previouslyElapsed: number;
}

interface TimerContextType {
  timerState: TimerState;
  startTimer: (taskId: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  resetTimer: () => void;
  formatElapsedTime: () => string;
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
    previouslyElapsed: 0
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
  
  return getInitialState();
};

// Timer Provider component
export const TimerProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state with saved values if available
  const [timerState, setTimerState] = useState<TimerState>(loadInitialState);
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
  
  // Helper utility to save timer state to localStorage
  const saveTimerState = (state: TimerState) => {
    try {
      const stateToSave = {
        ...state,
        startTime: state.startTime ? state.startTime.toISOString() : null
      };
      localStorage.setItem('timerState', JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving timer state to localStorage:', e);
    }
  };

  // Start the timer interval for updating elapsed time
  const startTimerInterval = () => {
    // Clear any existing interval
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
    
    // Set up interval to update elapsed time every second
    const newIntervalId = setInterval(updateElapsedTime, 1000);
    setIntervalId(newIntervalId);
  };

  // Update elapsed time based on current timer state
  const updateElapsedTime = () => {
    if (timerState.status === 'running' && timerState.startTime) {
      const now = new Date();
      const elapsed = now.getTime() - timerState.startTime.getTime();
      
      setTimerState(prevState => ({
        ...prevState,
        elapsedTime: elapsed
      }));
    }
  };
  
  // Utility functions for timer display
  const formatElapsedTime = () => {
    // Calculate total elapsed time
    let totalMs = timerState.previouslyElapsed;
    
    // Add current session time if timer is running
    if (timerState.status === 'running' && timerState.startTime) {
      const now = new Date();
      totalMs += now.getTime() - timerState.startTime.getTime();
    }
    
    // Convert to hours, minutes, seconds
    const totalSeconds = Math.floor(totalMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    // Format as HH:MM:SS
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };
  
  // Start timer for a task
  const startTimer = async (taskId: string) => {
    try {
      console.log('Starting timer for task:', taskId);
      
      // Stop any existing timer
      if (timerState.status === 'running' && timerState.taskId && timerState.taskId !== taskId) {
        await pauseTimer();
      }
      
      // Check if we're resuming the same task
      const resumingSameTask = timerState.taskId === taskId && timerState.status === 'paused';
      
      if (!resumingSameTask) {
        // Create a new session
        const { data: session, error } = await supabase
          .from('task_sessions')
          .insert({
            task_id: taskId,
            start_time: new Date().toISOString(),
            created_by: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();
        
        if (error) {
          console.error('Session creation error:', error);
          throw error;
        }
        
        console.log('Created session:', session);
        
        // Update task status to active
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ 
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
          elapsedTime: 0,
          previouslyElapsed: previousElapsed
        });
        
        // Start timer interval
        startTimerInterval();
        
        // Save timer state to localStorage
        saveTimerState({
          status: 'running',
          taskId,
          sessionId: session.id,
          startTime: now,
          elapsedTime: 0,
          previouslyElapsed: previousElapsed
        });
      } else {
        // We're resuming a paused task
        console.log('Resuming paused task:', taskId);
        
        // Create a new session for the resumed task
        const { data: session, error } = await supabase
          .from('task_sessions')
          .insert({
            task_id: taskId,
            start_time: new Date().toISOString(),
            created_by: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();
        
        if (error) {
          console.error('Session creation error on resume:', error);
          throw error;
        }
        
        // Update task status from paused to active
        const { error: taskError } = await supabase
          .from('tasks')
          .update({ 
            status: 'active'
          })
          .eq('id', taskId);
        
        if (taskError) {
          console.error('Task update error on resume:', taskError);
          throw taskError;
        }
        
        // Start the timer
        const now = new Date();
        
        setTimerState({
          status: 'running',
          taskId,
          sessionId: session.id,
          startTime: now,
          elapsedTime: 0,
          previouslyElapsed: timerState.previouslyElapsed
        });
        
        // Start timer interval
        startTimerInterval();
        
        // Save timer state to localStorage
        saveTimerState({
          status: 'running',
          taskId,
          sessionId: session.id,
          startTime: now,
          elapsedTime: 0,
          previouslyElapsed: timerState.previouslyElapsed
        });
      }
      
      // Refresh tasks to update UI
      if (taskContext) {
        console.log('Refreshing tasks after starting timer');
        await taskContext.refreshTasks();
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      // Handle error appropriately
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
      const elapsed = timerState.startTime ? 
        new Date().getTime() - timerState.startTime.getTime() : 0;
      
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
      
      // Update task status to paused
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'paused',
          actual_time: duration
        })
        .eq('id', timerState.taskId);
      
      if (taskError) {
        console.error('Error updating task:', taskError);
        throw taskError;
      }
      
      console.log('Task and session paused successfully');
      
      // Update timer state
      const newState: TimerState = {
        ...timerState,
        status: 'paused',
        elapsedTime: elapsed,
        previouslyElapsed: duration,
        startTime: null
      };
      
      setTimerState(newState);
      
      // Save the updated state to localStorage
      saveTimerState(newState);
      
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
      if (timerState.status === 'idle' || !timerState.taskId || !timerState.sessionId) {
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
      const newState = getInitialState();
      setTimerState(newState);
      
      // Save the reset state to localStorage
      saveTimerState(newState);
      
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
  
  // Reset the timer state (for admin purposes)
  const resetTimer = () => {
    // Clear any active interval
    if (intervalId !== null) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    // Reset to initial state
    const newState = getInitialState();
    setTimerState(newState);
    
    // Save to localStorage
    saveTimerState(newState);
    
    console.log('Timer reset to initial state');
  };
  
  // Get display time for a task
  const getDisplayTime = (task: Task) => {
    if (task.actual_time) {
      const totalMs = task.actual_time;
      const totalSeconds = Math.floor(totalMs / 1000);
      
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');
    }
    
    return '00:00:00';
  };
  
  // Load timer state from storage
  const loadTimerState = () => {
    setTimerState(loadInitialState);
  };
  
  // Clear timer storage
  const clearTimerStorage = () => {
    localStorage.removeItem('timerState');
    setTimerState(getInitialState);
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
        getDisplayTime,
        loadTimerState,
        clearTimerStorage,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

// Export the hook for using the Timer context
export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
