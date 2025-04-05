// FilterSortService unit tests
// These tests validate the core functionality of your filtering/sorting system

// Mock data that resembles your Task model structure
const mockTasks = [
  { 
    id: '1', 
    title: 'Complete project proposal', 
    description: 'Finish the draft for the new client project',
    priority: 'high', 
    category_id: '1',
    category_name: 'Work',
    due_date: '2025-04-10',
    status: 'in_progress',
    assignee_id: 'user1',
    tags: ['important', 'deadline']
  },
  { 
    id: '2', 
    title: 'Buy groceries', 
    description: 'Get items for dinner party',
    priority: 'medium', 
    category_id: '2',
    category_name: 'Personal',
    due_date: '2025-04-05',
    status: 'not_started',
    assignee_id: 'user1',
    tags: ['shopping']
  },
  { 
    id: '3', 
    title: 'Schedule team meeting', 
    description: 'Coordinate with team for weekly sync',
    priority: 'low', 
    category_id: '1',
    category_name: 'Work',
    due_date: '2025-04-15',
    status: 'not_started',
    assignee_id: 'user2',
    tags: ['planning']
  },
  { 
    id: '4', 
    title: 'Review code PR', 
    description: 'Review pull request for new feature',
    priority: 'high', 
    category_id: '1',
    category_name: 'Work',
    due_date: '2025-04-01',
    status: 'completed',
    assignee_id: 'user1',
    tags: ['code', 'review']
  }
];

// Implementation of core filtering logic that mimics FilterSortService behavior
const applyFilters = (tasks, filters) => {
  if (!filters || filters.length === 0) return tasks;
  
  return tasks.filter(task => {
    return filters.every(filter => {
      const { field, operator, value } = filter;
      
      if (operator === 'eq') {
        return task[field] === value;
      }
      
      if (operator === 'contains' && typeof task[field] === 'string') {
        return task[field].toLowerCase().includes(value.toLowerCase());
      }
      
      if (operator === 'in' && Array.isArray(value)) {
        if (Array.isArray(task[field])) {
          // For array fields like tags, check if any value matches
          return task[field].some(item => value.includes(item));
        }
        return value.includes(task[field]);
      }
      
      if (operator === 'gt' && field === 'due_date') {
        const taskDate = new Date(task[field]);
        const compareDate = new Date(value);
        return taskDate > compareDate;
      }
      
      if (operator === 'lt' && field === 'due_date') {
        const taskDate = new Date(task[field]);
        const compareDate = new Date(value);
        return taskDate < compareDate;
      }
      
      return true;
    });
  });
};

