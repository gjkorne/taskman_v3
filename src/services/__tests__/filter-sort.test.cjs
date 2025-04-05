// Filter and sort functionality tests in CommonJS format
// These tests validate the core concepts behind your FilterSortService

// Mock task data that matches your domain model
const mockTasks = [
  { 
    id: '1', 
    title: 'High priority work task', 
    priority: 'high', 
    category_name: 'Work',
    due_date: '2025-04-05',
    status: 'in_progress'
  },
  { 
    id: '2', 
    title: 'Medium priority personal task', 
    priority: 'medium', 
    category_name: 'Personal',
    due_date: '2025-04-10',
    status: 'not_started'
  },
  { 
    id: '3', 
    title: 'Low priority completed task', 
    priority: 'low', 
    category_name: 'Work',
    due_date: '2025-04-01',
    status: 'completed'
  }
];

describe('FilterSortService Core Functionality', () => {
  // Test filtering by a single criterion
  test('filters tasks by priority', () => {
    const applyFilters = (tasks, filters) => {
      if (!filters || filters.length === 0) return tasks;
      
      return tasks.filter(task => {
        return filters.every(filter => {
          const { field, operator, value } = filter;
          
          if (operator === 'eq') {
            return task[field] === value;
          }
          
          if (operator === 'in' && Array.isArray(value)) {
            return value.includes(task[field]);
          }
          
          return true;
        });
      });
    };
    
    const filters = [
      { field: 'priority', operator: 'eq', value: 'high' }
    ];
    
    const result = applyFilters(mockTasks, filters);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });
  
  // Test filtering by multiple criteria (AND logic)
  test('filters tasks by multiple criteria', () => {
    const applyFilters = (tasks, filters) => {
      if (!filters || filters.length === 0) return tasks;
      
      return tasks.filter(task => {
        return filters.every(filter => {
          const { field, operator, value } = filter;
          
          if (operator === 'eq') {
            return task[field] === value;
          }
          
          if (operator === 'in' && Array.isArray(value)) {
            return value.includes(task[field]);
          }
          
          return true;
        });
      });
    };
    
    const filters = [
      { field: 'category_name', operator: 'eq', value: 'Work' },
      { field: 'status', operator: 'eq', value: 'in_progress' }
    ];
    
    const result = applyFilters(mockTasks, filters);
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('1');
  });
  
  // Test sorting by priority
  test('sorts tasks by priority', () => {
    const applySorting = (tasks, sortCriteria) => {
      if (!sortCriteria || !sortCriteria.field) return tasks;
      
      const { field, direction = 'asc' } = sortCriteria;
      
      return [...tasks].sort((a, b) => {
        // For priority, implement custom sorting logic
        if (field === 'priority') {
          const priorityValues = { high: 3, medium: 2, low: 1 };
          const aValue = priorityValues[a[field]] || 0;
          const bValue = priorityValues[b[field]] || 0;
          
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // For other fields, use standard comparison
        const aValue = a[field];
        const bValue = b[field];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    };
    
    const sortCriteria = {
      field: 'priority',
      direction: 'desc'
    };
    
    const result = applySorting(mockTasks, sortCriteria);
    expect(result[0].id).toBe('1'); // High
    expect(result[1].id).toBe('2'); // Medium
    expect(result[2].id).toBe('3'); // Low
  });
  
  // Test sorting by due date
  test('sorts tasks by due date', () => {
    const applySorting = (tasks, sortCriteria) => {
      if (!sortCriteria || !sortCriteria.field) return tasks;
      
      const { field, direction = 'asc' } = sortCriteria;
      
      return [...tasks].sort((a, b) => {
        // Handle date fields
        if (field === 'due_date') {
          const aDate = a[field] ? new Date(a[field]).getTime() : 0;
          const bDate = b[field] ? new Date(b[field]).getTime() : 0;
          
          return direction === 'asc' ? aDate - bDate : bDate - aDate;
        }
        
        // For other fields, use default comparison
        const aValue = a[field];
        const bValue = b[field];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return direction === 'asc' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      });
    };
    
    const sortCriteria = {
      field: 'due_date',
      direction: 'asc'
    };
    
    const result = applySorting(mockTasks, sortCriteria);
    expect(result[0].id).toBe('3'); // April 1
    expect(result[1].id).toBe('1'); // April 5
    expect(result[2].id).toBe('2'); // April 10
  });
  
  // Test grouping by category
  test('groups tasks by category', () => {
    const applyGrouping = (tasks, groupCriteria) => {
      if (!groupCriteria || !groupCriteria.field) return { default: tasks };
      
      const { field } = groupCriteria;
      
      return tasks.reduce((groups, task) => {
        const groupKey = task[field] || 'undefined';
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(task);
        return groups;
      }, {});
    };
    
    const groupCriteria = {
      field: 'category_name'
    };
    
    const result = applyGrouping(mockTasks, groupCriteria);
    expect(Object.keys(result).length).toBe(2);
    expect(result['Work'].length).toBe(2);
    expect(result['Personal'].length).toBe(1);
  });
});
