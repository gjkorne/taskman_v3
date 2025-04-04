import { ServiceRegistry } from './ServiceRegistry';
import { supabase } from '../lib/supabase';
import { AppError, ErrorHandler } from '../utils/errorHandling';
import { SyncManager } from './SyncManager';
import { IOfflineCapableService } from './interfaces/IService';

/**
 * Application initialization manager
 * 
 * Handles bootstrapping services, authentication, and
 * other initialization tasks in a centralized way
 */
export class AppInitializer {
  private static isInitialized = false;

  /**
   * Initialize the application
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Application already initialized');
      return;
    }

    try {
      // Initialize error handling
      this.initializeErrorHandling();
      
      // Initialize all services
      ServiceRegistry.initialize();
      
      // Setup sync manager
      this.initializeSyncManager();
      
      // Check authentication status
      await this.checkAuthentication();
      
      // Set initialization flag
      this.isInitialized = true;
      
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw AppError.from(error);
    }
  }

  /**
   * Initialize error handling
   */
  private static initializeErrorHandling(): void {
    // Configure global error handler
    window.addEventListener('error', (event) => {
      ErrorHandler.handleError(event.error || new Error(event.message));
      // Don't prevent default to allow browser's default error handling
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      ErrorHandler.handleError(event.reason);
      // Don't prevent default to allow browser's default error handling
    });

    console.log('Global error handlers initialized');
  }
  
  /**
   * Initialize the sync manager and register services
   */
  private static initializeSyncManager(): void {
    const syncManager = SyncManager.getInstance();
    
    // Register task service if it supports offline capabilities
    const taskService = ServiceRegistry.getTaskService();
    if (this.isOfflineCapable(taskService)) {
      syncManager.registerService(taskService);
    }
    
    // Start periodic background sync (every 5 minutes)
    syncManager.startPeriodicSync(5 * 60 * 1000);
    
    console.log('SyncManager initialized');
  }
  
  /**
   * Type guard to check if a service supports offline capabilities
   */
  private static isOfflineCapable(service: any): service is IOfflineCapableService {
    return (
      typeof service.hasUnsyncedChanges === 'function' &&
      typeof service.sync === 'function' &&
      typeof service.forceRefresh === 'function'
    );
  }

  /**
   * Check authentication status
   */
  private static async checkAuthentication(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        console.log('User authenticated:', data.session.user.id);
      } else {
        console.log('No active session found');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      // Don't throw here - we want initialization to continue even if auth fails
    }
  }
}
