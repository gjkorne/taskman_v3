import { SERVICE_TOKENS, serviceContainer } from './ServiceContainer';
import { taskService } from './taskService';
import { NetworkStatusService } from '../services/networkStatusService';
import { timeSessionsService } from './api/timeSessionsService';
import { ITaskService } from './interfaces/ITaskService';
import { ITimeSessionService } from './interfaces/ITimeSessionService';
import { ErrorHandler } from '../utils/errorHandling';

/**
 * Service Registry - Configures and registers all application services
 * 
 * This provides a centralized place to register all services with the
 * service container, making it easier to manage dependencies and 
 * enable testing with mock implementations.
 */
export class ServiceRegistry {
  /**
   * Initialize all services and register them with the container
   */
  static initialize(): void {
    // Add error handler for services
    ErrorHandler.registerHandler((error) => {
      console.error('[ServiceError]', error.getUserMessage());
    });

    // Register all services
    ServiceRegistry.registerTaskService();
    ServiceRegistry.registerNetworkStatusService();
    ServiceRegistry.registerTimeSessionService();
  }

  /**
   * Register the task service
   */
  private static registerTaskService(): void {
    // Register the existing singleton instance
    serviceContainer.register<ITaskService>(
      SERVICE_TOKENS.TASK_SERVICE, 
      taskService
    );
  }

  /**
   * Register the network status service
   */
  private static registerNetworkStatusService(): void {
    // Create and register a new instance
    const networkStatusService = new NetworkStatusService();
    serviceContainer.register(
      SERVICE_TOKENS.NETWORK_STATUS_SERVICE, 
      networkStatusService
    );
  }

  /**
   * Register the time session service
   */
  private static registerTimeSessionService(): void {
    // Register the existing time sessions service
    serviceContainer.register<ITimeSessionService>(
      SERVICE_TOKENS.TIME_SESSION_SERVICE, 
      timeSessionsService as unknown as ITimeSessionService
    );
  }

  /**
   * Get a registered service by token
   */
  static getService<T>(token: string): T {
    return serviceContainer.get<T>(token);
  }

  /**
   * Get the task service
   */
  static getTaskService(): ITaskService {
    return ServiceRegistry.getService<ITaskService>(SERVICE_TOKENS.TASK_SERVICE);
  }

  /**
   * Get the network status service
   */
  static getNetworkStatusService(): NetworkStatusService {
    return ServiceRegistry.getService<NetworkStatusService>(SERVICE_TOKENS.NETWORK_STATUS_SERVICE);
  }

  /**
   * Get the time session service
   */
  static getTimeSessionService(): ITimeSessionService {
    return ServiceRegistry.getService<ITimeSessionService>(SERVICE_TOKENS.TIME_SESSION_SERVICE);
  }
}

// Initialize services on module import
// Comment this out during tests to prevent automatic initialization
// ServiceRegistry.initialize();
