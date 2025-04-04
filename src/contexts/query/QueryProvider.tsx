import { ReactNode, useState, useEffect } from 'react';
import { 
  QueryClient, 
  QueryClientProvider,
  focusManager, 
  onlineManager,
} from '@tanstack/react-query';
import { isOffline } from '../../lib/queryPersistence';
import { syncManager } from '../../services/SyncManager';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { get, set, del } from 'idb-keyval';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Enhanced QueryProvider with offline support
 * This provider configures React Query for optimal offline-first operation
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Retry failed queries when coming back online
        retry: (failureCount, error: any) => {
          // Don't retry if we know we're offline or if we've tried 3 times
          const isNetworkError = error?.message?.includes('Network') || 
            error?.code === 'OFFLINE' ||
            error?.type === 'NETWORK';
            
          if (isNetworkError && isOffline()) {
            return false;
          }
          
          return failureCount < 3;
        },
        // Keep data fresh for 5 minutes by default
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 10 minutes after it becomes unused
        gcTime: 10 * 60 * 1000,
        // Refetch data when window is refocused
        refetchOnWindowFocus: true,
        // Refetch when reconnecting
        refetchOnReconnect: 'always',
        // Use cached data even when network request fails
        networkMode: 'always',
      },
      mutations: {
        // Don't retry mutations by default
        retry: false,
        // Throw errors by default for better error handling
        throwOnError: true,
        networkMode: 'always',
      }
    },
  }));

  // Set up manual cache persistence instead of using the library directly
  // This avoids TypeScript issues with the library
  useEffect(() => {
    // Save cache to IndexedDB when it changes
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const state = queryClient.getQueryCache().getAll()
        .filter(query => {
          const queryKey = query.queryKey[0];
          return (
            typeof queryKey === 'string' && 
            (queryKey === 'tasks' || queryKey === 'categories' || queryKey === 'timeSessions')
          );
        })
        .map(query => ({
          queryKey: query.queryKey,
          state: query.state
        }));
      
      if (state.length > 0) {
        set('reactQueryCache', {
          timestamp: Date.now(),
          state
        }).catch(err => {
          console.error('Failed to persist query cache:', err);
        });
      }
    });

    // Load cache from IndexedDB on mount
    const loadCache = async (): Promise<void> => {
      try {
        const cache = await get<{timestamp: number, state: any[]}>('reactQueryCache');
        
        if (cache) {
          // Check if cache is stale (older than 7 days)
          const maxAge = 1000 * 60 * 60 * 24 * 7; // 7 days in ms
          const isStale = Date.now() - cache.timestamp > maxAge;
          
          if (isStale) {
            console.log('Cache is stale, clearing...');
            await del('reactQueryCache');
            return;
          }
          
          // Restore queries from cache
          cache.state.forEach(item => {
            queryClient.setQueryData(item.queryKey, item.state.data);
          });
          
          console.log('Restored query cache with', cache.state.length, 'items');
        }
      } catch (error) {
        console.error('Failed to load query cache:', error);
      }
    };
    
    loadCache();
    
    return () => {
      unsubscribe();
    };
  }, [queryClient]);
  
  // Configure online status detection
  useEffect(() => {
    const networkStatusService = ServiceRegistry.getNetworkStatusService();
    
    // Use event subscription instead of the callback approach
    const handleOnlineStatusChange = (isOnline: boolean): void => {
      // Update React Query's online status
      onlineManager.setOnline(isOnline);
      
      // When we come back online, trigger a sync
      if (isOnline) {
        syncManager.syncAll(true).catch(error => {
          console.error('Auto-sync on reconnect failed:', error);
        });
      }
    };
    
    // Add listener using the service's method
    networkStatusService.addListener(handleOnlineStatusChange);
    
    // Configure focus detection
    const handleFocus = (): void => {
      if (!document.hidden) {
        focusManager.setFocused(true);
      } else {
        focusManager.setFocused(false);
      }
    };
    
    // Handle focus events separately to avoid TypeScript errors with anonymous functions
    const handleFocusTrue = (): void => focusManager.setFocused(true);
    const handleFocusFalse = (): void => focusManager.setFocused(false);
    
    // Add window focus listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', handleFocus);
      window.addEventListener('focus', handleFocusTrue);
      window.addEventListener('blur', handleFocusFalse);
    }
    
    // Cleanup function
    return () => {
      networkStatusService.removeListener(handleOnlineStatusChange);
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('visibilitychange', handleFocus);
        window.removeEventListener('focus', handleFocusTrue);
        window.removeEventListener('blur', handleFocusFalse);
      }
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
