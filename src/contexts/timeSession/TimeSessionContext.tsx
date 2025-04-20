import { ReactNode } from 'react';
import {
  TimeSessionDataProvider,
  useTimeSessionData,
} from './TimeSessionDataContext';
import {
  TimeSessionUIProvider,
  useTimeSessionUI,
} from './TimeSessionUIContext';

/**
 * Combined provider that wraps both data and UI providers.
 */
export const TimeSessionProvider = ({ children }: { children: ReactNode }) => (
  <TimeSessionDataProvider>
    <TimeSessionUIProvider>{children}</TimeSessionUIProvider>
  </TimeSessionDataProvider>
);

/**
 * Hook to access combined TimeSession data and UI contexts.
 */
export const useTimeSession = () => {
  const data = useTimeSessionData();
  const ui = useTimeSessionUI();
  return { ...data, ...ui };
};
