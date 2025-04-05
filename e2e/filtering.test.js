describe('Task Filtering System', () => {
  // Setup before tests
  beforeAll(async () => {
    // Navigate to app
    await page.goto('http://localhost:5173');
    
    // Wait for app to load
    await page.waitForSelector('button[type="submit"]', { visible: true });
    
    // Login if needed (assumes app starts with login screen)
    if (await page.$('input[type="email"]')) {
      await page.type('input[type="email"]', 'testuser@example.com');
      await page.type('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for dashboard to load
      await page.waitForSelector('[data-testid="app-layout"]');
    }
  }, 60000);
  
  it('should filter tasks when quick filters are applied', async () => {
    // Navigate to tasks view (if not already there)
    await page.click('button:has-text("Tasks")');
    
    // Wait for tasks to load
    await page.waitForSelector('.task-item', { timeout: 10000 });
    
    // Count initial tasks
    const initialTaskCount = await page.evaluate(() => 
      document.querySelectorAll('.task-item').length
    );
    
    // Click on a filter (e.g., "High Priority")
    await page.click('button:has-text("High Priority")');
    
    // Wait for filtered results
    await page.waitForTimeout(500); // Allow time for filter to apply
    
    // Count filtered tasks
    const filteredTaskCount = await page.evaluate(() => 
      document.querySelectorAll('.task-item').length
    );
    
    // Verify filtering has occurred
    expect(filteredTaskCount).toBeLessThanOrEqual(initialTaskCount);
    
    // Verify high priority indicator is present on all visible tasks
    const highPriorityTasks = await page.evaluate(() => 
      Array.from(document.querySelectorAll('.task-item'))
        .filter(item => item.textContent.includes('High'))
        .length
    );
    
    expect(highPriorityTasks).toBe(filteredTaskCount);
  }, 30000);
  
  it('should search for tasks by text content', async () => {
    // Clear any existing filters first
    await page.click('button:has-text("Clear Filters")');
    await page.waitForTimeout(500);
    
    // Type in search box
    await page.type('input[placeholder="Search tasks..."]', 'meeting');
    await page.waitForTimeout(500); // Wait for search to apply
    
    // Verify search results contain the search term
    const searchResults = await page.evaluate(() => {
      const tasks = Array.from(document.querySelectorAll('.task-item'));
      return tasks.filter(task => 
        task.textContent.toLowerCase().includes('meeting')
      ).length;
    });
    
    const totalVisibleTasks = await page.evaluate(() => 
      document.querySelectorAll('.task-item').length
    );
    
    // All visible tasks should contain the search term
    expect(searchResults).toBe(totalVisibleTasks);
  }, 20000);
  
  it('should sort tasks when sort criteria is changed', async () => {
    // Clear any existing filters and search
    await page.click('button:has-text("Clear Filters")');
    await page.waitForTimeout(500);
    
    const searchInput = await page.$('input[placeholder="Search tasks..."]');
    await searchInput.click({ clickCount: 3 }); // Triple click to select all
    await searchInput.press('Backspace'); // Clear the input
    await page.waitForTimeout(500);
    
    // Select sort by priority
    await page.select('select', 'priority');
    await page.waitForTimeout(500);
    
    // Click to make sort descending (if needed)
    await page.click('button[title="Descending"]');
    await page.waitForTimeout(500);
    
    // Get priorities of visible tasks
    const priorities = await page.evaluate(() => {
      const priorityElements = Array.from(document.querySelectorAll('.task-item .priority-indicator'));
      return priorityElements.map(el => {
        const classNames = el.className;
        if (classNames.includes('high')) return 3;
        if (classNames.includes('medium')) return 2;
        if (classNames.includes('low')) return 1;
        return 0;
      });
    });
    
    // Check if priorities are in descending order
    const isSorted = priorities.every((priority, i) => 
      i === 0 || priority <= priorities[i-1]
    );
    
    expect(isSorted).toBe(true);
  }, 20000);
});
