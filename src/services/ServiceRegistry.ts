import { SERVICE_TOKENS, serviceContainer } from './ServiceContainer';
import { taskService } from './taskService';
import { NetworkStatusService } from '../services/networkStatusService';
import { timeSessionsService } from './api/timeSessionsService';
import { ITaskService } from './interfaces/ITaskService';
import { ITimeSessionService } from './interfaces/ITimeSessionService';
import { IFilterSortService } from './interfaces/IFilterSortService';
import { ErrorHandler } from '../utils/errorHandling';
import { FilterSortService } from './FilterSortService';

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

    // Register services with the container
    ServiceRegistry.registerTaskService();
    ServiceRegistry.registerNetworkStatusService();
    ServiceRegistry.registerTimeSessionService();
    ServiceRegistry.registerFilterSortService();
  }

  /**
   * Register the task service
   */
  private static registerTaskService(): void {
    // Register the existing task service
    serviceContainer.register<ITaskService>(
      SERVICE_TOKENS.TASK_SERVICE, 
      taskService
    );
  }

  /**
   * Register the network status service
   */
  private static registerNetworkStatusService(): void {
    // Register a new instance of the network status service
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
   * Register the filter/sort service
   */
  private static registerFilterSortService(): void {
    // Create a new instance of the FilterSortService
    const filterSortService = new FilterSortService();
    
    // Register the filter/sort service
    serviceContainer.register<IFilterSortService>(
      SERVICE_TOKENS.FILTER_SORT_SERVICE, 
      filterSortService
    );
  }

  /**
   * Get a service from the container
   */
  private static getService<T>(token: string): T {
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

  /**
   * Get the filter/sort service
   */
  static getFilterSortService(): IFilterSortService {
    return ServiceRegistry.getService<IFilterSortService>(SERVICE_TOKENS.FILTER_SORT_SERVICE);
  }
}

// Initialize services on module import
ServiceRegistry.initialize();
