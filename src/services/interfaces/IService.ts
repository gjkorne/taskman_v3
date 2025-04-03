/**
 * Base service interface that all domain services should implement
 * This introduces a standard pattern for service event handling
 */
export interface IService<TEvents extends Record<string, any>> {
  /** Subscribe to service events */
  on<K extends keyof TEvents>(event: K, callback: (data: TEvents[K]) => void): () => void;
  
  /** Unsubscribe from service events */
  off<K extends keyof TEvents>(event: K, callback: (data: TEvents[K]) => void): void;
  
  /** Emit an event with data */
  emit<K extends keyof TEvents>(event: K, data?: TEvents[K]): void;
}

/**
 * Interface for services that support offline capabilities
 */
export interface IOfflineCapableService<TEvents extends Record<string, any> = any> extends IService<TEvents> {
  /** Check if there are unsynchronized changes */
  hasUnsyncedChanges(): Promise<boolean>;
  
  /** Synchronize local changes with remote storage */
  sync(): Promise<void>;
  
  /** Force refresh from remote storage */
  forceRefresh(): Promise<void>;
}
