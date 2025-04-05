// Simple test using ES modules
// This validates the core Jest setup while respecting your project's module format

describe('Simple tests for TaskMan testing infrastructure', () => {
  test('basic arithmetic works', () => {
    expect(1 + 2).toBe(3);
  });
  
  // A simple mock of your filtering functionality
  test('basic filtering functionality works', () => {
    const tasks = [
      { id: '1', priority: 'high' },
      { id: '2', priority: 'low' }
    ];
    
    const filtered = tasks.filter(task => task.priority === 'high');
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('1');
  });
});
