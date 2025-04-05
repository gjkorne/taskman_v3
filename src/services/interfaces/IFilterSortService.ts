import { Task } from '../../types/task';

/**
 * Filter operator types
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'between';

/**
 * Filter criteria for a single field
 */
export interface FilterCriteria {
  field: string;
  operator: FilterOperator;
  value: any;
  logic?: 'AND' | 'OR';
}

/**
 * Sort criteria
 */
export interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Group criteria
 */
export interface GroupCriteria {
  field: string;
  formatter?: (value: any) => string;
  sorter?: (a: any, b: any) => number;
}

/**
 * Filter and sort service interface
 */
export interface IFilterSortService {
  // Filtering methods
  applyFilters<T>(items: T[], filters: FilterCriteria[]): T[];
  createPresetFilter(presetName: string): FilterCriteria[];
  
  // Sorting methods
  applySorting<T>(items: T[], sort: SortCriteria[]): T[];
  getSortingFunction(criteria: SortCriteria[]): (a: any, b: any) => number;
  
  // Grouping methods
  groupItems<T>(items: T[], grouping: GroupCriteria): Record<string, T[]>;
  getGroupingFunction(criteria: GroupCriteria): (item: any) => string;
  
  // Storage methods
  saveUserFilters(userId: string, filters: FilterCriteria[]): Promise<void>;
  getUserFilters(userId: string): Promise<FilterCriteria[]>;
  
  // Task-specific methods
  filterAndSortTasks(tasks: Task[], filters: FilterCriteria[], sort: SortCriteria): Task[];
  groupTasks(tasks: Task[], groupBy: GroupCriteria): Record<string, Task[]>;
}
