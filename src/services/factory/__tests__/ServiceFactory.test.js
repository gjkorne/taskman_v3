// Tests for the ServiceFactory
// This demonstrates how to use the factory in your component and service tests

import { ServiceFactory } from '../ServiceFactory';
import { MockTaskService } from '../../mocks/MockTaskService';
import { MockAuthService } from '../../mocks/MockAuthService';
import { MockErrorService } from '../../mocks/MockErrorService';
import { MockFilterSortService } from '../../mocks/MockFilterSortService';

describe('ServiceFactory', () => {
  // Reset the factory before each test
  beforeEach(() => {
    ServiceFactory.reset();
  });

  test('provides mock services in test mode', () => {
    // Configure for test mode
    ServiceFactory.configure({ mode: 'test' });
    
    // Get services
    const taskService = ServiceFactory.getService('TaskService');
    const authService = ServiceFactory.getService('AuthService');
    const errorService = ServiceFactory.getService('ErrorService');
    const filterSortService = ServiceFactory.getService('FilterSortService');
    
    // Verify mock services are provided
    expect(taskService).toBeInstanceOf(MockTaskService);
    expect(authService).toBeInstanceOf(MockAuthService);
    expect(errorService).toBeInstanceOf(MockErrorService);
    expect(filterSortService).toBeInstanceOf(MockFilterSortService);
  });

  test('provides mock services when useMocks is true', () => {
    // Configure to use mocks explicitly
    ServiceFactory.configure({ mode: 'production', useMocks: true });
    
    // Get services
    const taskService = ServiceFactory.getService('TaskService');
    const authService = ServiceFactory.getService('AuthService');
    
    // Verify mock services are provided despite production mode
    expect(taskService).toBeInstanceOf(MockTaskService);
    expect(authService).toBeInstanceOf(MockAuthService);
  });

  test('caches service instances', () => {
    // Configure for test mode
    ServiceFactory.configure({ mode: 'test' });
    
    // Get services twice
    const taskService1 = ServiceFactory.getService('TaskService');
    const taskService2 = ServiceFactory.getService('TaskService');
    
    // Verify the same instance is returned
    expect(taskService1).toBe(taskService2);
  });

  test('creates new instances after reset', () => {
    // Configure for test mode
    ServiceFactory.configure({ mode: 'test' });
    
    // Get a service
    const taskService1 = ServiceFactory.getService('TaskService');
    
    // Reset the factory
    ServiceFactory.reset();
    
    // Get the service again
    const taskService2 = ServiceFactory.getService('TaskService');
    
    // Verify a new instance was created
    expect(taskService1).not.toBe(taskService2);
  });

  test('allows forcing mock implementation', () => {
    // Configure for production mode
    ServiceFactory.configure({ mode: 'production', useMocks: false });
    
    // Get a service with forced mock
    const taskService = ServiceFactory.getService('TaskService', true);
    
    // Verify mock service is provided
    expect(taskService).toBeInstanceOf(MockTaskService);
  });

  test('initializes mock services with test data', () => {
    // Create test tasks
    const testTasks = [
      { id: 'task-1', title: 'Test Task 1' },
      { id: 'task-2', title: 'Test Task 2' }
    ];
    
    // Configure with test data
    ServiceFactory.configure({
      mode: 'test',
      testData: {
        tasks: testTasks
      }
    });
    
    // Get task service
    const taskService = ServiceFactory.getService('TaskService');
    
    // Verify service is initialized with test data
    taskService.getTasks().then(tasks => {
      expect(tasks.length).toBe(2);
      expect(tasks[0].id).toBe('task-1');
    });
  });

  test('handles errors when real implementations are not available', () => {
    // This test ensures that the factory gracefully handles missing real implementations
    
    // Configure for production mode but try to access TestTaskService
    // which doesn't have a real implementation
    ServiceFactory.configure({ mode: 'production', useMocks: false });
    
    // Expect error when trying to get real service
    expect(() => {
      ServiceFactory.getService('TaskService', false);
    }).toThrow(/Real TaskService implementation not available/);
  });

  // Example of how to use in a component test
  test('demonstration: using in a component test', () => {
    // Setup: Configure the factory for testing
    ServiceFactory.configure({ 
      mode: 'test',
      testData: {
        tasks: [
          { id: 'task-1', title: 'Component Test Task' }
        ]
      }
    });
    
    // Get the service for use in test
    const taskService = ServiceFactory.getService('TaskService');
    
    // Mock a specific method for this test
    const mockTask = { id: 'mock-task', title: 'Mocked Task' };
    taskService.mockMethod('getTaskById', mockTask);
    
    // Use in your test
    taskService.getTaskById('any-id').then(task => {
      expect(task).toBe(mockTask);
      expect(task.title).toBe('Mocked Task');
    });
    
    // Verify the method was called
    expect(taskService.methodCalls.getTaskById.length).toBe(1);
  });
});
