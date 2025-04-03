/**
 * Service container for dependency injection
 * 
 * This allows decoupling service implementations from their consumers,
 * enabling easier testing and future refactoring.
 */

// Type for service constructor
type ServiceConstructor<T> = new (...args: any[]) => T;

export class ServiceContainer {
  private static instance: ServiceContainer;
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();

  /**
   * Get the singleton instance of ServiceContainer
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Reset the container (mainly for testing)
   */
  static reset(): void {
    if (ServiceContainer.instance) {
      ServiceContainer.instance.services.clear();
      ServiceContainer.instance.factories.clear();
    }
  }

  /**
   * Register a service instance
   */
  register<T>(token: string, instance: T): void {
    this.services.set(token, instance);
  }

  /**
   * Register a factory function to create a service lazily
   */
  registerFactory<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }

  /**
   * Register a class as a service (will be instantiated lazily on first get)
   */
  registerClass<T>(token: string, serviceClass: ServiceConstructor<T>, deps: any[] = []): void {
    this.factories.set(token, () => new serviceClass(...deps));
  }

  /**
   * Get a service by its token
   */
  get<T>(token: string): T {
    // Return existing instance if available
    if (this.services.has(token)) {
      return this.services.get(token) as T;
    }

    // Create instance from factory if available
    if (this.factories.has(token)) {
      const factory = this.factories.get(token);
      if (factory) {
        const instance = factory();
        this.services.set(token, instance);
        return instance as T;
      }
    }

    throw new Error(`Service not found: ${token}`);
  }

  /**
   * Check if a service is registered
   */
  has(token: string): boolean {
    return this.services.has(token) || this.factories.has(token);
  }
}

// Export a singleton instance
export const serviceContainer = ServiceContainer.getInstance();

// Define service tokens as constants to avoid magic strings
export const SERVICE_TOKENS = {
  TASK_SERVICE: 'taskService',
  TIME_SESSION_SERVICE: 'timeSessionService',
  AUTH_SERVICE: 'authService',
  NETWORK_STATUS_SERVICE: 'networkStatusService',
  SETTINGS_SERVICE: 'settingsService',
  CATEGORY_SERVICE: 'categoryService',
  NOTIFICATION_SERVICE: 'notificationService',
};
