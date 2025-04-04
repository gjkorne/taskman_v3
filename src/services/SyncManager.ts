import { IOfflineCapableService } from './interfaces/IService';
import { ServiceRegistry } from './ServiceRegistry';
import { AppError, ErrorHandler, ErrorType } from '../utils/errorHandling';

/**
 * SyncManager coordinates synchronization between offline-capable services
 * 
 * This provides centralized control over synchronization strategies:
 * - Auto-sync when coming back online
 * - Periodic background sync
 * - Manual sync triggered by user
 * - Conflict resolution strategies
 */
export class SyncManager {
  private static instance: SyncManager;
  private services: IOfflineCapableService[] = [];
  private isSyncing: boolean = false;
  private syncInterval: number | null = null;
  private backgroundSyncEnabled: boolean = true;
  private networkStatusService = ServiceRegistry.getNetworkStatusService();
  
  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {
    // Register for network status changes
    this.networkStatusService.onConnectivityChange(this.handleConnectivityChange);
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }
  
  /**
   * Register a service for synchronization
   */
  public registerService(service: IOfflineCapableService): void {
    if (!this.services.includes(service)) {
      this.services.push(service);
      console.log(`Service registered for synchronization`);
    }
  }
  
  /**
   * Enable or disable background synchronization
   */
  public setBackgroundSyncEnabled(enabled: boolean): void {
    this.backgroundSyncEnabled = enabled;
    
    if (enabled) {
      this.startPeriodicSync();
    } else {
      this.stopPeriodicSync();
    }
  }
  
  /**
   * Start periodic background sync
   */
  public startPeriodicSync(intervalMs: number = 5 * 60 * 1000): void {
    if (this.syncInterval) {
      this.stopPeriodicSync();
    }
    
    this.syncInterval = window.setInterval(() => {
      if (this.networkStatusService.isOnline() && this.backgroundSyncEnabled) {
        this.syncAll(true)
          .catch(error => {
            console.error('Background sync failed:', error);
          });
      }
    }, intervalMs);
    
    console.log(`Periodic sync started with interval: ${intervalMs}ms`);
  }
  
  /**
   * Stop periodic background sync
   */
  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic sync stopped');
    }
  }
  
  /**
   * Manually trigger synchronization of all services
   */
  public async syncAll(isBackgroundSync: boolean = false): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }
    
    if (!this.networkStatusService.isOnline()) {
      const error = new AppError(
        ErrorType.NETWORK,
        'Cannot sync while offline',
        {
          originalError: null,
          code: 'OFFLINE'
        }
      );
      
      if (!isBackgroundSync) {
        ErrorHandler.handleError(error);
      }
      
      throw error;
    }
    
    this.isSyncing = true;
    
    try {
      // Check if there are any services with unsynced changes
      const servicesWithChanges = await this.getServicesWithUnsyncedChanges();
      
      if (servicesWithChanges.length === 0) {
        console.log('No unsynced changes found, nothing to synchronize');
        return;
      }
      
      console.log(`Starting sync for ${servicesWithChanges.length} services with unsynced changes`);
      
      // Synchronize each service
      const syncPromises = servicesWithChanges.map(async (service) => {
        try {
          await service.sync();
          return { success: true, service };
        } catch (error) {
          return { success: false, service, error };
        }
      });
      
      const results = await Promise.all(syncPromises);
      
      // Check for errors
      const failures = results.filter(result => !result.success);
      
      if (failures.length > 0) {
        console.error(`Sync completed with ${failures.length} failures`);
        
        // Only throw an error for manual syncs, not background syncs
        if (!isBackgroundSync) {
          const error = new AppError(
            ErrorType.DATA_SYNC,
            `Failed to sync ${failures.length} services`,
            {
              originalError: failures.map(f => f.error),
              code: 'SYNC_PARTIAL_FAILURE'
            }
          );
          
          ErrorHandler.handleError(error);
          throw error;
        }
      } else {
        console.log('All services synced successfully');
      }
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Handle connectivity changes
   */
  private handleConnectivityChange = async (isOnline: boolean): Promise<void> => {
    if (isOnline) {
      console.log('Connection restored, checking for unsynced changes');
      
      try {
        const servicesWithChanges = await this.getServicesWithUnsyncedChanges();
        
        if (servicesWithChanges.length > 0) {
          console.log(`Found ${servicesWithChanges.length} services with unsynced changes, initiating sync`);
          this.syncAll(true).catch(error => {
            console.error('Auto-sync failed:', error);
          });
        } else {
          console.log('No unsynced changes found after coming online');
        }
      } catch (error) {
        console.error('Error checking for unsynced changes:', error);
      }
    } else {
      console.log('Connection lost, sync paused');
    }
  }
  
  /**
   * Get services that have unsynced changes
   */
  private async getServicesWithUnsyncedChanges(): Promise<IOfflineCapableService[]> {
    const checkPromises = this.services.map(async (service) => {
      try {
        const hasChanges = await service.hasUnsyncedChanges();
        return { service, hasChanges };
      } catch (error) {
        console.error('Error checking for unsynced changes:', error);
        return { service, hasChanges: false };
      }
    });
    
    const results = await Promise.all(checkPromises);
    
    return results
      .filter(result => result.hasChanges)
      .map(result => result.service);
  }
}

// Export singleton instance
export const syncManager = SyncManager.getInstance();
