import { IOfflineCapableRepository, IStorageAdapter } from './types';
import { NetworkStatusService } from '../services/networkStatusService';
import { BrowserEventEmitter } from '../utils/BrowserEventEmitter';

/**
 * Interface for entities with offline sync capabilities
 */
export interface ISyncableEntity {
  id: string;
  _pendingSync?: boolean;
  _lastUpdated?: string;
  _sync_error?: string;
}

/**
 * Base repository abstract class that implements the standard offline-capable repository pattern
 * This provides a consistent implementation pattern for all repositories to follow
 */
export abstract class BaseRepository<
  // The domain model type
  T extends ISyncableEntity,
  // Data Transfer Object for creation operations
  CreateDTO,
  // Data Transfer Object for update operations
  UpdateDTO,
  // API Data Transfer Object (the shape of data in the remote database)
  ApiDTO = any
> extends BrowserEventEmitter implements IOfflineCapableRepository<T, CreateDTO, UpdateDTO> {
  
  protected syncInProgress = false;
  protected remoteAdapter: IStorageAdapter<ApiDTO>;
  protected localAdapter: IStorageAdapter<T>;
  protected networkStatus: NetworkStatusService;
  
  /**
   * Repository constructor
   * 
   * @param remoteAdapter The adapter for remote storage (e.g. Supabase)
   * @param localAdapter The adapter for local storage (e.g. IndexedDB)
   * @param networkStatus Service to monitor network connectivity
   */
  constructor(
    remoteAdapter: IStorageAdapter<ApiDTO>,
    localAdapter: IStorageAdapter<T>,
    networkStatus: NetworkStatusService
  ) {
    super();
    this.remoteAdapter = remoteAdapter;
    this.localAdapter = localAdapter;
    this.networkStatus = networkStatus;
    
    // Setup network status monitoring
    this.networkStatus.addListener(this.handleNetworkStatusChange.bind(this));
  }
  
  /**
   * Transform API DTO to domain model
   * Implemented by concrete repositories
   */
  protected abstract apiToDomain(dto: ApiDTO): T;
  
  /**
   * Transform domain model to API DTO
   * Implemented by concrete repositories
   */
  protected abstract domainToApi(model: T): Omit<ApiDTO, 'id'>;
  
  /**
   * Transform creation DTO to domain model
   * Implemented by concrete repositories
   */
  protected abstract createDtoToDomain(dto: CreateDTO): Omit<T, 'id'>;
  
  /**
   * Apply update DTO to domain model
   * Implemented by concrete repositories
   */
  protected abstract applyUpdateDto(model: T, dto: UpdateDTO): T;
  
  /**
   * Handle network status changes
   */
  private async handleNetworkStatusChange(online: boolean): Promise<void> {
    if (online) {
      try {
        const hasPending = await this.hasPendingChanges();
        if (hasPending) {
          console.log('Network reconnected, syncing pending changes...');
          await this.sync();
        }
      } catch (error) {
        console.error('Error handling network status change:', error);
      }
    }
  }
  
  /**
   * Get all entities
   */
  async getAll(): Promise<T[]> {
    try {
      // First try to get from remote if online
      if (this.networkStatus.isOnline()) {
        try {
          const remoteData = await this.remoteAdapter.getAll();
          
          // Transform API DTOs to domain models
          const domainModels = remoteData.map(dto => this.apiToDomain(dto));
          
          // Update local storage
          await this.updateLocalStorage(domainModels);
          
          return domainModels;
        } catch (error) {
          console.error('Error fetching from remote, falling back to local:', error);
          // Fall back to local on error
        }
      }
      
      // Get from local storage
      const localData = await this.localAdapter.getAll();
      return localData;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }
  
  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      // First try to get from remote if online
      if (this.networkStatus.isOnline()) {
        try {
          const remoteData = await this.remoteAdapter.getById(id);
          
          if (remoteData) {
            // Transform API DTO to domain model
            const domainModel = this.apiToDomain(remoteData);
            
            // Update local storage
            await this.localAdapter.update(id, domainModel);
            
            return domainModel;
          }
        } catch (error) {
          console.error('Error fetching from remote, falling back to local:', error);
          // Fall back to local on error
        }
      }
      
      // Get from local storage
      return await this.localAdapter.getById(id);
    } catch (error) {
      console.error(`Error in getById for ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new entity
   */
  async create(dto: CreateDTO): Promise<T> {
    try {
      // Convert DTO to domain model (without ID)
      const newEntityData = this.createDtoToDomain(dto);
      
      // If online, create in remote first
      if (this.networkStatus.isOnline()) {
        try {
          // Convert to API format
          const apiData = this.domainToApi(newEntityData as T);
          
          // Create in remote
          const remoteEntity = await this.remoteAdapter.create(apiData as Partial<ApiDTO>);
          
          // Convert response back to domain model
          const domainModel = this.apiToDomain(remoteEntity);
          
          // Save to local storage
          await this.localAdapter.create(domainModel);
          
          // Emit created event
          this.emit('entity-created', domainModel);
          
          return domainModel;
        } catch (error) {
          console.error('Error creating entity in remote, storing locally with pending flag:', error);
          // Continue to create locally with pending flag
        }
      }
      
      // Create locally with pending sync flag
      const localEntity = {
        ...newEntityData as any,
        _pendingSync: true,
        _lastUpdated: new Date().toISOString()
      } as T;
      
      const createdEntity = await this.localAdapter.create(localEntity);
      
      // Emit created event
      this.emit('entity-created', createdEntity);
      
      return createdEntity;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing entity
   */
  async update(id: string, dto: UpdateDTO): Promise<T> {
    try {
      // Get current entity from local storage 
      const currentEntity = await this.localAdapter.getById(id);
      if (!currentEntity) {
        throw new Error(`Entity with ID ${id} not found`);
      }
      
      // Apply update DTO to current entity
      const updatedEntity = this.applyUpdateDto(currentEntity, dto);
      
      // If online, update in remote first
      if (this.networkStatus.isOnline()) {
        try {
          // Convert to API format
          const apiData = this.domainToApi(updatedEntity);
          
          // Update in remote
          const remoteEntity = await this.remoteAdapter.update(id, apiData as Partial<ApiDTO>);
          
          // Convert response back to domain model
          const domainModel = this.apiToDomain(remoteEntity);
          
          // Update in local storage
          await this.localAdapter.update(id, domainModel);
          
          // Emit updated event
          this.emit('entity-updated', domainModel);
          
          return domainModel;
        } catch (error) {
          console.error('Error updating entity in remote, storing locally with pending flag:', error);
          // Continue to update locally with pending flag
        }
      }
      
      // Update locally with pending sync flag
      const localEntity = {
        ...updatedEntity,
        _pendingSync: true,
        _lastUpdated: new Date().toISOString()
      };
      
      const savedEntity = await this.localAdapter.update(id, localEntity);
      
      // Emit updated event
      this.emit('entity-updated', savedEntity);
      
      return savedEntity;
    } catch (error) {
      console.error(`Error in update for ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete an entity
   */
  async delete(id: string): Promise<boolean> {
    try {
      // If online, delete from remote first
      if (this.networkStatus.isOnline()) {
        try {
          // Delete from remote
          const success = await this.remoteAdapter.delete(id);
          
          if (success) {
            // Delete from local storage
            await this.localAdapter.delete(id);
            
            // Emit deleted event
            this.emit('entity-deleted', id);
            
            return true;
          }
        } catch (error) {
          console.error('Error deleting entity from remote, marking locally as pending delete:', error);
          // Continue to mark locally as pending delete
        }
      }
      
      // Get the entity first
      const entity = await this.localAdapter.getById(id);
      if (!entity) {
        return false;
      }
      
      // Mark as pending delete in local storage
      const markedEntity = {
        ...entity,
        _pendingSync: true,
        _pendingDelete: true,
        _lastUpdated: new Date().toISOString()
      };
      
      await this.localAdapter.update(id, markedEntity);
      
      // Emit deleted event
      this.emit('entity-deleted', id);
      
      return true;
    } catch (error) {
      console.error(`Error in delete for ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Synchronize local data with remote storage
   */
  async sync(): Promise<void> {
    if (this.syncInProgress || !this.networkStatus.isOnline()) {
      return;
    }

    try {
      this.syncInProgress = true;
      this.emit('sync-start');

      // Get all entities with pending sync
      const pendingEntities = await this.getPendingEntities();
      if (pendingEntities.length === 0) {
        this.emit('sync-complete', { entitiesUpdated: 0 });
        return;
      }

      console.log(`Syncing ${pendingEntities.length} pending entities...`);
      
      const syncPromises = pendingEntities.map(async (entity) => {
        try {
          // Convert to API format
          const apiData = this.domainToApi(entity);
          
          // Add ID for update
          const apiUpdateData = { 
            id: entity.id,
            ...apiData 
          };
          
          let remoteEntity;
          try {
            // Try to update in remote
            remoteEntity = await this.remoteAdapter.update(
              entity.id, 
              apiUpdateData as unknown as Partial<ApiDTO>
            );
          } catch (updateError: any) {
            // Check if error is because entity doesn't exist remotely (PGRST116)
            if (updateError?.code === 'PGRST116' || 
                (updateError?.message && updateError.message.includes('JSON object requested, multiple (or no) rows returned'))) {
              console.log(`Entity ${entity.id} not found in remote database, creating instead of updating`);
              
              try {
                // Try to create instead of update
                remoteEntity = await this.remoteAdapter.create(
                  apiUpdateData as unknown as ApiDTO
                );
              } catch (createError: any) {
                // If we get a duplicate key error, the entity exists but we can't access it
                if (createError?.code === '23505' || 
                    (createError?.message && createError.message.includes('duplicate key value violates unique constraint'))) {
                  console.log(`Entity ${entity.id} exists but can't be accessed. Marking as synced locally.`);
                  
                  // Mark as synced in local database to prevent further sync attempts
                  entity._pendingSync = false;
                  entity._sync_error = undefined;
                  await this.localAdapter.update(entity.id, entity);
                  
                  return { 
                    success: true, 
                    entity,
                    message: 'Entity exists remotely but cannot be accessed. Marked as synced locally.'
                  };
                } else {
                  // Re-throw if it's a different error
                  throw createError;
                }
              }
            } else {
              // Re-throw if it's a different error
              throw updateError;
            }
          }
          
          // Convert response back to domain model
          const domainModel = this.apiToDomain(remoteEntity);
          
          // Clear sync flags
          domainModel._pendingSync = false;
          domainModel._sync_error = undefined;
          
          // Update in local storage
          await this.localAdapter.update(entity.id, domainModel);
          
          return { success: true, entity: domainModel };
        } catch (error) {
          console.error(`Error syncing entity ${entity.id}:`, error);
          
          // Mark sync error
          entity._sync_error = error instanceof Error ? error.message : 'Unknown error during sync';
          await this.localAdapter.update(entity.id, entity);
          
          return { success: false, entity, error };
        }
      });
      
      const syncResults = await Promise.all(syncPromises);
      
      // Emit sync completed event
      this.emit('sync-complete', {
        entitiesUpdated: syncResults.filter(result => result.success).length,
        errors: syncResults.filter(result => !result.success).map(result => result.error)
      });
    } catch (error) {
      console.error('Error during sync:', error);
      this.emit('sync-error', error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Check if there are pending changes to sync
   */
  async hasPendingChanges(): Promise<boolean> {
    const localEntities = await this.localAdapter.getAll();
    return localEntities.some(entity => entity._pendingSync);
  }
  
  /**
   * Force reload data from remote storage
   */
  async forceRefresh(): Promise<void> {
    if (!this.networkStatus.isOnline()) {
      throw new Error('Cannot refresh while offline');
    }
    
    try {
      // Get all data from remote
      const remoteData = await this.remoteAdapter.getAll();
      
      // Transform to domain models
      const domainModels = remoteData.map(dto => this.apiToDomain(dto));
      
      // Update local storage
      await this.updateLocalStorage(domainModels);
      
      // Emit refresh completed event
      this.emit('refresh-completed', domainModels);
    } catch (error) {
      console.error('Error during force refresh:', error);
      throw error;
    }
  }
  
  /**
   * Update local storage with domain models
   * This preserves any pending sync flags
   */
  private async updateLocalStorage(domainModels: T[]): Promise<void> {
    try {
      // Get current local entities to preserve pending sync flags
      const localEntities = await this.localAdapter.getAll();
      const pendingMap = new Map<string, T>();
      
      // Create map of entities with pending sync
      localEntities.forEach(entity => {
        if (entity._pendingSync) {
          pendingMap.set(entity.id, entity);
        }
      });
      
      // Update each entity in local storage, preserving pending sync flags
      for (const model of domainModels) {
        const pendingEntity = pendingMap.get(model.id);
        
        if (pendingEntity && pendingEntity._pendingSync) {
          // Skip updating entities with pending changes
          console.log(`Skipping overwrite of entity ${model.id} with pending changes`);
          continue;
        }
        
        // Update or create in local storage
        const existingEntity = await this.localAdapter.getById(model.id);
        
        if (existingEntity) {
          await this.localAdapter.update(model.id, model);
        } else {
          await this.localAdapter.create(model);
        }
      }
    } catch (error) {
      console.error('Error updating local storage:', error);
      throw error;
    }
  }
  
  private async getPendingEntities(): Promise<T[]> {
    const localEntities = await this.localAdapter.getAll();
    return localEntities.filter(entity => entity._pendingSync);
  }
}
