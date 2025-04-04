import { IService } from './IService';

/**
 * Status of a sync operation
 */
export enum SyncStatus {
  IDLE = 'idle',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIALLY_COMPLETED = 'partially_completed'
}

/**
 * Events that can be emitted by the SyncService
 */
export interface SyncServiceEvents {
  'sync-started': void;
  'sync-completed': { entitiesSynced: number };
  'sync-failed': Error;
  'sync-entity-started': { entityType: string; entityId: string };
  'sync-entity-completed': { entityType: string; entityId: string };
  'sync-entity-failed': { entityType: string; entityId: string; error: Error };
  'sync-status-changed': SyncStatus;
  'conflict-detected': { entityType: string; entityId: string; localData: any; remoteData: any };
  'error': Error;
}

/**
 * Represents a sync conflict that needs resolution
 */
export interface SyncConflict<T> {
  entityType: string;
  entityId: string;
  localVersion: T;
  remoteVersion: T;
  timestamp: number;
  resolved: boolean;
  resolutionStrategy?: 'local' | 'remote' | 'merge' | 'manual';
}

/**
 * Sync configuration options
 */
export interface SyncOptions {
  force?: boolean;
  entityTypes?: string[];
  conflictStrategy?: 'local-wins' | 'remote-wins' | 'timestamp-wins' | 'manual';
  maxRetries?: number;
  batchSize?: number;
}

/**
 * Result of a sync operation
 */
export interface SyncResult {
  status: SyncStatus;
  entitiesTotal: number;
  entitiesSynced: number;
  entitiesFailed: number;
  conflicts: number;
  timestamp: number;
  errors: Error[];
}

/**
 * Interface for the SyncService
 * Provides methods to synchronize data between local and remote storage
 */
export interface ISyncService extends IService<SyncServiceEvents> {
  /**
   * Get the current sync status
   */
  getStatus(): SyncStatus;
  
  /**
   * Check if there are any entities waiting to be synced
   */
  hasPendingChanges(): Promise<boolean>;
  
  /**
   * Get the number of entities waiting to be synced
   */
  getPendingChangesCount(): Promise<number>;
  
  /**
   * Synchronize all pending changes with remote storage
   * @param options Sync operation options
   */
  sync(options?: SyncOptions): Promise<SyncResult>;
  
  /**
   * Synchronize a specific entity type 
   * @param entityType Type of entity to sync (e.g., 'tasks', 'categories')
   * @param options Sync operation options
   */
  syncEntityType(entityType: string, options?: SyncOptions): Promise<SyncResult>;
  
  /**
   * Synchronize a specific entity
   * @param entityType Type of entity to sync
   * @param entityId ID of the entity to sync
   * @param options Sync operation options
   */
  syncEntity(entityType: string, entityId: string, options?: SyncOptions): Promise<SyncResult>;
  
  /**
   * Get all unresolved sync conflicts
   */
  getConflicts(): Promise<SyncConflict<any>[]>;
  
  /**
   * Resolve a sync conflict
   * @param conflict The conflict to resolve
   * @param strategy Resolution strategy
   * @param customMergeData Optional custom data for manual merge
   */
  resolveConflict<T>(
    conflict: SyncConflict<T>, 
    strategy: 'local' | 'remote' | 'merge' | 'manual',
    customMergeData?: Partial<T>
  ): Promise<void>;
  
  /**
   * Clear all sync history and reset sync status
   */
  reset(): Promise<void>;
}
