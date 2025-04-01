import { useState, useEffect } from 'react';
import { TimerState } from '../types/timer';

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
        parsed.displayTime = formatTime(parsed.elapsedTime + parsed.previouslyElapsed);
        
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
  
  // Clear timer state from localStorage
  const clearTimerStorage = () => {
    try {
      localStorage.removeItem('timerState');
      setState(loadInitialState());
    } catch (e) {
      console.error('Error clearing timer state from localStorage:', e);
    }
  };
  
  // Force reload state from localStorage
  const reloadState = () => {
    setState(loadInitialState());
  };
  
  return {
    state,
    setState,
    clearTimerStorage,
    reloadState
  };
};

// Utility function for formatting time
export const formatTime = (totalMs: number): string => {
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
