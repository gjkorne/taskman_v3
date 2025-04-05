# TaskMan Testing Infrastructure

This document describes the testing setup for the TaskMan application, focusing on the modular architecture and ensuring components remain independently testable.

## Testing Philosophy

The testing strategy aligns with our architectural goals:

1. **Modularity**: Each component, service, and context is tested in isolation
2. **Scalability**: Tests are organized to make adding new tests easy as features grow
3. **Future-proofing**: The test infrastructure supports all planned features

## Test Types

### Unit Tests

Unit tests verify that individual functions and methods work correctly in isolation:
- Service methods (e.g., `FilterSortService.applyFilters`)
- Utility functions (e.g., filter and sorting logic)
- Custom hooks (when isolated)

### Integration Tests

Integration tests verify that components work together correctly:
- Context providers and their consumers
- Service collaborations
- Hook integrations with components

### Component Tests

Component tests verify that UI components render and behave correctly:
- Rendering the correct UI elements
- Responding to user interactions
- Integrating properly with contexts

### End-to-End Tests

E2E tests verify that the entire application works correctly from a user's perspective:
- User flows (filtering, sorting, task creation)
- Full application integration
- Browser interaction via Puppeteer

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage reports
npm run test:coverage

# Run end-to-end tests with Puppeteer
npm run test:e2e
```

## Test Organization

Tests are organized to mirror the application structure:

```
src/
├── components/
│   └── ComponentName/
│       └── __tests__/
│           └── ComponentName.test.tsx
├── contexts/
│   └── contextName/
│       └── __tests__/
│           └── ContextName.test.tsx
├── services/
│   └── __tests__/
│       └── ServiceName.test.ts
├── test-utils/
│   ├── test-utils.tsx     # Testing utilities and custom render functions
│   └── mock-factory.ts    # Factory for creating test data
└── ...
e2e/
├── featureName.test.js    # End-to-end tests for specific features
└── setup.js               # E2E test setup
```

## Mock Strategy

- **Services**: Service implementations are mocked in tests to isolate components
- **External dependencies**: API calls, localStorage, etc. are mocked
- **Contexts**: Context values are mocked when testing components in isolation

## Test Data

Use the `MockFactory` class in `src/test-utils/mock-factory.ts` to create consistent test data across all tests:

```typescript
import { MockFactory } from '../../test-utils/mock-factory';

// Create a single task
const task = MockFactory.createTask({ priority: 'high' });

// Create multiple tasks
const tasks = MockFactory.createTaskList(3, [
  { priority: 'high' },
  { priority: 'medium' },
  { priority: 'low' }
]);

// Create filter criteria
const filters = MockFactory.createFilterPreset('high-priority');
```

## Best Practices

1. **Test independence**: Each test should run independently of others
2. **Meaningful assertions**: Test the behavior, not the implementation
3. **Test edge cases**: Consider empty states, error conditions, etc.
4. **Keep tests focused**: Each test should verify one specific behavior
5. **Use descriptive names**: Test names should describe what is being tested

## CI/CD Integration

Tests are automatically run on GitHub Actions:
- On every push to main
- On every pull request
- Coverage reports are uploaded to Codecov
