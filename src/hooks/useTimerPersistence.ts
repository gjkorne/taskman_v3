import { useState, useEffect, useCallback } from 'react';
import { TimerState } from '../types/timer';
import { formatMillisecondsToTime } from '../utils/timeUtils';
import { timeSessionsService } from '../services/api/timeSessionsService';

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
      displayTime: '00:00:00',
    });

    try {
      const savedState = localStorage.getItem('taskman_timerState');
      if (savedState) {
        const parsed = JSON.parse(savedState);

        // Convert string date back to number (timestamp)
        if (parsed.startTime) {
          parsed.startTime = new Date(parsed.startTime).getTime();
        }

        // Recalculate displayTime based on loaded elapsed/previous times
        parsed.displayTime = formatMillisecondsToTime(
          parsed.elapsedTime + parsed.previouslyElapsed
        );

        return parsed;
      }
    } catch (e) {
      console.error('Error loading timer state from localStorage:', e);
    }

    return getInitialState();
  };

  // Initialize state with data from localStorage
  const [state, setState] = useState<TimerState>(loadInitialState());
  // Track if we've synced with remote
  const [hasSyncedWithRemote, setHasSyncedWithRemote] = useState(false);

  // Create a function to update state that also handles formatting display time
  const updateState = (newState: Partial<TimerState>) => {
    setState((prevState) => {
      // Calculate the total elapsed time
      const totalElapsed =
        (newState.elapsedTime ?? prevState.elapsedTime) +
        (newState.previouslyElapsed ?? prevState.previouslyElapsed);

      // Calculate new display time
      const displayTime = formatMillisecondsToTime(totalElapsed);

      return {
        ...prevState,
        ...newState,
        displayTime,
      };
    });
  };

  // Function to check for active sessions in Supabase and sync with local state
  const syncWithRemote = useCallback(async () => {
    try {
      // Check for active sessions in Supabase
      const activeSession = await timeSessionsService.getActiveSession();

      // If there's an active session in Supabase
      if (activeSession) {
        console.log('Found active remote session:', activeSession);

        // Calculate elapsed time since session start
        const startTime = new Date(activeSession.start_time).getTime();
        const now = new Date().getTime();
        const elapsedMs = now - startTime;

        // Update local timer state to match remote state
        updateState({
          status: 'running',
          taskId: activeSession.task_id,
          sessionId: activeSession.id,
          startTime: startTime,
          elapsedTime: elapsedMs,
          previouslyElapsed: state.previouslyElapsed, // Keep any previously accumulated time
        });

        console.log('Synced timer with remote session');
      } else if (state.status === 'running') {
        // No active sessions in Supabase, but we have a running timer locally
        // This could happen if the timer was started on this device but not synced to Supabase yet
        console.log(
          'No active remote sessions found, but local timer is running'
        );
      }

      setHasSyncedWithRemote(true);
    } catch (error) {
      console.error('Error syncing with remote timer state:', error);
      setHasSyncedWithRemote(true); // Mark as synced anyway to prevent repeated attempts
    }
  }, [state.previouslyElapsed]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('taskman_timerState', JSON.stringify(state));
    } catch (e) {
      console.error('Error saving timer state to localStorage:', e);
    }
  }, [state]);

  // On first mount, sync with remote state
  useEffect(() => {
    if (!hasSyncedWithRemote) {
      syncWithRemote();
    }
  }, [syncWithRemote, hasSyncedWithRemote]);

  // Function to clear timer storage
  const clearTimerStorage = () => {
    localStorage.removeItem('taskman_timerState');
  };

  return {
    state,
    setState: updateState,
    clearTimerStorage,
    syncWithRemote,
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
    String(seconds).padStart(2, '0'),
  ].join(':');
};
