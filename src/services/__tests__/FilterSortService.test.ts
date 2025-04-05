import { FilterSortService } from '../FilterSortService';
import { Task } from '../../types/task';
import { FilterCriteria, SortCriteria, GroupCriteria } from '../interfaces/IFilterSortService';

// Mock IDB
jest.mock('idb-keyval', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
}));

describe('FilterSortService', () => {
  let service: FilterSortService;
  let mockTasks: Task[];
  
  beforeEach(() => {
    service = new FilterSortService();
    
    // Create realistic mock tasks that match the Task type
    mockTasks = [
      {
        id: '1',
        title: 'High priority work task',
        description: 'This is a task for work',
        status: 'in_progress',
        priority: 'high',
        category_name: 'Work',
        created_at: '2025-04-01T10:00:00Z',
        updated_at: '2025-04-01T10:00:00Z',
        last_active: '2025-04-05T10:00:00Z',
        due_date: '2025-04-06T23:59:59Z',
        user_id: 'user1',
        tags: ['important', 'meeting'],
        is_deleted: false
      },
      {
        id: '2',
        title: 'Medium priority personal task',
        description: 'This is a personal task',
        status: 'not_started',
        priority: 'medium',
        category_name: 'Personal',
        created_at: '2025-04-02T10:00:00Z',
        updated_at: '2025-04-02T10:00:00Z',
        last_active: '2025-04-04T10:00:00Z',
        due_date: '2025-04-10T23:59:59Z',
        user_id: 'user1',
        tags: ['home'],
        is_deleted: false
      },
      {
        id: '3',
        title: 'Low priority completed task',
        description: 'This is a completed task',
        status: 'completed',
        priority: 'low',
        category_name: 'Work',
        created_at: '2025-04-03T10:00:00Z',
        updated_at: '2025-04-03T10:00:00Z',
        last_active: '2025-04-03T10:00:00Z',
        due_date: null,
        user_id: 'user1',
        tags: [],
        is_deleted: false
      }
    ];
  });
  
  describe('applyFilters', () => {
    test('should return all tasks when no filters are provided', () => {
      const result = service.applyFilters(mockTasks, []);
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockTasks);
    });
    
    test('should filter tasks by category', () => {
      const filters: FilterCriteria[] = [
        { field: 'category_name', operator: 'in', value: ['Work'] }
      ];
      
      const result = service.applyFilters(mockTasks, filters);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });
    
    test('should filter tasks by priority', () => {
      const filters: FilterCriteria[] = [
        { field: 'priority', operator: 'in', value: ['high'] }
      ];
      
      const result = service.applyFilters(mockTasks, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
    
    test('should filter tasks by status', () => {
      const filters: FilterCriteria[] = [
        { field: 'status', operator: 'neq', value: 'completed' }
      ];
      
      const result = service.applyFilters(mockTasks, filters);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });
    
    test('should combine multiple filters with AND logic', () => {
      const filters: FilterCriteria[] = [
        { field: 'category_name', operator: 'in', value: ['Work'] },
        { field: 'status', operator: 'neq', value: 'completed' }
      ];
      
      const result = service.applyFilters(mockTasks, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });
  
  describe('applySorting', () => {
    test('should sort tasks by priority in descending order', () => {
      const sortCriteria: SortCriteria = {
        field: 'priority',
        direction: 'desc'
      };
      
      const result = service.applySorting(mockTasks, sortCriteria);
      expect(result[0].id).toBe('1'); // High priority
      expect(result[1].id).toBe('2'); // Medium priority
      expect(result[2].id).toBe('3'); // Low priority
    });
    
    test('should sort tasks by due date in ascending order', () => {
      const sortCriteria: SortCriteria = {
        field: 'due_date',
        direction: 'asc'
      };
      
      const result = service.applySorting(mockTasks, sortCriteria);
      // Task 3 has null due date, should be last
      // Task 1 has earlier due date than Task 2
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[2].id).toBe('3');
    });
  });
  
  describe('applyGrouping', () => {
    test('should group tasks by category', () => {
      const groupCriteria: GroupCriteria = {
        field: 'category_name'
      };
      
      const result = service.applyGrouping(mockTasks, groupCriteria);
      
      // Should have groups for 'Work' and 'Personal'
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['Work']).toHaveLength(2);
      expect(result['Personal']).toHaveLength(1);
    });
  });
  
  describe('createPresetFilter', () => {
    test('should create a high priority filter', () => {
      const filters = service.createPresetFilter('high-priority');
      expect(filters).toHaveLength(1);
      expect(filters[0].field).toBe('priority');
      expect(filters[0].operator).toBe('in');
      expect(filters[0].value).toEqual(['high']);
    });
    
    test('should create a due today filter', () => {
      const filters = service.createPresetFilter('due-today');
      expect(filters).toHaveLength(1);
      expect(filters[0].field).toBe('due_date');
      expect(filters[0].operator).toBe('eq');
      expect(filters[0].value).toBe('today');
    });
  });
});
