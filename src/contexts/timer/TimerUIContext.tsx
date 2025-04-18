import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TimerViewMode = 'digital' | 'analog';

interface TimerUIContextType {
  isTimerOpen: boolean;
  openTimer: () => void;
  closeTimer: () => void;
  viewMode: TimerViewMode;
  setViewMode: (mode: TimerViewMode) => void;
}

export const TimerUIContext = createContext<TimerUIContextType | undefined>(undefined);

export const TimerUIProvider = ({ children }: { children: ReactNode }) => {
  const [isTimerOpen, setTimerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<TimerViewMode>('digital');

  const openTimer = () => setTimerOpen(true);
  const closeTimer = () => setTimerOpen(false);

  return (
    <TimerUIContext.Provider value={{ isTimerOpen, openTimer, closeTimer, viewMode, setViewMode }}>
      {children}
    </TimerUIContext.Provider>
  );
};

export const useTimerUI = (): TimerUIContextType => {
  const context = useContext(TimerUIContext);
  if (!context) throw new Error('useTimerUI must be used within TimerUIProvider');
  return context;
};
