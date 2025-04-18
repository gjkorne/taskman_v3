import { createContext, useContext, ReactNode } from 'react';
import { useTimer as useTimerCompat } from '../TimerCompat';

// Data context interface
export interface TimerDataContextType {
  timerState: ReturnType<typeof useTimerCompat>['timerState'];
  startTimer: (taskId: string) => Promise<void>;
  pauseTimer: (taskStatus?: any) => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: (finalStatus?: any) => Promise<void>;
  resetTimer: () => void;
  formatElapsedTime: (compact?: boolean) => string;
  getDisplayTime: (task: any) => string;
  clearTimerStorage: () => void;
}

const TimerDataContext = createContext<TimerDataContextType | undefined>(undefined);

export const TimerDataProvider = ({ children }: { children: ReactNode }) => {
  const {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    formatElapsedTime,
    getDisplayTime,
    clearTimerStorage,
  } = useTimerCompat();

  return (
    <TimerDataContext.Provider
      value={{
        timerState,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        resetTimer,
        formatElapsedTime,
        getDisplayTime,
        clearTimerStorage,
      }}
    >
      {children}
    </TimerDataContext.Provider>
  );
};

export const useTimerData = (): TimerDataContextType => {
  const context = useContext(TimerDataContext);
  if (!context) {
    throw new Error('useTimerData must be used within TimerDataProvider');
  }
  return context;
};
