import { useState, useCallback } from 'react';
import { CacheService, Cache } from './CacheService';
import { 
  CacheOptions, 
  CacheStorageType, 
  CacheExpirationStrategy,
  CacheEntryMetadata,
  CacheResult
} from './CacheTypes';

/**
 * Hook for interacting with the cache system in React components
 * 
 * @param options Cache configuration options
 * @returns Cache interface with React state integration
 */
export function useCache<T>(options: CacheOptions) {
  // Get the cache instance
  const [cache] = useState<Cache<T>>(() => {
    return CacheService.getInstance().getCache<T>(options);
  });
  
  // State for cached data
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [metadata, setMetadata] = useState<CacheEntryMetadata | undefined>(undefined);
  
  // Get from cache
  const getData = useCallback(async (key: string): Promise<CacheResult<T>> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await cache.get(key);
      
      if (result.success && result.data !== undefined) {
        setData(result.data);
        setMetadata(result.metadata);
      } else if (result.error) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      return {
        success: false,
        fromCache: false,
        error
      };
    } finally {
      setLoading(false);
    }
  }, [cache]);
  
  // Set data in cache
  const setCache = useCallback(async (key: string, value: T, customMetadata?: Partial<CacheEntryMetadata>): Promise<CacheResult<T>> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await cache.set(key, value, customMetadata);
      
      if (result.success) {
        setData(value);
        setMetadata(result.metadata);
      } else if (result.error) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      return {
        success: false,
        fromCache: false,
        error
      };
    } finally {
      setLoading(false);
    }
  }, [cache]);
  
  // Get or set data with a loader function
  const getOrSetData = useCallback(async (key: string, loader: () => Promise<T>, customMetadata?: Partial<CacheEntryMetadata>): Promise<CacheResult<T>> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await cache.getOrSet(key, loader, customMetadata);
      
      if (result.success && result.data !== undefined) {
        setData(result.data);
        setMetadata(result.metadata);
      } else if (result.error) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      return {
        success: false,
        fromCache: false,
        error
      };
    } finally {
      setLoading(false);
    }
  }, [cache]);
  
  // Remove data from cache
  const removeData = useCallback(async (key: string): Promise<boolean> => {
    try {
      const success = await cache.remove(key);
      
      if (success) {
        setData(undefined);
        setMetadata(undefined);
      }
      
      return success;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    }
  }, [cache]);
  
  // Clear all data
  const clearCache = useCallback(async (): Promise<boolean> => {
    try {
      const success = await cache.clear();
      
      if (success) {
        setData(undefined);
        setMetadata(undefined);
      }
      
      return success;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    }
  }, [cache]);
  
  return {
    // State
    data,
    loading,
    error,
    metadata,
    
    // Methods
    getData,
    setCache,
    getOrSetData,
    removeData,
    clearCache,
    
    // Direct cache access
    cache
  };
}

/**
 * Hook for creating a persistent, local storage-backed cache
 * Convenience wrapper around useCache with local storage defaults
 */
export function useLocalStorageCache<T>(cacheName: string, ttlMs?: number) {
  return useCache<T>({
    name: cacheName,
    storageType: CacheStorageType.LOCAL_STORAGE,
    expirationStrategy: ttlMs ? CacheExpirationStrategy.TIME_BASED : CacheExpirationStrategy.NEVER,
    ttlMs,
    serialize: true
  });
}

/**
 * Hook for creating an in-memory cache
 * Convenience wrapper around useCache with memory defaults
 */
export function useMemoryCache<T>(cacheName: string, ttlMs?: number) {
  return useCache<T>({
    name: cacheName,
    storageType: CacheStorageType.MEMORY,
    expirationStrategy: ttlMs ? CacheExpirationStrategy.TIME_BASED : CacheExpirationStrategy.NEVER,
    ttlMs
  });
}

/**
 * Hook for creating a session storage cache (cleared when browser tab is closed)
 * Convenience wrapper around useCache with session storage defaults
 */
export function useSessionCache<T>(cacheName: string) {
  return useCache<T>({
    name: cacheName,
    storageType: CacheStorageType.SESSION_STORAGE,
    expirationStrategy: CacheExpirationStrategy.SESSION,
    serialize: true
  });
}
