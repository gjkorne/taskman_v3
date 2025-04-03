/**
 * Base interface for all repositories that defines common CRUD operations
 */
export interface IRepository<T, CreateDTO, UpdateDTO> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<boolean>;
}

/**
 * Interface for repositories that support offline operations
 */
export interface IOfflineCapableRepository<T, CreateDTO, UpdateDTO> extends IRepository<T, CreateDTO, UpdateDTO> {
  /**
   * Synchronize local data with remote storage
   */
  sync(): Promise<void>;
  
  /**
   * Check if there are pending changes to sync
   */
  hasPendingChanges(): Promise<boolean>;
  
  /**
   * Force reload data from remote storage
   */
  forceRefresh(): Promise<void>;
}

/**
 * Interface for storage adapters that can be used by repositories
 */
export interface IStorageAdapter<T> {
  /**
   * Get all items from storage
   */
  getAll(): Promise<T[]>;
  
  /**
   * Get an item by ID
   */
  getById(id: string): Promise<T | null>;
  
  /**
   * Create a new item
   */
  create(data: Partial<T>): Promise<T>;
  
  /**
   * Update an existing item
   */
  update(id: string, data: Partial<T>): Promise<T>;
  
  /**
   * Delete an item
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Query items with a filter function
   */
  query(filter: (item: T) => boolean): Promise<T[]>;
}
