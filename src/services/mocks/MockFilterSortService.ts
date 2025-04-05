import { Task } from '../../types/task';
import { 
  FilterCriteria, 
  SortCriteria, 
  GroupCriteria, 
  IFilterSortService 
} from '../interfaces/IFilterSortService';

/**
 * Mock implementation of the FilterSortService for testing purposes
 * This mock can be used in tests to isolate components from the actual service implementation
 */
export class MockFilterSortService implements IFilterSortService {
  // Track method calls for assertions in tests
  methodCalls: Record<string, any[]> = {
    applyFilters: [],
    createPresetFilter: [],
    applySorting: [],
    getSortingFunction: [],
    groupItems: [],
    getGroupingFunction: [],
    saveUserFilters: [],
    getUserFilters: [],
    filterAndSortTasks: [],
    groupTasks: []
  };

  // Store mock return values
  mockReturnValues: Record<string, any> = {};

  // Filtering methods
  applyFilters<T>(items: T[], filters: FilterCriteria[]): T[] {
    this.methodCalls.applyFilters.push({ items, filters });
    
    if (this.mockReturnValues.applyFilters) {
      return this.mockReturnValues.applyFilters;
    }
    
    // Default implementation if no mock value provided
    if (!filters || filters.length === 0) return items;
    
    return items.filter(item => {
      return filters.every(filter => {
        const { field, operator, value } = filter;
        
        try {
          // Type-safe property access using an indexable type assertion
          const itemValue = (item as unknown as Record<string, any>)[field];
          
          // Simple implementation for common operators
          switch (operator) {
            case 'eq':
              return itemValue === value;
            case 'contains':
              return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
            case 'in':
              return Array.isArray(value) && value.includes(itemValue);
            default:
              return true;
          }
        } catch {
          // Fallback for type-safety: if field doesn't exist or can't be accessed, treat as non-matching
          return false;
        }
      });
    });
  }

  createPresetFilter(presetName: string): FilterCriteria[] {
    this.methodCalls.createPresetFilter.push({ presetName });
    
    if (this.mockReturnValues.createPresetFilter) {
      return this.mockReturnValues.createPresetFilter;
    }
    
    // Default mock presets
    switch (presetName) {
      case 'highPriority':
        return [{ field: 'priority', operator: 'eq', value: 'high' }];
      case 'dueToday':
        const today = new Date().toISOString().split('T')[0];
        return [{ field: 'due_date', operator: 'eq', value: today }];
      default:
        return [];
    }
  }

  // Sorting methods
  applySorting<T>(items: T[], sort: SortCriteria[]): T[] {
    this.methodCalls.applySorting.push({ items, sort });
    
    if (this.mockReturnValues.applySorting) {
      return this.mockReturnValues.applySorting;
    }
    
    // Default implementation for simple sorting
    if (!sort || sort.length === 0) return items;
    
    const sortFn = this.getSortingFunction(sort);
    return [...items].sort(sortFn);
  }

  getSortingFunction(criteria: SortCriteria[]): (a: any, b: any) => number {
    this.methodCalls.getSortingFunction.push({ criteria });
    
    if (this.mockReturnValues.getSortingFunction) {
      return this.mockReturnValues.getSortingFunction;
    }
    
    // Default sorting implementation
    return (a, b) => {
      for (const sort of criteria) {
        const { field, direction } = sort;
        const aValue = (a as unknown as Record<string, any>)[field];
        const bValue = (b as unknown as Record<string, any>)[field];
        
        // Handle different value types
        if (aValue === bValue) continue;
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return direction === 'asc' ? comparison : -comparison;
        }
        
        if (direction === 'asc') {
          return aValue < bValue ? -1 : 1;
        } else {
          return aValue > bValue ? -1 : 1;
        }
      }
      
      return 0;
    };
  }

  // Grouping methods
  groupItems<T>(items: T[], grouping: GroupCriteria): Record<string, T[]> {
    this.methodCalls.groupItems.push({ items, grouping });
    
    if (this.mockReturnValues.groupItems) {
      return this.mockReturnValues.groupItems;
    }
    
    // Default grouping implementation
    const groupFn = this.getGroupingFunction(grouping);
    
    return items.reduce((groups, item) => {
      const key = groupFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  getGroupingFunction(criteria: GroupCriteria): (item: any) => string {
    this.methodCalls.getGroupingFunction.push({ criteria });
    
    if (this.mockReturnValues.getGroupingFunction) {
      return this.mockReturnValues.getGroupingFunction;
    }
    
    // Default grouping function
    return (item) => {
      const value = (item as unknown as Record<string, any>)[criteria.field];
      if (criteria.formatter) {
        return criteria.formatter(value);
      }
      return String(value || 'undefined');
    };
  }

  // Storage methods
  async saveUserFilters(userId: string, filters: FilterCriteria[]): Promise<void> {
    this.methodCalls.saveUserFilters.push({ userId, filters });
    
    if (this.mockReturnValues.saveUserFilters instanceof Error) {
      throw this.mockReturnValues.saveUserFilters;
    }
    
    // Default just resolves with no action for mock
    return Promise.resolve();
  }

  async getUserFilters(userId: string): Promise<FilterCriteria[]> {
    this.methodCalls.getUserFilters.push({ userId });
    
    if (this.mockReturnValues.getUserFilters instanceof Error) {
      throw this.mockReturnValues.getUserFilters;
    }
    
    if (this.mockReturnValues.getUserFilters) {
      return this.mockReturnValues.getUserFilters;
    }
    
    // Default returns empty filters
    return Promise.resolve([]);
  }

  // Task-specific methods
  filterAndSortTasks(tasks: Task[], filters: FilterCriteria[], sort: SortCriteria): Task[] {
    this.methodCalls.filterAndSortTasks.push({ tasks, filters, sort });
    
    if (this.mockReturnValues.filterAndSortTasks) {
      return this.mockReturnValues.filterAndSortTasks;
    }
    
    // Default implementation combines filtering and sorting
    const filteredTasks = this.applyFilters(tasks, filters);
    return this.applySorting(filteredTasks, [sort]);
  }

  groupTasks(tasks: Task[], groupBy: GroupCriteria): Record<string, Task[]> {
    this.methodCalls.groupTasks.push({ tasks, groupBy });
    
    if (this.mockReturnValues.groupTasks) {
      return this.mockReturnValues.groupTasks;
    }
    
    // Default implementation uses the general grouping method
    return this.groupItems(tasks, groupBy);
  }

  // Helper methods for testing
  mockMethod(methodName: string, returnValue: any) {
    this.mockReturnValues[methodName] = returnValue;
    return this;
  }

  resetMocks() {
    Object.keys(this.methodCalls).forEach(key => {
      this.methodCalls[key] = [];
    });
    this.mockReturnValues = {};
  }
}
