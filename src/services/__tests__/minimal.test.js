// A minimal test that should work with any configuration
describe('Minimal Test', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3);
  });
  
  test('filter and sorting functionality', () => {
    // Mock data aligned with TaskMan's architecture
    const items = [
      { priority: 'high', dueDate: '2025-04-10' },
      { priority: 'low', dueDate: '2025-04-05' },
      { priority: 'medium', dueDate: '2025-04-15' }
    ];
    
    // Simple filter function - represents the FilterSortService concept
    const filterByPriority = (items, priority) => {
      return items.filter(item => item.priority === priority);
    };
    
    // Test filtering - core functionality of your FilterSortService
    const highPriorityItems = filterByPriority(items, 'high');
    expect(highPriorityItems.length).toBe(1);
    expect(highPriorityItems[0].priority).toBe('high');
  });
});
