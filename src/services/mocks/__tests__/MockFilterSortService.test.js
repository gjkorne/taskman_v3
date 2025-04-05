// Tests for the MockFilterSortService
// This demonstrates how to use the mock in your component and service tests

import { MockFilterSortService } from '../MockFilterSortService';

// Mock imports - this ensures we don't have TypeScript issues in the test environment
jest.mock('../../../test-utils/MockFactory', () => ({
  MockFactory: {
    createTasks: jest.fn().mockImplementation((count) => {
      return Array.from({ length: count || 3 }, (_, i) => ({
        id: `task-${i+1}`,
        title: `Task ${i+1}`,
        priority: i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low'),
        status: i % 4 === 0 ? 'completed' : (i % 4 === 1 ? 'in_progress' : 'active'),
        due_date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        category_name: i % 2 === 0 ? 'Work' : 'Personal'
      }));
    }),
    createTask: jest.fn().mockImplementation((overrides = {}) => ({
      id: overrides.id || 'mock-1',
      title: overrides.title || 'Mock Task',
      priority: overrides.priority || 'medium',
      status: overrides.status || 'active',
      due_date: overrides.due_date || new Date().toISOString().split('T')[0],
      category_name: overrides.category_name || 'Work',
      ...overrides
    }))
  }
}));

// Mock the TaskPriority and TaskStatus to avoid TypeScript imports in test files
const TaskPriority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const TaskStatus = {
  ACTIVE: 'active',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

describe('MockFilterSortService', () => {
  let mockService;
  let mockTasks;

  beforeEach(() => {
    // Create a fresh instance of the mock service for each test
    mockService = new MockFilterSortService();
    
    // Create some test tasks - using simple objects to avoid TypeScript issues
    mockTasks = [
      {
        id: '1',
        title: 'Complete project',
        priority: 'high',
        status: 'in_progress',
        due_date: '2025-04-10',
        category_name: 'Work'
      },
      {
        id: '2',
        title: 'Buy groceries',
        priority: 'medium',
        status: 'active',
        due_date: '2025-04-05',
        category_name: 'Personal'
      },
      {
        id: '3',
        title: 'Team meeting',
        priority: 'low',
        status: 'active',
        due_date: '2025-04-15',
        category_name: 'Work'
      }
    ];
  });

  test('applies filters correctly', () => {
    // Define a filter for high priority tasks
    const filters = [
      { field: 'priority', operator: 'eq', value: 'high' }
    ];
    
    // Apply the filter
    const result = mockService.applyFilters(mockTasks, filters);
    
    // Verify the filter was applied correctly
    expect(result.length).toBeLessThanOrEqual(mockTasks.length);
    result.forEach(task => {
      expect(task.priority).toBe('high');
    });
    
    // Verify the method was called with the correct arguments
    expect(mockService.methodCalls.applyFilters.length).toBe(1);
    expect(mockService.methodCalls.applyFilters[0].filters).toBe(filters);
  });

  test('applies sorting correctly', () => {
    // Define sort criteria for due date in ascending order
    const sortCriteria = [
      { field: 'due_date', direction: 'asc' }
    ];
    
    // Apply sorting
    const result = mockService.applySorting(mockTasks, sortCriteria);
    
    // Verify sorting was applied (assuming due_date is a valid date string)
    for (let i = 0; i < result.length - 1; i++) {
      const currentDate = new Date(result[i].due_date).getTime();
      const nextDate = new Date(result[i + 1].due_date).getTime();
      expect(currentDate).toBeLessThanOrEqual(nextDate);
    }
    
    // Verify the method was called with the correct arguments
    expect(mockService.methodCalls.applySorting.length).toBe(1);
    expect(mockService.methodCalls.applySorting[0].sort).toBe(sortCriteria);
  });

  test('groups items correctly', () => {
    // Define grouping criteria by status
    const groupCriteria = { field: 'status' };
    
    // Apply grouping
    const result = mockService.groupItems(mockTasks, groupCriteria);
    
    // Verify groups are created correctly
    Object.entries(result).forEach(([key, tasks]) => {
      tasks.forEach(task => {
        expect(task.status).toBe(key);
      });
    });
    
    // Verify the method was called with the correct arguments
    expect(mockService.methodCalls.groupItems.length).toBe(1);
    expect(mockService.methodCalls.groupItems[0].grouping).toBe(groupCriteria);
  });

  test('handles preset filters', () => {
    // Get preset filter for high priority
    const highPriorityFilter = mockService.createPresetFilter('highPriority');
    
    // Verify the preset filter is correct
    expect(highPriorityFilter.length).toBe(1);
    expect(highPriorityFilter[0].field).toBe('priority');
    expect(highPriorityFilter[0].value).toBe('high');
    
    // Verify the method was called with the correct arguments
    expect(mockService.methodCalls.createPresetFilter.length).toBe(1);
    expect(mockService.methodCalls.createPresetFilter[0].presetName).toBe('highPriority');
  });

  test('allows mocking return values', () => {
    // Setup mock return value
    const mockTasksResult = [{ id: 'mock-1', title: 'Mock task' }];
    mockService.mockMethod('applyFilters', mockTasksResult);
    
    // Call the method
    const result = mockService.applyFilters(mockTasks, []);
    
    // Verify the mock return value is used
    expect(result).toBe(mockTasksResult);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('mock-1');
  });

  test('tracks method calls for assertions', () => {
    // Call various methods
    mockService.applyFilters(mockTasks, []);
    mockService.applySorting(mockTasks, []);
    mockService.groupItems(mockTasks, { field: 'status' });
    
    // Verify method calls are tracked
    expect(mockService.methodCalls.applyFilters.length).toBe(1);
    expect(mockService.methodCalls.applySorting.length).toBe(1);
    expect(mockService.methodCalls.groupItems.length).toBe(1);
    
    // Reset mocks
    mockService.resetMocks();
    
    // Verify all call trackers are reset
    expect(mockService.methodCalls.applyFilters.length).toBe(0);
    expect(mockService.methodCalls.applySorting.length).toBe(0);
    expect(mockService.methodCalls.groupItems.length).toBe(0);
  });

  test('combines filtering and sorting in filterAndSortTasks', () => {
    // Define filters and sort criteria
    const filters = [
      { field: 'status', operator: 'eq', value: 'active' }
    ];
    const sortCriteria = { field: 'priority', direction: 'desc' };
    
    // Apply filtering and sorting
    const result = mockService.filterAndSortTasks(mockTasks, filters, sortCriteria);
    
    // Verify all tasks have the correct status
    result.forEach(task => {
      expect(task.status).toBe('active');
    });
    
    // Verify the method was called with the correct arguments
    expect(mockService.methodCalls.filterAndSortTasks.length).toBe(1);
    expect(mockService.methodCalls.filterAndSortTasks[0].filters).toBe(filters);
    expect(mockService.methodCalls.filterAndSortTasks[0].sort).toBe(sortCriteria);
  });

  test('allows simulating errors in async methods', async () => {
    // Setup mock error
    const mockError = new Error('Failed to save filters');
    mockService.mockMethod('saveUserFilters', mockError);
    
    // Verify the error is thrown
    await expect(mockService.saveUserFilters('user-1', [])).rejects.toThrow('Failed to save filters');
  });
});
