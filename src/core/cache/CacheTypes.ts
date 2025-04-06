/**
 * Core cache types and interfaces for the TaskMan caching system
 * This provides standardized cache access across services and repositories
 */

/**
 * Cache entry expiration strategies
 */
export enum CacheExpirationStrategy {
  /**
   * Never expire cache entries (must be manually invalidated)
   */
  NEVER = 'never',
  
  /**
   * Expire cache entries after a specific time period
   */
  TIME_BASED = 'time-based',
  
  /**
   * Expire cache entries when app is closed
   */
  SESSION = 'session',
  
  /**
   * Expire cache based on data staleness (e.g., TTL or version)
   */
  STALENESS = 'staleness'
}

/**
 * Types of storage backends for cache
 */
export enum CacheStorageType {
  /**
   * In-memory cache (lost on refresh)
   */
  MEMORY = 'memory',
  
  /**
   * LocalStorage based persistence
   */
  LOCAL_STORAGE = 'local-storage',
  
  /**
   * IndexedDB based persistence (for larger objects)
   */
  INDEXED_DB = 'indexed-db',
  
  /**
   * Session storage (cleared when tab closes)
   */
  SESSION_STORAGE = 'session-storage'
}

/**
 * Cache configuration options for a specific cache
 */
export interface CacheOptions {
  /**
   * Unique name for this cache
   */
  name: string;
  
  /**
   * Storage type for this cache
   */
  storageType: CacheStorageType;
  
  /**
   * Expiration strategy for cache entries
   */
  expirationStrategy: CacheExpirationStrategy;
  
  /**
   * TTL in milliseconds (for TIME_BASED strategy)
   */
  ttlMs?: number;
  
  /**
   * Maximum size in bytes (approx)
   */
  maxSizeBytes?: number;
  
  /**
   * Maximum number of entries to keep
   */
  maxEntries?: number;
  
  /**
   * If true, will compress data before storing (for larger objects)
   */
  compress?: boolean;
  
  /**
   * If true, serialize as JSON before storing
   */
  serialize?: boolean;
  
  /**
   * For remote sync: version field to track remote changes
   */
  versionField?: string;
}

/**
 * Metadata stored with each cache entry
 */
export interface CacheEntryMetadata {
  /**
   * When the entry was created
   */
  createdAt: string;
  
  /**
   * When the entry was last accessed
   */
  lastAccessedAt: string;
  
  /**
   * When the entry expires (if using TIME_BASED)
   */
  expiresAt?: string;
  
  /**
   * Version of the entry (for staleness checks)
   */
  version?: string | number;
  
  /**
   * If this entry was accessed while offline
   */
  offlineAccessed?: boolean;
  
  /**
   * If this entry has been updated offline and needs sync
   */
  needsSync?: boolean;
  
  /**
   * Any custom metadata for the cache entry
   */
  custom?: Record<string, any>;
}

/**
 * A cache entry with value and metadata
 */
export interface CacheEntry<T> {
  /**
   * The actual cached data
   */
  value: T;
  
  /**
   * Metadata about the cache entry
   */
  metadata: CacheEntryMetadata;
}

/**
 * Result of a cache operation
 */
export interface CacheResult<T> {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  
  /**
   * The data (if operation returned data)
   */
  data?: T;
  
  /**
   * Whether the data came from cache
   */
  fromCache: boolean;
  
  /**
   * Any error that occurred
   */
  error?: Error;
  
  /**
   * Cache entry metadata if relevant
   */
  metadata?: CacheEntryMetadata;
}
