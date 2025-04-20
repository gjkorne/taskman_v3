import {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

/**
 * Custom persistence layer for React Query that uses IndexedDB
 * This allows our app to maintain cache between sessions and work offline
 */
export const createIDBPersister = (idbValidityInDays = 7): Persister => {
  return {
    persistClient: async (client: PersistedClient) => {
      // Add timestamp to track cache age
      const persistedClient = {
        ...client,
        timestamp: Date.now(),
      };
      set('reactQuery', persistedClient);
    },

    restoreClient: async () => {
      try {
        const persistedClient = await get<
          PersistedClient & { timestamp?: number }
        >('reactQuery');

        // Check if cache is stale
        if (persistedClient) {
          const maxAge = 1000 * 60 * 60 * 24 * idbValidityInDays; // Convert days to milliseconds
          const isStale = persistedClient.timestamp
            ? Date.now() - persistedClient.timestamp > maxAge
            : true;

          if (isStale) {
            // Cache is stale, remove it
            await del('reactQuery');
            return undefined;
          }

          return persistedClient;
        }

        return undefined;
      } catch (error) {
        console.error('Error restoring cache:', error);
        return undefined;
      }
    },

    removeClient: async () => {
      await del('reactQuery');
    },
  };
};

/**
 * Determines if the browser is currently offline
 */
export const isOffline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
};

/**
 * React Query key extractor for cache dehydration
 * This ensures we only persist what's necessary
 */
export const persistQueryKeyMatcher = (query: {
  queryKey: unknown[];
}): boolean => {
  // Only cache specific queries that are essential for offline operation
  const queryKey = query.queryKey[0];

  // Cache tasks, categories, and time sessions
  return (
    queryKey === 'tasks' ||
    queryKey === 'categories' ||
    queryKey === 'timeSessions'
  );
};
