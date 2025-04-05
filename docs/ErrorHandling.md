# Error Handling in TaskMan

This document outlines the standardized error handling approach implemented in TaskMan to ensure consistent, reliable error management across the application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Error Types and Categories](#error-types-and-categories)
3. [Using the Error Service](#using-the-error-service)
4. [Error Context in React Components](#error-context-in-react-components)
5. [Testing with MockErrorService](#testing-with-mockerrorservice)
6. [Best Practices](#best-practices)

## Architecture Overview

TaskMan's error handling is built on these key components:

1. **Error Types** - Standardized error interfaces and classes
2. **Error Service** - Central service for logging, tracking, and reporting errors
3. **Error Context** - React context for consuming the error service in components
4. **Mock Error Service** - Testing utilities for error scenarios

This architecture provides:

- **Consistency** - Uniform error handling across the application
- **Centralization** - All errors flow through a single system
- **Traceability** - Errors include context, severity, and source information
- **User Experience** - Appropriate user-facing error messages
- **Testing** - Easy mocking and verification in tests

## Error Types and Categories

### Severity Levels

```typescript
enum ErrorSeverity {
  INFO = 'info',         // Informational messages that don't indicate an error
  WARNING = 'warning',   // Potential issues that don't break functionality
  ERROR = 'error',       // Errors that impact functionality but don't crash the app
  CRITICAL = 'critical'  // Serious errors that prevent core functionality
}
```

### Error Sources

```typescript
enum ErrorSource {
  NETWORK = 'network',         // Network/API errors
  DATABASE = 'database',       // Local storage/database errors
  VALIDATION = 'validation',   // Input validation errors
  AUTHENTICATION = 'auth',     // Authentication/permission errors
  SYNC = 'sync',               // Data synchronization errors
  BUSINESS_LOGIC = 'logic',    // Business logic/rule errors
  UI = 'ui',                   // UI rendering errors
  UNKNOWN = 'unknown'          // Uncategorized errors
}
```

### Error Codes

The system uses standardized error codes in the format `ERR_[SOURCE]_[SPECIFIC_ERROR]`, such as:

- `ERR_NETWORK_OFFLINE` - Network connectivity issues
- `ERR_DB_WRITE_FAILED` - Database write operations failed
- `ERR_AUTH_UNAUTHORIZED` - Authentication/permission errors
- `ERR_VALIDATION_REQUIRED` - Input validation failures

## Using the Error Service

### Basic Usage in Services

```typescript
import { ErrorCode, ErrorSeverity, NetworkError } from '../error/ErrorTypes';
import { IErrorService } from '../interfaces/IErrorService';

export class TaskService {
  private errorService: IErrorService;
  
  constructor(errorService: IErrorService) {
    this.errorService = errorService;
  }
  
  async fetchTasks() {
    try {
      // API call logic
      const response = await fetch('/api/tasks');
      
      if (!response.ok) {
        throw new NetworkError({
          message: `Failed to fetch tasks: ${response.statusText}`,
          code: ErrorCode.ERR_NETWORK_REQUEST_FAILED,
          severity: ErrorSeverity.ERROR,
          userMessage: 'Unable to load tasks. Please try again later.',
          context: { 
            status: response.status,
            url: '/api/tasks'
          }
        });
      }
      
      return await response.json();
    } catch (error) {
      // Convert any error to an AppError and log it
      this.errorService.handleError(
        this.errorService.createAppError(error, {
          code: ErrorCode.ERR_NETWORK_REQUEST_FAILED,
          source: ErrorSource.NETWORK,
          userMessage: 'Unable to load tasks. Please try again later.'
        }),
        { context: { method: 'fetchTasks' } }
      );
      
      // Return empty array as fallback
      return [];
    }
  }
}
```

### Advanced Usage with Retries and Recovery

```typescript
async syncData() {
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      // Sync logic here
      return await this.performSync();
    } catch (error) {
      attempts++;
      
      const appError = this.errorService.createAppError(error, {
        code: ErrorCode.ERR_SYNC_FAILED,
        source: ErrorSource.SYNC,
        severity: attempts >= maxAttempts ? ErrorSeverity.ERROR : ErrorSeverity.WARNING,
        userMessage: attempts >= maxAttempts 
          ? 'Unable to sync your data. Please try again later.' 
          : `Retrying sync (attempt ${attempts}/${maxAttempts})`,
        context: { attempt: attempts, maxAttempts }
      });
      
      this.errorService.logError(appError);
      
      if (attempts < maxAttempts) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
      } else {
        // Give up after max attempts
        throw appError;
      }
    }
  }
}
```

## Error Context in React Components

### Providing the Error Context

Add the ErrorProvider to your app's component hierarchy:

```tsx
// In App.tsx or similar root component
import { ErrorProvider } from './contexts/error/ErrorContext';
import { ServiceRegistryProvider } from './contexts/services/ServiceRegistryContext';

function App() {
  return (
    <ServiceRegistryProvider>
      <ErrorProvider>
        {/* Other providers and components */}
        <MainContent />
      </ErrorProvider>
    </ServiceRegistryProvider>
  );
}
```

### Using Error Handling in Components

```tsx
import React from 'react';
import { useError } from '../../contexts/error/ErrorContext';
import { ErrorCode, ErrorSeverity, ValidationError } from '../../services/error/ErrorTypes';

export const TaskForm: React.FC = () => {
  const { logError } = useError();
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      // Form validation logic
      const title = (event.target as any).taskTitle.value;
      
      if (!title) {
        logError('Task title is required', {
          code: ErrorCode.ERR_VALIDATION_REQUIRED,
          severity: ErrorSeverity.WARNING,
          source: ErrorSource.VALIDATION,
          userMessage: 'Please enter a task title',
          context: { field: 'taskTitle' }
        });
        return;
      }
      
      // Continue with form submission...
    } catch (error) {
      logError(error, {
        code: ErrorCode.ERR_UNKNOWN,
        userMessage: 'Failed to create task. Please try again.'
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Creating an Error Notification Component

```tsx
import React from 'react';
import { useError } from '../../contexts/error/ErrorContext';
import { ErrorSeverity } from '../../services/error/ErrorTypes';

export const ErrorNotification: React.FC = () => {
  const { isNotificationVisible, lastError, dismissNotification } = useError();
  
  if (!isNotificationVisible || !lastError) {
    return null;
  }
  
  // Map severity to notification style
  const getNotificationClass = () => {
    switch (lastError.severity) {
      case ErrorSeverity.CRITICAL:
        return 'notification-critical';
      case ErrorSeverity.ERROR:
        return 'notification-error';
      case ErrorSeverity.WARNING:
        return 'notification-warning';
      case ErrorSeverity.INFO:
        return 'notification-info';
      default:
        return 'notification-info';
    }
  };
  
  return (
    <div className={`notification ${getNotificationClass()}`}>
      <p>{lastError.userMessage || lastError.message}</p>
      <button onClick={dismissNotification}>Dismiss</button>
    </div>
  );
};
```

## Testing with MockErrorService

### Component Testing

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorProvider } from '../../contexts/error/ErrorContext';
import { MockErrorService } from '../../services/mocks/MockErrorService';
import { TaskForm } from './TaskForm';

describe('TaskForm', () => {
  let mockErrorService;
  
  beforeEach(() => {
    mockErrorService = new MockErrorService();
  });
  
  test('shows validation error when submitted without title', () => {
    render(
      <ErrorProvider service={mockErrorService}>
        <TaskForm />
      </ErrorProvider>
    );
    
    // Submit the form without filling in fields
    fireEvent.click(screen.getByText('Submit'));
    
    // Check that error was logged
    expect(mockErrorService.errors.length).toBe(1);
    expect(mockErrorService.errors[0].code).toBe('ERR_VALIDATION_REQUIRED');
    expect(mockErrorService.errors[0].userMessage).toBe('Please enter a task title');
  });
});
```

### Service Testing

```jsx
import { MockErrorService } from '../../services/mocks/MockErrorService';
import { TaskService } from '../TaskService';

describe('TaskService', () => {
  let mockErrorService;
  let taskService;
  
  beforeEach(() => {
    mockErrorService = new MockErrorService();
    taskService = new TaskService(mockErrorService);
    
    // Mock fetch
    global.fetch = jest.fn();
  });
  
  test('handles network errors when fetching tasks', async () => {
    // Mock a failed fetch
    global.fetch.mockRejectedValue(new Error('Network failure'));
    
    // Call the method
    const result = await taskService.fetchTasks();
    
    // Verify empty fallback result
    expect(result).toEqual([]);
    
    // Verify error was handled
    expect(mockErrorService.errors.length).toBe(1);
    expect(mockErrorService.errors[0].source).toBe('network');
    expect(mockErrorService.errors[0].message).toContain('Network failure');
  });
});
```

## Best Practices

1. **Use Typed Errors**
   - Always use the appropriate error class (NetworkError, ValidationError, etc.)
   - Include as much context as possible
   - Set appropriate severity levels

2. **Consistent Error Handling in Services**
   - Catch and convert all errors to AppErrors
   - Use the context field to add method name and input parameters
   - Set appropriate user messages for UI display
   - Consider recoverability and retryability

3. **Comprehensive Error Reporting**
   - Ensure all errors have meaningful codes and sources
   - Include stack traces in development mode
   - Add context for debugging (request data, state info, etc.)

4. **User Experience**
   - Only show user-facing messages for relevant errors
   - Provide actionable information when possible
   - Use appropriate severity styling for notifications
   - Allow retry for recoverable operations

5. **Testing**
   - Test both success and failure cases
   - Verify error handling in component tests
   - Use MockErrorService to validate error flows
   - Test retry and recovery mechanisms
