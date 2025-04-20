import { ReactNode } from 'react';
import { TimerDataProvider, useTimerData } from './TimerDataContext';
import { TimerUIProvider, useTimerUI } from './TimerUIContext';

export const TimerProvider = ({ children }: { children: ReactNode }) => (
  <TimerDataProvider>
    <TimerUIProvider>{children}</TimerUIProvider>
  </TimerDataProvider>
);

/**
 * Hook to access combined Timer data and UI contexts.
 */
export const useTimer = () => {
  const data = useTimerData();
  const ui = useTimerUI();
  return { ...data, ...ui };
};
