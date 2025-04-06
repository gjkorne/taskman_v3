import { ITaskService } from '../interfaces/ITaskService';
import { IAuthService } from '../interfaces/IAuthService';
import { IErrorService } from '../interfaces/IErrorService';
import { IFilterSortService } from '../interfaces/IFilterSortService';

// Import real service implementations
import { ErrorService } from '../error/ErrorService';
import { FilterSortService } from '../FilterSortService';

// Import mock service implementations
import { MockTaskService } from '../mocks/MockTaskService';
import { MockAuthService } from '../mocks/MockAuthService';
import { MockErrorService } from '../mocks/MockErrorService';
import { MockFilterSortService } from '../mocks/MockFilterSortService';

/**
 * Environment mode
 */
export type EnvironmentMode = 'production' | 'development' | 'test';

/**
 * Service factory configuration
 */
export interface ServiceFactoryConfig {
  /**
   * Environment mode - determines default service implementations
   */
  mode?: EnvironmentMode;

  /**
   * Whether to use mock implementations by default
   * This overrides the mode setting
   */
  useMocks?: boolean;
  
  /**
   * Optional test data for mock services
   */
  testData?: {
    tasks?: any[];
    initialUser?: any;
  };
}

/**
 * Map of service interface keys to their implementation types
 */
type ServiceKey = 'TaskService' | 'AuthService' | 'ErrorService' | 'FilterSortService';

/**
 * Map of service interfaces to their implementation types
 */
interface ServiceMap {
  TaskService: ITaskService;
  AuthService: IAuthService;
  ErrorService: IErrorService;
  FilterSortService: IFilterSortService;
}

// Service type used for caching
type ServiceCacheKey = `${ServiceKey}_${string}`;

/**
 * Service Factory - Creates service instances for production or testing
 * 
 * This factory makes it easier to switch between real and mock implementations,
 * especially in tests. It provides a central place to configure service behavior
 * and dependencies.
 */
export class ServiceFactory {
  private static config: ServiceFactoryConfig = {
    mode: process.env.NODE_ENV as EnvironmentMode || 'development',
    useMocks: false
  };
  
  // Cache of created services
  private static services: Record<ServiceCacheKey, any> = {};
  
  /**
   * Configure the service factory
   */
  static configure(config: ServiceFactoryConfig): void {
    ServiceFactory.config = { ...ServiceFactory.config, ...config };
    
    // Clear service cache when configuration changes
    ServiceFactory.services = {} as Record<ServiceCacheKey, any>;
  }
  
  /**
   * Reset the service factory to default configuration
   */
  static reset(): void {
    ServiceFactory.config = {
      mode: process.env.NODE_ENV as EnvironmentMode || 'development',
      useMocks: false
    };
    
    // Clear service cache
    ServiceFactory.services = {} as Record<ServiceCacheKey, any>;
  }
  
  /**
   * Get a service instance
   * Will return a cached instance if available, otherwise creates a new one
   */
  static getService<K extends ServiceKey>(
    serviceName: K,
    forceMock?: boolean
  ): ServiceMap[K] {
    // Determine if we should use a mock implementation
    const useMock = forceMock !== undefined 
      ? forceMock 
      : ServiceFactory.config.useMocks || ServiceFactory.config.mode === 'test';
    
    // Return cached service if available
    const cacheKey = `${serviceName}_${useMock ? 'mock' : 'real'}` as ServiceCacheKey;
    if (ServiceFactory.services[cacheKey]) {
      return ServiceFactory.services[cacheKey] as ServiceMap[K];
    }
    
    // Create and cache the service
    const service = ServiceFactory.createService(serviceName, useMock);
    ServiceFactory.services[cacheKey] = service;
    
    return service;
  }
  
  /**
   * Create a new service instance
   */
  private static createService<K extends ServiceKey>(
    serviceName: K,
    useMock: boolean
  ): ServiceMap[K] {
    // Create the appropriate service implementation based on service name
    switch(serviceName) {
      case 'TaskService': {
        const service = useMock 
          ? new MockTaskService(ServiceFactory.config.testData?.tasks || [])
          : ServiceFactory.getTaskServiceImpl();
        return service as unknown as ServiceMap[K];
      }
        
      case 'AuthService': {
        const service = useMock 
          ? new MockAuthService(ServiceFactory.config.testData?.initialUser)
          : ServiceFactory.getAuthServiceImpl();
        return service as unknown as ServiceMap[K];
      }
        
      case 'ErrorService': {
        const service = useMock 
          ? new MockErrorService()
          : new ErrorService();
        return service as unknown as ServiceMap[K];
      }
        
      case 'FilterSortService': {
        const service = useMock
          ? new MockFilterSortService()
          : new FilterSortService();
        return service as unknown as ServiceMap[K];
      }
        
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }
  
  /**
   * Helper to get the real TaskService implementation
   * This is a placeholder that you should replace with your actual TaskService implementation
   */
  private static getTaskServiceImpl(): ITaskService {
    // This should use the actual TaskService from your application
    // For now, we'll throw an error if attempting to use real implementation
    if (ServiceFactory.config.mode !== 'test') {
      throw new Error('Real TaskService implementation not available. Use mock or update ServiceFactory.');
    }
    
    // Fallback to mock for now - in a real implementation, these missing methods would be implemented
    return new MockTaskService() as unknown as ITaskService;
  }
  
  /**
   * Helper to get the real AuthService implementation
   * This is a placeholder that you should replace with your actual AuthService implementation
   */
  private static getAuthServiceImpl(): IAuthService {
    // This should use the actual AuthService from your application
    // For now, we'll throw an error if attempting to use real implementation
    if (ServiceFactory.config.mode !== 'test') {
      throw new Error('Real AuthService implementation not available. Use mock or update ServiceFactory.');
    }
    
    // Fallback to mock for now
    return new MockAuthService() as unknown as IAuthService;
  }
}
