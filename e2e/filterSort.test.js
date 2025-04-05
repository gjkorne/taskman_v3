// End-to-end tests for filtering and sorting functionality
// These tests validate that the complete filtering and sorting system works in a browser

const { chromium } = require('playwright');

// Configure test timeouts and viewport
jest.setTimeout(30000);
const viewportSize = { width: 1280, height: 720 };

describe('Filtering and Sorting E2E Tests', () => {
  let browser, page;
  
  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true, // Set to false to see the browser in action
      slowMo: 100 // Slow down operations by 100ms for easier visual debugging
    });
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewportSize(viewportSize);
    
    // Navigate to the application
    await page.goto('http://localhost:5173');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="task-list"]');
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  test('search functionality filters tasks correctly', async () => {
    // Enter a search term
    await page.fill('[data-testid="search-input"]', 'project');
    
    // Wait for filtered results
    await page.waitForTimeout(500); // Allow time for filtering to apply
    
    // Check that only tasks containing "project" are visible
    const visibleTasks = await page.$$eval('[data-testid="task-item"]', 
      tasks => tasks.map(task => task.textContent)
    );
    
    // Verify each visible task contains the search term
    for (const taskText of visibleTasks) {
      expect(taskText.toLowerCase()).toContain('project');
    }
  });
  
  test('priority filter button works correctly', async () => {
    // Click high priority filter
    await page.click('[data-testid="priority-filter-high"]');
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    // Check that only high priority tasks are visible
    const priorityBadges = await page.$$eval('[data-testid="priority-badge"]', 
      badges => badges.map(badge => badge.textContent)
    );
    
    // Verify each visible task has high priority
    for (const badge of priorityBadges) {
      expect(badge.toLowerCase()).toContain('high');
    }
  });
  
  test('sort dropdown changes task order', async () => {
    // Open sort dropdown
    await page.click('[data-testid="sort-dropdown"]');
    
    // Select "Due Date" option
    await page.click('[data-testid="sort-option-due_date"]');
    
    // Wait for sorting to apply
    await page.waitForTimeout(500);
    
    // Get dates from sorted tasks
    const dueDates = await page.$$eval('[data-testid="due-date"]', 
      dates => dates.map(date => new Date(date.textContent))
    );
    
    // Verify dates are in ascending order
    for (let i = 0; i < dueDates.length - 1; i++) {
      expect(dueDates[i] <= dueDates[i + 1]).toBe(true);
    }
  });
  
  test('group by category organizes tasks correctly', async () => {
    // Open group dropdown
    await page.click('[data-testid="group-dropdown"]');
    
    // Select "Category" option
    await page.click('[data-testid="group-option-category_name"]');
    
    // Wait for grouping to apply
    await page.waitForTimeout(500);
    
    // Check that category group headers exist
    const groupHeaders = await page.$$eval('[data-testid="group-header"]', 
      headers => headers.map(header => header.textContent)
    );
    
    // Verify we have at least one group header
    expect(groupHeaders.length).toBeGreaterThan(0);
    
    // Verify tasks under each group match the group's category
    const groups = await page.$$('[data-testid="task-group"]');
    
    for (const group of groups) {
      const headerText = await group.$eval('[data-testid="group-header"]', el => el.textContent);
      const categoryName = headerText.trim();
      
      const taskCategories = await group.$$eval('[data-testid="task-category"]', 
        categories => categories.map(category => category.textContent)
      );
      
      for (const category of taskCategories) {
        expect(category).toBe(categoryName);
      }
    }
  });
  
  test('clear filters button resets all filters', async () => {
    // Apply a filter
    await page.click('[data-testid="priority-filter-high"]');
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    // Get count of filtered tasks
    const filteredCount = await page.$$eval('[data-testid="task-item"]', tasks => tasks.length);
    
    // Clear filters
    await page.click('[data-testid="clear-filters"]');
    
    // Wait for filters to clear
    await page.waitForTimeout(500);
    
    // Get count of all tasks
    const allTasksCount = await page.$$eval('[data-testid="task-item"]', tasks => tasks.length);
    
    // Verify more tasks are visible after clearing filters
    expect(allTasksCount).toBeGreaterThan(filteredCount);
  });
});
