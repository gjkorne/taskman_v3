import { 
  CacheOptions, 
  CacheStorageType, 
  CacheExpirationStrategy,
  CacheEntry,
  CacheEntryMetadata,
  CacheResult
} from './CacheTypes';

/**
 * Interface for cache storage adapters
 */
export interface ICacheStorageAdapter {
  /**
   * Get an item from the cache
   */
  getItem<T>(key: string): Promise<CacheEntry<T> | null>;
  
  /**
   * Set an item in the cache
   */
  setItem<T>(key: string, entry: CacheEntry<T>): Promise<boolean>;
  
  /**
   * Remove an item from the cache
   */
  removeItem(key: string): Promise<boolean>;
  
  /**
   * Check if an item exists in the cache
   */
  hasItem(key: string): Promise<boolean>;
  
  /**
   * Clear all items from this cache
   */
  clear(): Promise<boolean>;
  
  /**
   * Get all keys in this cache
   */
  keys(): Promise<string[]>;
}

/**
 * In-memory storage adapter implementation
 */
class MemoryStorageAdapter implements ICacheStorageAdapter {
  private storage = new Map<string, any>();
  
  async getItem<T>(key: string): Promise<CacheEntry<T> | null> {
    return this.storage.has(key) ? this.storage.get(key) : null;
  }
  
  async setItem<T>(key: string, entry: CacheEntry<T>): Promise<boolean> {
    this.storage.set(key, entry);
    return true;
  }
  
  async removeItem(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }
  
  async hasItem(key: string): Promise<boolean> {
    return this.storage.has(key);
  }
  
  async clear(): Promise<boolean> {
    this.storage.clear();
    return true;
  }
  
  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }
}

/**
 * Local storage adapter implementation
 */
class LocalStorageAdapter implements ICacheStorageAdapter {
  private prefix: string;
  
  constructor(cacheName: string) {
    this.prefix = `cache_${cacheName}_`;
  }
  
  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }
  
  async getItem<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = localStorage.getItem(prefixedKey);
      
      if (!item) {
        return null;
      }
      
      return JSON.parse(item) as CacheEntry<T>;
    } catch (error) {
      console.error(`Error getting item from cache: ${key}`, error);
      return null;
    }
  }
  
  async setItem<T>(key: string, entry: CacheEntry<T>): Promise<boolean> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      localStorage.setItem(prefixedKey, JSON.stringify(entry));
      return true;
    } catch (error) {
      console.error(`Error setting item in cache: ${key}`, error);
      return false;
    }
  }
  
  async removeItem(key: string): Promise<boolean> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error(`Error removing item from cache: ${key}`, error);
      return false;
    }
  }
  
  async hasItem(key: string): Promise<boolean> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      return localStorage.getItem(prefixedKey) !== null;
    } catch (error) {
      console.error(`Error checking item in cache: ${key}`, error);
      return false;
    }
  }
  
  async clear(): Promise<boolean> {
    try {
      const keys = await this.keys();
      keys.forEach(key => {
        const prefixedKey = this.getPrefixedKey(key);
        localStorage.removeItem(prefixedKey);
      });
      return true;
    } catch (error) {
      console.error('Error clearing cache', error);
      return false;
    }
  }
  
  async keys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.slice(this.prefix.length));
        }
      }
      
      return keys;
    } catch (error) {
      console.error('Error getting cache keys', error);
      return [];
    }
  }
}

/**
 * Session storage adapter implementation
 */
class SessionStorageAdapter implements ICacheStorageAdapter {
  private prefix: string;
  
  constructor(cacheName: string) {
    this.prefix = `cache_${cacheName}_`;
  }
  
  private getPrefixedKey(key: string): string {
    return `${this.prefix}${key}`;
  }
  
  async getItem<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = sessionStorage.getItem(prefixedKey);
      
      if (!item) {
        return null;
      }
      
      return JSON.parse(item) as CacheEntry<T>;
    } catch (error) {
      console.error(`Error getting item from cache: ${key}`, error);
      return null;
    }
  }
  
  async setItem<T>(key: string, entry: CacheEntry<T>): Promise<boolean> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      sessionStorage.setItem(prefixedKey, JSON.stringify(entry));
      return true;
    } catch (error) {
      console.error(`Error setting item in cache: ${key}`, error);
      return false;
    }
  }
  
  async removeItem(key: string): Promise<boolean> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      sessionStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error(`Error removing item from cache: ${key}`, error);
      return false;
    }
  }
  
  async hasItem(key: string): Promise<boolean> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      return sessionStorage.getItem(prefixedKey) !== null;
    } catch (error) {
      console.error(`Error checking item in cache: ${key}`, error);
      return false;
    }
  }
  
  async clear(): Promise<boolean> {
    try {
      const keys = await this.keys();
      keys.forEach(key => {
        const prefixedKey = this.getPrefixedKey(key);
        sessionStorage.removeItem(prefixedKey);
      });
      return true;
    } catch (error) {
      console.error('Error clearing cache', error);
      return false;
    }
  }
  
  async keys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.slice(this.prefix.length));
        }
      }
      
      return keys;
    } catch (error) {
      console.error('Error getting cache keys', error);
      return [];
    }
  }
}

/**
 * Main cache service class
 */
