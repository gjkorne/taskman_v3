# TaskMan Testing Documentation

This document outlines the testing approach for TaskMan, explaining the testing infrastructure, conventions, and how to write effective tests.

## Testing Philosophy

TaskMan follows a comprehensive testing strategy with multiple layers:

1. **Unit Tests**: Test individual functions and services in isolation
2. **Component Tests**: Test React components with a focus on behavior, not implementation details
3. **Integration Tests**: Test how services and components work together
4. **End-to-End Tests**: Test complete user workflows in a browser environment

## Test Organization

Tests are organized to mirror the application structure:

```
src/
├── components/
│   └── ComponentName/
│       ├── ComponentName.tsx
│       └── __tests__/
│           └── ComponentName.test.js
├── contexts/
│   └── contextName/
│       ├── ContextName.tsx
│       └── __tests__/
│           └── ContextName.test.js
├── services/
│   └── __tests__/
│       └── ServiceName.test.js
test/
└── simple.test.js    # Basic tests for infrastructure validation
e2e/
└── feature.test.js   # End-to-end tests for complete user flows
```

## Running Tests

The following npm scripts are available for running tests:

- `npm run test`: Run all tests
- `npm run test:services`: Run tests for services
- `npm run test:contexts`: Run tests for contexts
- `npm run test:components`: Run tests for components
- `npm run test:basic`: Run basic infrastructure tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Generate coverage report
- `npm run test:e2e`: Run end-to-end tests

## Test Data Generation

TaskMan uses a `MockFactory` utility to generate consistent test data:

```typescript
// Generate a single task
const task = MockFactory.createTask({ 
  title: 'Custom task title',
  priority: TaskPriority.HIGH
});

// Generate multiple tasks
const tasks = MockFactory.createTasks(10);

// Generate filter criteria, sort criteria, etc.
const filterCriteria = MockFactory.createFilterCriteria('priority', 'eq', TaskPriority.HIGH);
```

## Writing Tests

### Unit Tests for Services

Services should be tested in isolation, focusing on their core functionality:

```javascript
describe('FilterSortService', () => {
  test('should filter tasks by priority', () => {
    const service = ServiceRegistry.getService('FilterSortService');
    const tasks = MockFactory.createTasks(5);
    const filters = [
      { field: 'priority', operator: 'eq', value: TaskPriority.HIGH }
    ];
    
    const result = service.applyFilters(tasks, filters);
    
    // Verify results
    expect(result.every(task => task.priority === TaskPriority.HIGH)).toBe(true);
  });
});
```

### Component Tests

Component tests focus on behavior, not implementation details:

```javascript
describe('FilterBar Component', () => {
  test('applies filters when search input changes', () => {
    render(
      <FilterSortProvider>
        <FilterBar />
      </FilterSortProvider>
    );
    
    // Simulate user interaction
    fireEvent.change(screen.getByTestId('search-input'), { 
      target: { value: 'search term' } 
    });
    
    // Verify UI updates appropriately
    expect(screen.getByTestId('search-input').value).toBe('search term');
  });
});
```

### End-to-End Tests

E2E tests validate complete user workflows:

```javascript
test('user can filter tasks by priority', async () => {
  // Open the application
  await page.goto('http://localhost:5173');
  
  // Click high priority filter button
  await page.click('[data-testid="priority-filter-high"]');
  
  // Verify only high priority tasks are visible
  const taskElements = await page.$$('[data-testid="task-item"]');
  for (const taskEl of taskElements) {
    const priorityText = await taskEl.$eval('[data-testid="priority-badge"]', 
      el => el.textContent);
    expect(priorityText).toContain('High');
  }
});
```

## Test Coverage Expectations

TaskMan aims for the following coverage targets:

- **Services**: 90%+ coverage, focusing on business logic and edge cases
- **Contexts**: 80%+ coverage, focusing on state management
- **Components**: 70%+ coverage, focusing on user interactions and rendering
- **End-to-End**: Cover all critical user workflows

## Continuous Integration

All tests are run automatically on GitHub Actions when:
- Code is pushed to the main branch
- A pull request is created or updated

PRs cannot be merged until all tests pass.

## Mocking External Dependencies

Tests should mock external dependencies like:

- API calls
- Database operations
- Browser storage

Example using Jest mocks:

```javascript
// Mock ServiceRegistry
jest.mock('../services/ServiceRegistry', () => ({
  ServiceRegistry: {
    getService: jest.fn().mockImplementation((serviceName) => {
      if (serviceName === 'FilterSortService') {
        return {
          applyFilters: jest.fn().mockReturnValue([]),
          // Mock other methods...
        };
      }
      return null;
    })
  }
}));
```

## Debugging Tests

When tests fail, use these approaches to debug:

1. Run tests in watch mode: `npm run test:watch`
2. Add `console.log` statements
3. Use VS Code debugger with the Jest extension
4. Check test coverage to find untested code paths
