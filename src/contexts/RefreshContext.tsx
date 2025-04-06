import React, { createContext, useContext, useState } from 'react';
import { createLogger } from '../utils/logging';

const logger = createLogger('RefreshContext');

type RefreshContextType = {
  refreshData: () => void;
  registerRefreshHandler: (handler: () => void) => () => void;
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshHandlers, setRefreshHandlers] = useState<Array<() => void>>([]);
  
  const registerRefreshHandler = (handler: () => void) => {
    logger.log('Registering refresh handler');
    setRefreshHandlers(prev => [...prev, handler]);
    
    // Return unregister function
    return () => {
      setRefreshHandlers(prev => prev.filter(h => h !== handler));
    };
  };
  
  const refreshData = () => {
    logger.log(`Refreshing ${refreshHandlers.length} registered handlers`);
    refreshHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        logger.error('Error in refresh handler:', error);
      }
    });
  };
  
  return (
    <RefreshContext.Provider value={{ refreshData, registerRefreshHandler }}>
      {children}
    </RefreshContext.Provider>
  );
}

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};
