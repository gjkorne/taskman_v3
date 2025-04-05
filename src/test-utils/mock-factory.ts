import { Task } from '../types/task';
import { FilterCriteria, SortCriteria, GroupCriteria } from '../services/interfaces/IFilterSortService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock factory for creating test data
 * This helps maintain consistent test data across different test files
 */
export class MockFactory {
  /**
   * Create a mock task with default or specified properties
   */
  static createTask(override?: Partial<Task>): Task {
    const defaultTask: Task = {
      id: uuidv4(),
      title: 'Mock Task',
      description: 'This is a mock task for testing',
      status: 'not_started',
      priority: 'medium',
      category_name: 'Work',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      due_date: null,
      user_id: 'test-user-id',
      tags: [],
      is_deleted: false
    };
    
    return { ...defaultTask, ...override };
  }
  
  /**
   * Create an array of mock tasks
   */
  static createTaskList(count: number, overrides?: Partial<Task>[]): Task[] {
    return Array.from({ length: count }).map((_, index) => {
      const override = overrides && overrides[index] ? overrides[index] : {};
      return this.createTask(override);
    });
  }
  
  /**
   * Create a sample filter criteria
   */
  static createFilterCriteria(field: string, operator: string, value: any): FilterCriteria {
    return { field, operator, value };
  }
  
  /**
   * Create a preset of common filter scenarios
   */
  static createFilterPreset(presetName: string): FilterCriteria[] {
    switch (presetName) {
      case 'high-priority':
        return [this.createFilterCriteria('priority', 'in', ['high'])];
      case 'work-tasks':
        return [this.createFilterCriteria('category_name', 'in', ['Work'])];
      case 'personal-tasks':
        return [this.createFilterCriteria('category_name', 'in', ['Personal'])];
      case 'due-today':
        return [this.createFilterCriteria('due_date', 'eq', 'today')];
      case 'overdue':
        return [this.createFilterCriteria('due_date', 'lt', 'today')];
      case 'incomplete':
        return [this.createFilterCriteria('status', 'neq', 'completed')];
      default:
        return [];
    }
  }
  
  /**
   * Create a sort criteria
   */
  static createSortCriteria(field: string, direction: 'asc' | 'desc' = 'desc'): SortCriteria {
    return { field, direction };
  }
  
  /**
   * Create a group criteria
   */
  static createGroupCriteria(field: string): GroupCriteria {
    return { field };
  }
}
