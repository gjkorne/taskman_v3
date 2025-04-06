# Error Handling Framework

## Overview

TaskMan v3 implements a centralized error handling system that ensures consistent error reporting, logging, and user feedback across the application. This framework separates error handling logic from business logic and provides standardized patterns for reporting and managing errors.

## Key Components

### 1. Error Types

The foundation of our error handling framework is a set of standardized error types defined in `services/error/ErrorTypes.ts`:

- **ErrorSeverity**: Categorizes errors by their severity (INFO, WARNING, ERROR, CRITICAL)
- **ErrorSource**: Identifies where errors originate (API, DATABASE, UI, etc.)
- **ErrorCode**: Specific error codes for programmatic handling
- **AppError**: Standard interface for all application errors
- **BaseAppError**: Base class for creating custom error types

### 2. Error Service

The `ErrorService` manages error collection, logging, and distribution:

- Records errors in a persistent error log
- Dispatches error events to subscribers
- Provides filtering and querying capabilities
- Handles error persistence for later analysis

### 3. Error Context

The `ErrorContext` provides React components with access to error handling capabilities:

- Simplified API for logging errors
- Management of application-wide error state
- Error notification display logic
- Error clearing and filtering

## Implementation Details

### Error Types Hierarchy

```typescript
// Base error interface - all errors must implement this
export interface AppError extends Error {
  code: ErrorCode;                  // Error code for programmatic handling
  severity: ErrorSeverity;          // Error severity level
  source: ErrorSource;              // Error source category
  timestamp: string;                // When the error occurred
  context?: Record<string, any>;    // Additional context data
  userMessage?: string;             // User-friendly message for UI
  recoverable: boolean;             // Whether the error can be recovered from
  retryable: boolean;               // Whether the operation can be retried
}

// Base error class
export class BaseAppError extends Error implements AppError {
  // Implementation details...
}

// Domain-specific error classes
export class NetworkError extends BaseAppError {
  // Network-specific error handling
}

export class DatabaseError extends BaseAppError {
  // Database-specific error handling
}

// Additional error types...
```

### Error Context Integration

The `ErrorContext` serves as the application-wide error management system. Components use it to report errors and display error messages:

```typescript
// In a component or service
const { logError, clearErrors } = useError();

try {
  // Operation that might fail
} catch (error) {
  logError(error, {
    code: ErrorCode.ERR_TASK_FETCH_FAILED,
    severity: ErrorSeverity.ERROR,
    source: ErrorSource.API,
    userMessage: 'Failed to load tasks. Please try again.'
  });
}
```

## Error Handling Best Practices

### 1. Error Creation

Create standardized errors using the appropriate error class:

```typescript
// Create a network error
throw new NetworkError({
  message: 'Failed to fetch data from server',
  code: ErrorCode.ERR_NETWORK_REQUEST_FAILED,
  userMessage: 'Unable to connect to the server. Please check your internet connection.',
  retryable: true
});
```

### 2. Error Handling in Services

Services should use a consistent pattern for returning errors:

```typescript
async function getData(): Promise<{ data: Data | null; error: Error | null }> {
  try {
    const result = await api.fetch('/data');
    return { data: result, error: null };
  } catch (err) {
    const error = new NetworkError({
      message: 'Failed to fetch data',
      code: ErrorCode.ERR_NETWORK_REQUEST_FAILED,
      cause: err as Error
    });
    
    return { data: null, error };
  }
}
```

### 3. Error Handling in Contexts

Contexts should use the `ErrorContext` to report and manage errors:

```typescript
// In a context provider
const { logError } = useError();

try {
  // Operation that might fail
} catch (err) {
  logError(err, {
    code: ErrorCode.ERR_TASK_FETCH_FAILED,
    severity: ErrorSeverity.ERROR,
    source: ErrorSource.API,
    userMessage: 'Failed to load tasks. Please try again later.'
  });
}
```

### 4. Error Handling in Components

Components should use contexts rather than directly handling errors:

```typescript
// In a component
function TaskList() {
  const { tasks, error, isLoading, refreshTasks } = useTasks();
  
  if (error) {
    return <ErrorDisplay error={error} onRetry={refreshTasks} />;
  }
  
  // Render tasks...
}
```

## Error Reporting and Monitoring

The error framework integrates with monitoring systems:

1. **Local Logging**: Errors are logged to the browser console in development
2. **Remote Logging**: Critical errors are sent to a monitoring service in production
3. **Analytics**: Error metrics are collected for analysis and improvement

## Implementation Checklist

When implementing error handling in a new feature:

- [ ] Use appropriate error codes from `ErrorCode` enum
- [ ] Create meaningful user messages for all error scenarios
- [ ] Set appropriate severity levels for different error types
- [ ] Use the `ErrorContext` to report errors in components and contexts
- [ ] Add retry logic for recoverable errors
- [ ] Handle offline scenarios by detecting network errors
- [ ] Test error scenarios with mock services
