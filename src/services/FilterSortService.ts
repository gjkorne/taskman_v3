import { IFilterSortService, FilterCriteria, SortCriteria, GroupCriteria } from "./interfaces/IFilterSortService";
import { Task } from "../types/task";
import { formatDistanceToNow, isAfter, isBefore, isToday, isTomorrow, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { get, set } from 'idb-keyval';

/**
 * Implementation of the Filter and Sort Service
 */
export class FilterSortService implements IFilterSortService {
  
  // ======== FILTERING METHODS ========
  
  /**
   * Apply filters to a list of items
   */
  applyFilters<T>(items: T[], filters: FilterCriteria[]): T[] {
    if (!filters || filters.length === 0) {
      return items;
    }
    
    return items.filter(item => {
      return filters.every(filter => this.evaluateFilterCriteria(item, filter));
    });
  }
  
  /**
   * Evaluate a single filter criterion against an item
   */
  private evaluateFilterCriteria<T>(item: T, filter: FilterCriteria): boolean {
    const { field, operator, value } = filter;
    
    // Handle nested fields like "category.name"
    const fieldValue = field.includes('.')
      ? field.split('.').reduce((obj, key) => obj && obj[key], item as any)
      : (item as any)[field];
    
    switch (operator) {
      case 'eq':
        return fieldValue === value;
      case 'neq':
        return fieldValue !== value;
      case 'gt':
        return fieldValue > value;
      case 'lt':
        return fieldValue < value;
      case 'gte':
        return fieldValue >= value;
      case 'lte':
        return fieldValue <= value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
      case 'startsWith':
        return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
      case 'endsWith':
        return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'between':
        return Array.isArray(value) && value.length === 2 && 
          fieldValue >= value[0] && fieldValue <= value[1];
      default:
        return false;
    }
  }
  
  /**
   * Create filter criteria from a preset name
   */
  createPresetFilter(presetName: string): FilterCriteria[] {
    switch (presetName) {
      case 'work':
        return [{ field: 'category_name', operator: 'eq', value: 'Work' }];
      case 'personal':
        return [{ field: 'category_name', operator: 'eq', value: 'Personal' }];
      case 'childcare':
        return [{ field: 'category_name', operator: 'eq', value: 'Childcare' }];
      case 'other':
        return [{ 
          field: 'category_name', 
          operator: 'in', 
          value: ['Work', 'Personal', 'Childcare'],
          logic: 'OR'
        }];
      case 'completed':
        return [{ field: 'status', operator: 'eq', value: 'completed' }];
      case 'high-priority':
        return [{ field: 'priority', operator: 'eq', value: 'high' }];
      case 'due-today':
        return [{ 
          field: 'due_date', 
          operator: 'between', 
          value: [new Date(new Date().setHours(0,0,0,0)), new Date(new Date().setHours(23,59,59,999))]
        }];
      case 'overdue':
        return [{ 
          field: 'due_date', 
          operator: 'lt', 
          value: new Date(new Date().setHours(0,0,0,0))
        }];
      default:
        return [];
    }
  }
  
  // ======== SORTING METHODS ========
  
  /**
   * Apply sorting to a list of items
   */
  applySorting<T>(items: T[], sort: SortCriteria[]): T[] {
    if (!sort || sort.length === 0) {
      return items;
    }
    
    return [...items].sort(this.getSortingFunction(sort));
  }
  
  /**
   * Get a sorting function based on criteria
   */
  getSortingFunction(criteria: SortCriteria[]): (a: any, b: any) => number {
    return (a, b) => {
      for (const sort of criteria) {
        const { field, direction } = sort;
        
        // Handle nested fields
        const aValue = field.includes('.')
          ? field.split('.').reduce((obj, key) => obj && obj[key], a)
          : a[field];
        
        const bValue = field.includes('.')
          ? field.split('.').reduce((obj, key) => obj && obj[key], b)
          : b[field];
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) continue;
        if (aValue == null) return direction === 'asc' ? -1 : 1;
        if (bValue == null) return direction === 'asc' ? 1 : -1;
        
        // Compare dates
        if (aValue instanceof Date && bValue instanceof Date) {
          const comparison = aValue.getTime() - bValue.getTime();
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        } 
        // Compare strings
        else if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        } 
        // Compare numbers
        else if (typeof aValue === 'number' && typeof bValue === 'number') {
          const comparison = aValue - bValue;
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        }
        // Compare booleans
        else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          const comparison = aValue === bValue ? 0 : (aValue ? 1 : -1);
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        }
      }
      
      return 0; // If all criteria result in equality
    };
  }
  
  // ======== GROUPING METHODS ========
  
  /**
   * Group items by a specified criteria
   */
  groupItems<T>(items: T[], grouping: GroupCriteria): Record<string, T[]> {
    const groupFn = this.getGroupingFunction(grouping);
    const result: Record<string, T[]> = {};
    
    items.forEach(item => {
      const groupKey = groupFn(item);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
    });
    
    return result;
  }
  
  /**
   * Get a grouping function based on criteria
   */
  getGroupingFunction(criteria: GroupCriteria): (item: any) => string {
    return (item: any) => {
      const { field, formatter } = criteria;
      
      // Handle nested fields
      const value = field.includes('.')
        ? field.split('.').reduce((obj, key) => obj && obj[key], item)
        : item[field];
      
      // Use custom formatter if provided
      if (formatter && typeof formatter === 'function') {
        return formatter(value);
      }
      
      // Default formatters based on value type
      if (value instanceof Date) {
        return formatDistanceToNow(value, { addSuffix: true });
      }
      
      // If value is null/undefined, return "Unspecified"
      if (value == null) {
        return 'Unspecified';
      }
      
      return String(value);
    };
  }
  
  // ======== STORAGE METHODS ========
  
  /**
   * Save user filter preferences to IndexedDB
   */
  async saveUserFilters(userId: string, filters: FilterCriteria[]): Promise<void> {
    const key = `user_filters_${userId}`;
    await set(key, JSON.stringify(filters));
  }
  
  /**
   * Retrieve user filter preferences from IndexedDB
   */
  async getUserFilters(userId: string): Promise<FilterCriteria[]> {
    const key = `user_filters_${userId}`;
    try {
      const filtersJson = await get(key);
      return filtersJson ? JSON.parse(filtersJson) : [];
    } catch (error) {
      console.error('Error retrieving user filters:', error);
      return [];
    }
  }
  
  // ======== TASK-SPECIFIC METHODS ========
  
  /**
   * Filter and sort tasks (combined operation for efficiency)
   */
  filterAndSortTasks(tasks: Task[], filters: FilterCriteria[], sort: SortCriteria): Task[] {
    const filtered = this.applyFilters(tasks, filters);
    return this.applySorting(filtered, [sort]);
  }
  
  /**
   * Group tasks by specified field
   */
  groupTasks(tasks: Task[], groupBy: GroupCriteria): Record<string, Task[]> {
    // Define default formatters for common task groupings
    let groupCriteria = { ...groupBy };
    
    // Default formatters for common grouping fields
    if (groupBy.field === 'status' && !groupBy.formatter) {
      groupCriteria.formatter = (status: string) => {
        const statusMap: Record<string, string> = {
          'todo': 'To Do',
          'in_progress': 'In Progress',
          'review': 'In Review',
          'completed': 'Completed',
        };
        return statusMap[status] || status;
      };
    }
    
    if (groupBy.field === 'priority' && !groupBy.formatter) {
      groupCriteria.formatter = (priority: string) => {
        const priorityMap: Record<string, string> = {
          'low': 'Low Priority',
          'medium': 'Medium Priority',
          'high': 'High Priority',
        };
        return priorityMap[priority] || priority;
      };
    }
    
    if (groupBy.field === 'due_date' && !groupBy.formatter) {
      groupCriteria.formatter = (dueDate: string | null) => {
        if (!dueDate) return 'No Due Date';
        
        const date = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const thisWeekStart = startOfWeek(today);
        const thisWeekEnd = endOfWeek(today);
        const nextWeekStart = addWeeks(thisWeekStart, 1);
        const nextWeekEnd = addWeeks(thisWeekEnd, 1);
        
        if (isToday(date)) return 'Today';
        if (isTomorrow(date)) return 'Tomorrow';
        if (isBefore(date, today)) return 'Overdue';
        if (isAfter(date, thisWeekStart) && isBefore(date, thisWeekEnd)) return 'This Week';
        if (isAfter(date, nextWeekStart) && isBefore(date, nextWeekEnd)) return 'Next Week';
        
        // Default to month name for dates further out
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      };
      
      // Define a custom sorter for due dates
      groupCriteria.sorter = (a: string, b: string) => {
        const order = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Next Week'];
        
        const aIndex = order.indexOf(a);
        const bIndex = order.indexOf(b);
        
        // If both are in our ordered list
        if (aIndex >= 0 && bIndex >= 0) {
          return aIndex - bIndex;
        }
        
        // If only one is in the list, it comes first
        if (aIndex >= 0) return -1;
        if (bIndex >= 0) return 1;
        
        // Otherwise, alphabetical
        return a.localeCompare(b);
      };
    }
    
    return this.groupItems(tasks, groupCriteria);
  }
}
