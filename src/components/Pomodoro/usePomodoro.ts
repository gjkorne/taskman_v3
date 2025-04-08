import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings, defaultSettings } from '../../contexts/SettingsContext';

type PomodoroMode = 'work' | 'break' | 'idle';

interface PomodoroState {
  mode: PomodoroMode;
  workDuration: number; // minutes
  breakDuration: number; // minutes
  remainingTime: number; // seconds
  isRunning: boolean;
  workSessionsCompleted: number;
  breakSessionsCompleted: number;
}

export const usePomodoro = () => {
  const { settings, isLoading } = useSettings();

  // Ensure we have valid default values
  const DEFAULT_WORK_MINUTES = 25;
  const DEFAULT_BREAK_MINUTES = 5;

  const [state, setState] = useState<PomodoroState>(() => ({
    mode: 'idle',
    // Use safe fallbacks for initial state
    workDuration: defaultSettings.pomodoroWorkDuration || DEFAULT_WORK_MINUTES,
    breakDuration: defaultSettings.pomodoroBreakDuration || DEFAULT_BREAK_MINUTES,
    remainingTime: (defaultSettings.pomodoroWorkDuration || DEFAULT_WORK_MINUTES) * 60, // seconds
    isRunning: false,
    workSessionsCompleted: 0,
    breakSessionsCompleted: 0,
  }));

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const expectedRef = useRef<number | null>(null);

  // Effect to update durations from settings when loaded or changed
  useEffect(() => {
    if (!isLoading) {
      setState(prevState => {
        // Ensure we have valid values with fallbacks
        const newWorkDuration = settings.pomodoroWorkDuration || DEFAULT_WORK_MINUTES;
        const newBreakDuration = settings.pomodoroBreakDuration || DEFAULT_BREAK_MINUTES;

        return {
          ...prevState,
          workDuration: newWorkDuration,
          breakDuration: newBreakDuration,
          // Only update remaining time if idle
          remainingTime: prevState.mode === 'idle' ? newWorkDuration * 60 : prevState.remainingTime,
        };
      });
    }
  }, [settings.pomodoroWorkDuration, settings.pomodoroBreakDuration, isLoading]);

  const tick = useCallback(() => {
    const currentExpected = expectedRef.current;

    if (currentExpected === null) {
      if (state.isRunning) {
        expectedRef.current = Date.now() + 1000;
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }
    }

    const drift = currentExpected ? Date.now() - currentExpected : 0;
    const nextTickDelay = Math.max(0, 1000 - drift);

    setState(prevState => {
      if (!prevState.isRunning || prevState.remainingTime <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        expectedRef.current = null;
        return prevState;
      }

      const newRemainingTime = prevState.remainingTime - 1;

      if (newRemainingTime <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        expectedRef.current = null;

        if (prevState.mode === 'work') {
          const nextBreakSessions = prevState.breakSessionsCompleted + 1;
          return {
            ...prevState,
            mode: 'break',
            remainingTime: prevState.breakDuration * 60,
            isRunning: false,
            workSessionsCompleted: prevState.workSessionsCompleted + 1,
            breakSessionsCompleted: nextBreakSessions,
          };
        } else {
          return {
            ...prevState,
            mode: 'work',
            remainingTime: prevState.workDuration * 60,
            isRunning: false,
          };
        }
      } else {
        expectedRef.current = (expectedRef.current ?? Date.now()) + 1000;

        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setTimeout(tick, nextTickDelay);

        return {
          ...prevState,
          remainingTime: newRemainingTime,
        };
      }
    });
  }, [state.isRunning]);

  const startTimer = useCallback(() => {
    if (state.isRunning) return;

    const initialMode = state.mode === 'idle' ? 'work' : state.mode;
    const initialTime = state.mode === 'idle' ? state.workDuration * 60 : state.remainingTime;

    setState(prev => ({
      ...prev,
      mode: initialMode,
      remainingTime: initialTime > 0 ? initialTime : (initialMode === 'work' ? prev.workDuration : prev.breakDuration) * 60,
      isRunning: true,
    }));

    expectedRef.current = Date.now() + 1000;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      clearTimeout(intervalRef.current);
    }
    intervalRef.current = setTimeout(tick, 1000);
  }, [state.isRunning, state.mode, state.remainingTime, state.workDuration, state.breakDuration, tick]);

  const pauseTimer = useCallback(() => {
    if (!state.isRunning) return;

    setState(prev => ({ ...prev, isRunning: false }));
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      clearTimeout(intervalRef.current);
    }
    intervalRef.current = null;
    expectedRef.current = null;
  }, [state.isRunning]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      clearTimeout(intervalRef.current);
    }
    intervalRef.current = null;
    expectedRef.current = null;
    setState(prev => ({
      ...prev,
      mode: 'work',
      remainingTime: prev.workDuration * 60,
      isRunning: false,
      workSessionsCompleted: 0,
      breakSessionsCompleted: 0,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  // Helper to safely format time even if input is invalid
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) {
      console.warn('Invalid time value in Pomodoro timer:', seconds);
      return '00:00'; // Return default display for invalid values
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...state,
    startTimer,
    pauseTimer,
    resetTimer,
    formatTime, // Add the formatTime helper to the returned object
  };
};
