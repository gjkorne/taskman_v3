# Service Factory Pattern

## Overview

The Service Factory pattern in TaskMan v3 provides a centralized mechanism for accessing service instances throughout the application. This approach improves testability, maintainability, and the overall architecture by creating a clear separation between the UI layer and the business logic/data access layers.

## Key Benefits

- **Dependency Injection**: Services can be easily swapped or mocked for testing
- **Service Lifetime Management**: Controls when services are created and destroyed
- **Configuration**: Centralized configuration for all services
- **Isolation**: UI components don't need to know the implementation details of services
- **Testing**: Easy to replace real services with mocks during tests

## Implementation

### ServiceFactory

The ServiceFactory is the central registry for all services in the application. It provides methods to register, retrieve, and manage service instances.

```typescript
// services/factory/ServiceFactory.ts
export class ServiceFactory {
  private static services: Map<string, any> = new Map();
  private static config: ServiceFactoryConfig = { mode: 'production' };

  /**
   * Configure the factory settings
   */
  static configure(config: ServiceFactoryConfig) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get a service instance by name
   */
  static getService<T>(serviceName: string): T {
    // Check if service exists in registry
    if (this.services.has(serviceName)) {
      return this.services.get(serviceName) as T;
    }

    // Create and register new service instance
    const service = this.createService<T>(serviceName);
    this.services.set(serviceName, service);
    return service;
  }

  /**
   * Create a new service instance
   */
  private static createService<T>(serviceName: string): T {
    switch (this.config.mode) {
      case 'test':
        return this.createMockService<T>(serviceName);
      case 'production':
      default:
        return this.createRealService<T>(serviceName);
    }
  }

  /**
   * Create a real service implementation
   */
  private static createRealService<T>(serviceName: string): T {
    // Dynamically create service instances based on name
    switch (serviceName) {
      case 'TaskService':
        return new TaskService() as unknown as T;
      case 'ErrorService':
        return new ErrorService() as unknown as T;
      // Other services...
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  /**
   * Create a mock service for testing
   */
  private static createMockService<T>(serviceName: string): T {
    // Dynamically create mock service instances based on name
    switch (serviceName) {
      case 'TaskService':
        return new MockTaskService() as unknown as T;
      case 'ErrorService':
        return new MockErrorService() as unknown as T;
      // Other mock services...
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  /**
   * Reset the factory to its initial state
   * Primarily used for testing
   */
  static reset() {
    this.services.clear();
    this.config = { mode: 'production' };
  }
}
```

## Usage Guidelines

### 1. Accessing Services

Access services through the factory instead of creating them directly:

```typescript
// Good
const taskService = ServiceFactory.getService<ITaskService>('TaskService');

// Avoid
const taskService = new TaskService(); // Don't create service instances directly
```

### 2. In Contexts

Context providers should use the factory to access services:

```typescript
export const TasksProvider: React.FC<TasksProviderProps> = ({ children, service }) => {
  // Use provided service or get from factory
  const taskService = service || 
    ServiceFactory.getService<ITaskService>('TaskService');
  
  // Context implementation...
}
```

### 3. Testing

Configure the factory for testing mode:

```typescript
// In test setup
beforeEach(() => {
  // Set factory to testing mode
  ServiceFactory.configure({ mode: 'test' });
  
  // Clear any previous service instances
  ServiceFactory.reset();
});

// In tests
test('should perform action', () => {
  const taskService = ServiceFactory.getService<MockTaskService>('TaskService');
  
  // Now you can use the mock service for testing
  taskService.mockMethod('getTasks', { tasks: mockTasks });
  
  // Test the component...
});
```

## Best Practices

1. **Service Interfaces**: Always define service interfaces separate from implementations
2. **Context Integration**: Use services through contexts, not directly in components
3. **Offline Capabilities**: Implement offline support in the service layer, not UI
4. **Error Handling**: Centralize error handling through the ErrorContext
5. **Service Composition**: Services can use other services through the factory
6. **Avoid State**: Keep services stateless when possible, store state in contexts
7. **Factory Configuration**: Configure factory early in app initialization

## Service Development Checklist

When creating a new service:

- [ ] Define service interface in `/services/interfaces/`
- [ ] Implement real service in `/services/`
- [ ] Create mock implementation in `/services/mocks/`
- [ ] Register service in ServiceFactory
- [ ] Add service to service registration type definitions
- [ ] Write unit tests for the service
- [ ] Create a context for accessing the service (if needed)
