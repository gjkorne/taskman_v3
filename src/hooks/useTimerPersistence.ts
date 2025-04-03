import { useState, useEffect } from 'react';
import { TimerState } from '../types/timer';
import { formatMillisecondsToTime } from '../utils/timeUtils';

/**
 * A custom hook that manages persistence of timer state to localStorage
 * Handles saving, loading, and clearing timer state
 */
export const useTimerPersistence = () => {
  // Get initial state from localStorage
  const loadInitialState = (): TimerState => {
    // Default state if nothing is found in storage
    const getInitialState = (): TimerState => ({
      status: 'idle',
      taskId: null,
      sessionId: null,
      startTime: null,
      elapsedTime: 0,
      previouslyElapsed: 0,
      displayTime: '00:00:00'
    });
    
    try {
      const savedState = localStorage.getItem('timerState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        
        // Convert string date back to number (timestamp)
        if (parsed.startTime) {
          parsed.startTime = new Date(parsed.startTime).getTime();
        }
        
        // Recalculate displayTime based on loaded elapsed/previous times
        parsed.displayTime = formatMillisecondsToTime(parsed.elapsedTime + parsed.previouslyElapsed);
        
        return parsed; 
      }
    } catch (e) {
      console.error('Error loading timer state from localStorage:', e);
    }
    
    return getInitialState();
  };
  
  // Initialize state with data from localStorage
  const [state, setState] = useState<TimerState>(loadInitialState());
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('timerState', JSON.stringify(state));
    } catch (e) {
      console.error('Error saving timer state to localStorage:', e);
    }
  }, [state]);
  
  // Create a function to update state that also handles formatting display time
  const updateState = (newState: Partial<TimerState>) => {
    setState(prevState => {
      // Calculate the total elapsed time
      const totalElapsed = (newState.elapsedTime ?? prevState.elapsedTime) + 
                          (newState.previouslyElapsed ?? prevState.previouslyElapsed);
      
      // Calculate new display time
      const displayTime = formatMillisecondsToTime(totalElapsed);
      
      return { 
        ...prevState, 
        ...newState,
        displayTime
      };
    });
  };
  
  // Function to clear timer storage
  const clearTimerStorage = () => {
    localStorage.removeItem('timerState');
  };
  
  return {
    state,
    setState: updateState,
    clearTimerStorage
  };
};

/**
 * @deprecated Use formatMillisecondsToTime from timeUtils.ts instead
 */
export const formatTime = (totalMs: number): string => {
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return [
    String(hours).padStart(2, '0'), 
    String(minutes).padStart(2, '0'), 
    String(seconds).padStart(2, '0')
  ].join(':');
};
