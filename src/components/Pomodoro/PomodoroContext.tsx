import React, { createContext, useContext, ReactNode } from 'react';
import { usePomodoro } from './usePomodoro';

// Define the type for the context value based on usePomodoro return type
type PomodoroContextType = ReturnType<typeof usePomodoro>;

// Create the context
const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

// Create the provider component
export const PomodoroProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const pomodoroState = usePomodoro();

  return (
    <PomodoroContext.Provider value={pomodoroState}>
      {children}
    </PomodoroContext.Provider>
  );
};

// Custom hook to use the Pomodoro context
export const usePomodoroContext = (): PomodoroContextType => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider');
  }
  return context;
};
