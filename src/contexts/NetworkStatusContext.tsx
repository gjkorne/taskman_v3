import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ServiceRegistry } from '../services/ServiceRegistry';
import { NetworkStatusService } from '../services/networkStatusService';

// Define the context shape
interface NetworkStatusContextType {
  isOnline: boolean;
  wasOffline: boolean; // Helps track when coming back online for syncing
  lastOnlineTimestamp: number | null;
  lastOfflineTimestamp: number | null;
}

// Create the context with default values
const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isOnline: true,
  wasOffline: false,
  lastOnlineTimestamp: null,
  lastOfflineTimestamp: null,
});

interface NetworkStatusProviderProps {
  children: ReactNode;
}

/**
 * Provider component for network status
 * Makes network status available throughout the application
 * and tracks online/offline state transitions
 */
export const NetworkStatusProvider: React.FC<NetworkStatusProviderProps> = ({ children }) => {
  // Set initial state 
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastOnlineTimestamp, setLastOnlineTimestamp] = useState<number | null>(null);
  const [lastOfflineTimestamp, setLastOfflineTimestamp] = useState<number | null>(null);
  
  useEffect(() => {
    // Get the networkStatusService from the registry
    const networkStatusService: NetworkStatusService = ServiceRegistry.getNetworkStatusService();
    
    // Initial state
    setIsOnline(networkStatusService.isOnline());
    
    // Register for network status updates
    const unsubscribe = networkStatusService.onConnectivityChange((online) => {
      if (!isOnline && online) {
        // Coming back online after being offline
        setWasOffline(true);
        setLastOnlineTimestamp(Date.now());
        
        // After a timeout, reset wasOffline flag
        setTimeout(() => {
          setWasOffline(false);
        }, 10000); // Reset after 10 seconds
      } else if (isOnline && !online) {
        // Going offline
        setLastOfflineTimestamp(Date.now());
      }
      
      setIsOnline(online);
    });
    
    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, [isOnline]);
  
  // Provide network status information to children
  const contextValue: NetworkStatusContextType = {
    isOnline,
    wasOffline,
    lastOnlineTimestamp,
    lastOfflineTimestamp,
  };
  
  return (
    <NetworkStatusContext.Provider value={contextValue}>
      {children}
    </NetworkStatusContext.Provider>
  );
};

/**
 * Hook to use network status within components
 */
export const useNetworkStatus = (): NetworkStatusContextType => {
  const context = useContext(NetworkStatusContext);
  
  if (context === undefined) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  
  return context;
};

/**
 * Higher-order component that automatically adds offline indicators
 * to wrapped components when the network is offline
 */
export function withOfflineIndicator<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const { isOnline } = useNetworkStatus();
    
    if (!isOnline) {
      return (
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1 z-10">
            You are currently offline. Changes will be saved locally and synced when you reconnect.
          </div>
          <div className="pt-8">
            <Component {...props} />
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}