// Implementation of core sorting logic that mimics FilterSortService behavior
const applySorting = (tasks, sortCriteria) => {
  if (!sortCriteria || !sortCriteria.field) return tasks;
  
  const { field, direction = 'asc' } = sortCriteria;
  
  return [...tasks].sort((a, b) => {
    // Special case for priority field
    if (field === 'priority') {
      const priorityValues = { high: 3, medium: 2, low: 1 };
      const aValue = priorityValues[a[field]] || 0;
      const bValue = priorityValues[b[field]] || 0;
      
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Special case for dates
    if (field === 'due_date') {
      const aDate = a[field] ? new Date(a[field]).getTime() : 0;
      const bDate = b[field] ? new Date(b[field]).getTime() : 0;
      
      return direction === 'asc' ? aDate - bDate : bDate - aDate;
    }
    
    // Default case for strings and other values
    const aValue = a[field];
    const bValue = b[field];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return direction === 'asc' 
      ? (aValue > bValue ? 1 : -1)
      : (bValue > aValue ? 1 : -1);
  });
};

// Implementation of core grouping logic that mimics FilterSortService behavior
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

// Unit tests for FilterSortService functionality
describe('FilterSortService', () => {
  // Filter tests
  describe('applyFilters', () => {
    test('should return all tasks when no filters are applied', () => {
      const result = applyFilters(mockTasks, []);
      expect(result.length).toBe(4);
    });
    
    test('should filter tasks by priority', () => {
      const filters = [
        { field: 'priority', operator: 'eq', value: 'high' }
      ];
      
      const result = applyFilters(mockTasks, filters);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('4');
    });
    
    test('should filter tasks by category', () => {
      const filters = [
        { field: 'category_name', operator: 'eq', value: 'Work' }
      ];
      
      const result = applyFilters(mockTasks, filters);
      expect(result.length).toBe(3);
      expect(result.every(task => task.category_name === 'Work')).toBe(true);
    });
    
    test('should filter tasks by multiple criteria (AND logic)', () => {
      const filters = [
        { field: 'priority', operator: 'eq', value: 'high' },
        { field: 'status', operator: 'eq', value: 'in_progress' }
      ];
      
      const result = applyFilters(mockTasks, filters);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });
    
    test('should filter tasks by title containing text', () => {
      const filters = [
        { field: 'title', operator: 'contains', value: 'project' }
      ];
      
      const result = applyFilters(mockTasks, filters);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });
    
    test('should filter tasks by tag', () => {
      const filters = [
        { field: 'tags', operator: 'in', value: ['important'] }
      ];
      
      const result = applyFilters(mockTasks, filters);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    });
    
    test('should filter tasks by due date range', () => {
      const filters = [
        { field: 'due_date', operator: 'gt', value: '2025-04-05' }
      ];
      
      const result = applyFilters(mockTasks, filters);
      expect(result.length).toBe(2);
      // Tasks with dates after April 5
      expect(result.some(task => task.id === '1')).toBe(true);
      expect(result.some(task => task.id === '3')).toBe(true);
    });
  });
  
  // Sort tests
  describe('applySorting', () => {
    test('should sort tasks by priority in ascending order', () => {
      const sortCriteria = {
        field: 'priority',
        direction: 'asc'
      };
      
      const result = applySorting(mockTasks, sortCriteria);
      expect(result[0].priority).toBe('low');
      expect(result[1].priority).toBe('medium');
      expect(result[2].priority).toBe('high');
    });
    
    test('should sort tasks by priority in descending order', () => {
      const sortCriteria = {
        field: 'priority',
        direction: 'desc'
      };
      
      const result = applySorting(mockTasks, sortCriteria);
      expect(result[0].priority).toBe('high');
      expect(result[1].priority).toBe('high');
      expect(result[2].priority).toBe('medium');
      expect(result[3].priority).toBe('low');
    });
    
    test('should sort tasks by due date in ascending order', () => {
      const sortCriteria = {
        field: 'due_date',
        direction: 'asc'
      };
      
      const result = applySorting(mockTasks, sortCriteria);
      expect(result[0].id).toBe('4'); // April 1
      expect(result[1].id).toBe('2'); // April 5
      expect(result[2].id).toBe('1'); // April 10
      expect(result[3].id).toBe('3'); // April 15
    });
    
    test('should sort tasks by title alphabetically', () => {
      const sortCriteria = {
        field: 'title',
        direction: 'asc'
      };
      
      const result = applySorting(mockTasks, sortCriteria);
      expect(result[0].title).toBe('Buy groceries');
      expect(result[3].title).toBe('Schedule team meeting');
    });
  });
  
  // Group tests
  describe('applyGrouping', () => {
    test('should group tasks by category', () => {
      const groupCriteria = {
        field: 'category_name'
      };
      
      const result = applyGrouping(mockTasks, groupCriteria);
      expect(Object.keys(result).length).toBe(2);
      expect(result['Work'].length).toBe(3);
      expect(result['Personal'].length).toBe(1);
    });
    
    test('should group tasks by priority', () => {
      const groupCriteria = {
        field: 'priority'
      };
      
      const result = applyGrouping(mockTasks, groupCriteria);
      expect(Object.keys(result).length).toBe(3);
      expect(result['high'].length).toBe(2);
      expect(result['medium'].length).toBe(1);
      expect(result['low'].length).toBe(1);
    });
    
    test('should group tasks by status', () => {
      const groupCriteria = {
        field: 'status'
      };
      
      const result = applyGrouping(mockTasks, groupCriteria);
      expect(Object.keys(result).length).toBe(3);
      expect(result['in_progress'].length).toBe(1);
      expect(result['not_started'].length).toBe(2);
      expect(result['completed'].length).toBe(1);
    });
    
    test('should group tasks by assignee_id', () => {
      const groupCriteria = {
        field: 'assignee_id'
      };
      
      const result = applyGrouping(mockTasks, groupCriteria);
      expect(Object.keys(result).length).toBe(2);
      expect(result['user1'].length).toBe(3);
      expect(result['user2'].length).toBe(1);
    });
    
    test('should return all tasks in default group when no grouping criteria is provided', () => {
      const result = applyGrouping(mockTasks, null);
      expect(Object.keys(result).length).toBe(1);
      expect(result['default'].length).toBe(4);
    });
  });
  
  // Combined operations tests
  describe('combined operations', () => {
    test('should filter and sort tasks', () => {
      // First filter to get only Work tasks
      const filters = [
        { field: 'category_name', operator: 'eq', value: 'Work' }
      ];
      
      const filteredTasks = applyFilters(mockTasks, filters);
      expect(filteredTasks.length).toBe(3);
      
      // Then sort by due_date
      const sortCriteria = {
        field: 'due_date',
        direction: 'asc'
      };
      
      const result = applySorting(filteredTasks, sortCriteria);
      expect(result.length).toBe(3);
      expect(result[0].id).toBe('4'); // April 1
      expect(result[1].id).toBe('1'); // April 10
      expect(result[2].id).toBe('3'); // April 15
    });
    
    test('should filter, sort, and group tasks', () => {
      // Filter for not completed tasks
      const filters = [
        { field: 'status', operator: 'in', value: ['in_progress', 'not_started'] }
      ];
      
      const filteredTasks = applyFilters(mockTasks, filters);
      expect(filteredTasks.length).toBe(3);
      
      // Sort by priority
      const sortCriteria = {
        field: 'priority',
        direction: 'desc'
      };
      
      const sortedTasks = applySorting(filteredTasks, sortCriteria);
      
      // Group by category
      const groupCriteria = {
        field: 'category_name'
      };
      
      const result = applyGrouping(sortedTasks, groupCriteria);
      expect(Object.keys(result).length).toBe(2);
      
      // Work category should have 2 tasks
      expect(result['Work'].length).toBe(2);
      // First task in Work should be high priority
      expect(result['Work'][0].priority).toBe('high');
      
      // Personal category should have 1 task
      expect(result['Personal'].length).toBe(1);
    });
  });
});
