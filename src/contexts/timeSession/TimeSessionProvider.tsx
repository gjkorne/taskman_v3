import { ReactNode } from 'react';
import { TimeSessionDataProvider } from './TimeSessionDataContext';
import { TimeSessionUIProvider } from './TimeSessionUIContext';

// Combined provider that wraps both data and UI providers
export const TimeSessionProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TimeSessionDataProvider>
      <TimeSessionUIProvider>
        {children}
      </TimeSessionUIProvider>
    </TimeSessionDataProvider>
  );
};