export class CacheService {
  private static instance: CacheService;
  private caches = new Map<string, Cache>();
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    
    return CacheService.instance;
  }
  
  /**
   * Create or get a cache with the given options
   */
  public getCache<T>(options: CacheOptions): Cache<T> {
    if (this.caches.has(options.name)) {
      return this.caches.get(options.name) as Cache<T>;
    }
    
    const cache = new Cache<T>(options);
    this.caches.set(options.name, cache);
    
    return cache;
  }
  
  /**
   * Delete a cache by name
   */
  public deleteCache(name: string): boolean {
    if (!this.caches.has(name)) {
      return false;
    }
    
    const cache = this.caches.get(name);
    cache?.clear();
    
    return this.caches.delete(name);
  }
  
  /**
   * Get all cache names
   */
  public getCacheNames(): string[] {
    return Array.from(this.caches.keys());
  }
  
  /**
   * Clear all caches
   */
  public async clearAllCaches(): Promise<boolean> {
    try {
      const cacheNames = this.getCacheNames();
      
      for (const name of cacheNames) {
        const cache = this.caches.get(name);
        await cache?.clear();
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing all caches', error);
      return false;
    }
  }
}

/**
 * Cache class for individual caches
 */
export class Cache<T = any> {
  private options: CacheOptions;
  private storage: ICacheStorageAdapter;
  
  /**
   * Create a new cache with the given options
   */
  constructor(options: CacheOptions) {
    this.options = {
      // Default options
      serialize: true,
      compress: false,
      maxEntries: 1000,
      ...options
    };
    
    this.storage = this.createStorageAdapter();
  }
  
  /**
   * Create a storage adapter based on the options
   */
  private createStorageAdapter(): ICacheStorageAdapter {
    switch (this.options.storageType) {
      case CacheStorageType.LOCAL_STORAGE:
        return new LocalStorageAdapter(this.options.name);
      case CacheStorageType.SESSION_STORAGE:
        return new SessionStorageAdapter(this.options.name);
      case CacheStorageType.MEMORY:
      default:
        return new MemoryStorageAdapter();
    }
  }
  
  /**
   * Create metadata for a cache entry
   */
  private createMetadata(customMetadata?: Partial<CacheEntryMetadata>): CacheEntryMetadata {
    const now = new Date().toISOString();
    let expiresAt: string | undefined = undefined;
    
    if (this.options.expirationStrategy === CacheExpirationStrategy.TIME_BASED && this.options.ttlMs) {
      const expirationDate = new Date(Date.now() + this.options.ttlMs);
      expiresAt = expirationDate.toISOString();
    }
    
    return {
      createdAt: now,
      lastAccessedAt: now,
      expiresAt,
      ...customMetadata
    };
  }
  
  /**
   * Check if a cache entry is expired
   */
  private isExpired(metadata: CacheEntryMetadata): boolean {
    if (this.options.expirationStrategy === CacheExpirationStrategy.NEVER) {
      return false;
    }
    
    if (this.options.expirationStrategy === CacheExpirationStrategy.TIME_BASED && metadata.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(metadata.expiresAt);
      return now > expiresAt;
    }
    
    return false;
  }
  
  /**
   * Get an item from the cache
   */
  async get(key: string): Promise<CacheResult<T>> {
    try {
      const entry = await this.storage.getItem<T>(key);
      
      if (!entry) {
        return { 
          success: false, 
          fromCache: false,
          error: new Error(`Cache miss for key: ${key}`)
        };
      }
      
      // Check if expired
      if (this.isExpired(entry.metadata)) {
        await this.remove(key);
        return { 
          success: false, 
          fromCache: false,
          error: new Error(`Cache entry expired for key: ${key}`)
        };
      }
      
      // Update last accessed time
      entry.metadata.lastAccessedAt = new Date().toISOString();
      await this.storage.setItem(key, entry);
      
      return {
        success: true,
        data: entry.value,
        fromCache: true,
        metadata: entry.metadata
      };
    } catch (error) {
      console.error(`Error getting item from cache: ${key}`, error);
      return { 
        success: false, 
        fromCache: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Set an item in the cache
   */
  async set(key: string, value: T, metadata?: Partial<CacheEntryMetadata>): Promise<CacheResult<T>> {
    try {
      const entryMetadata = this.createMetadata(metadata);
      
      const entry: CacheEntry<T> = {
        value,
        metadata: entryMetadata
      };
      
      const success = await this.storage.setItem(key, entry);
      
      return {
        success,
        data: value,
        fromCache: false,
        metadata: entryMetadata
      };
    } catch (error) {
      console.error(`Error setting item in cache: ${key}`, error);
      return { 
        success: false, 
        fromCache: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Remove an item from the cache
   */
  async remove(key: string): Promise<boolean> {
    try {
      return await this.storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from cache: ${key}`, error);
      return false;
    }
  }
  
  /**
   * Check if an item exists in the cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.storage.hasItem(key);
      
      if (!exists) {
        return false;
      }
      
      // Check if expired
      const entry = await this.storage.getItem(key);
      if (entry && this.isExpired(entry.metadata)) {
        await this.remove(key);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error checking item in cache: ${key}`, error);
      return false;
    }
  }
  
  /**
   * Clear all items from this cache
   */
  async clear(): Promise<boolean> {
    try {
      return await this.storage.clear();
    } catch (error) {
      console.error(`Error clearing cache: ${this.options.name}`, error);
      return false;
    }
  }
  
  /**
   * Get all keys in this cache
   */
  async keys(): Promise<string[]> {
    try {
      return await this.storage.keys();
    } catch (error) {
      console.error(`Error getting cache keys: ${this.options.name}`, error);
      return [];
    }
  }
  
  /**
   * Get and set - returns cached value if exists, otherwise calls loader function and caches result
   */
  async getOrSet(key: string, loader: () => Promise<T>, metadata?: Partial<CacheEntryMetadata>): Promise<CacheResult<T>> {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      
      if (cached.success && cached.data !== undefined) {
        return cached;
      }
      
      // Not in cache, load the data
      const data = await loader();
      
      // Cache the result
      return this.set(key, data, metadata);
    } catch (error) {
      console.error(`Error in getOrSet for key: ${key}`, error);
      return { 
        success: false, 
        fromCache: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}
