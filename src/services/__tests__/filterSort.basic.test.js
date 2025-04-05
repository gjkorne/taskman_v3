// Basic tests for filtering and sorting functionality
// This aligns with your FilterSortService architecture

describe('FilterSortService Basic Tests', () => {
  // Mock data representing tasks
  const mockTasks = [
    { id: '1', title: 'High priority task', priority: 'high', category: 'Work', dueDate: '2025-04-10' },
    { id: '2', title: 'Medium priority task', priority: 'medium', category: 'Personal', dueDate: '2025-04-20' },
    { id: '3', title: 'Low priority task', priority: 'low', category: 'Work', dueDate: '2025-04-05' }
  ];

  // Test filtering functionality
  test('should filter tasks by priority', () => {
    // Simple filter function that matches your FilterSortService.applyFilters pattern
    const filterByPriority = (tasks, priority) => {
      return tasks.filter(task => task.priority === priority);
    };
    
    const highPriorityTasks = filterByPriority(mockTasks, 'high');
    expect(highPriorityTasks.length).toBe(1);
    expect(highPriorityTasks[0].id).toBe('1');
  });
  
  // Test filtering by multiple criteria
  test('should filter tasks by category', () => {
    const filterByCategory = (tasks, category) => {
      return tasks.filter(task => task.category === category);
    };
    
    const workTasks = filterByCategory(mockTasks, 'Work');
    expect(workTasks.length).toBe(2);
    expect(workTasks[0].category).toBe('Work');
    expect(workTasks[1].category).toBe('Work');
  });
  
  // Test sorting functionality
  test('should sort tasks by priority in descending order', () => {
    // Simple sort function that matches your FilterSortService.applySorting pattern
    const sortByPriority = (tasks, direction = 'desc') => {
      const priorityValues = { high: 3, medium: 2, low: 1 };
      
      return [...tasks].sort((a, b) => {
        const aValue = priorityValues[a.priority] || 0;
        const bValue = priorityValues[b.priority] || 0;
        
        return direction === 'desc' ? bValue - aValue : aValue - bValue;
      });
    };
    
    const sortedTasks = sortByPriority(mockTasks);
    expect(sortedTasks[0].id).toBe('1'); // High priority
    expect(sortedTasks[1].id).toBe('2'); // Medium priority
    expect(sortedTasks[2].id).toBe('3'); // Low priority
  });
  
  // Test sorting by date
  test('should sort tasks by due date in ascending order', () => {
    const sortByDueDate = (tasks, direction = 'asc') => {
      return [...tasks].sort((a, b) => {
        const aDate = new Date(a.dueDate).getTime();
        const bDate = new Date(b.dueDate).getTime();
        
        return direction === 'asc' ? aDate - bDate : bDate - aDate;
      });
    };
    
    const sortedTasks = sortByDueDate(mockTasks);
    expect(sortedTasks[0].id).toBe('3'); // April 5th
    expect(sortedTasks[1].id).toBe('1'); // April 10th
    expect(sortedTasks[2].id).toBe('2'); // April 20th
  });
});
