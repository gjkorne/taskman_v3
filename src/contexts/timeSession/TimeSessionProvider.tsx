import { ReactNode, useMemo } from 'react';
import { TimeSessionDataProvider, useTimeSessionData } from './TimeSessionDataContext';
import { TimeSessionUIProvider, useTimeSessionUI } from './TimeSessionUIContext';
import { TimeSessionContext } from './index';

// Combined provider that wraps both data and UI providers
// and provides backward compatibility with the old context
export const TimeSessionProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TimeSessionDataProvider>
      <TimeSessionUIProvider>
        <LegacyBridge>
          {children}
        </LegacyBridge>
      </TimeSessionUIProvider>
    </TimeSessionDataProvider>
  );
};

// Bridge component to provide the legacy context
const LegacyBridge = ({ children }: { children: ReactNode }) => {
  const dataContext = useTimeSessionData();
  const uiContext = useTimeSessionUI();
  
  // Combine contexts for backward compatibility
  const combinedContext = useMemo(() => ({
    ...dataContext,
    ...uiContext
  }), [dataContext, uiContext]);
  
  return (
    <TimeSessionContext.Provider value={combinedContext}>
      {children}
    </TimeSessionContext.Provider>
  );
};
