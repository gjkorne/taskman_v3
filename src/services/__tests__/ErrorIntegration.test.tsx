import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ServiceFactory } from '../factory/ServiceFactory';
import { ErrorContext, ErrorProvider } from '../../contexts/error/ErrorContext';
import { ErrorSeverity, ErrorSource, ErrorCode } from '../error/ErrorTypes';
import { MockTaskService } from '../mocks/MockTaskService';
import { MockErrorService } from '../mocks/MockErrorService';

// Add missing error codes for testing
const TestErrorCode = {
  ...ErrorCode,
  ERR_TASK_FETCH_FAILED: 'ERR_TASK_FETCH_FAILED',
  ERR_UNEXPECTED: 'ERR_UNEXPECTED'
};

// Add missing error sources for testing
const TestErrorSource = {
  ...ErrorSource,
  API: 'api'
};

// A test component that uses both task and error services
const ErrorHandlingComponent: React.FC = () => {
  const { logError, errors, clearErrors } = React.useContext(ErrorContext);
  const [loading, setLoading] = React.useState(false);
  
  // Get task service from factory to demonstrate error integration
  const taskService = React.useMemo(() => 
    ServiceFactory.getService('TaskService'), []);
  
  const handleLoadTasksClick = async () => {
    setLoading(true);
    try {
      const result = await taskService.getTasks();
      if ('error' in result && result.error) {
        // Convert to Error object if it's not already one
        let errorMessage = 'Unknown error';
        
        if (result.error instanceof Error) {
          errorMessage = result.error.message;
        } else if (result.error && typeof result.error === 'object' && 'message' in result.error) {
          errorMessage = String(result.error.message);
        }
        
        const errorObj = result.error instanceof Error 
          ? result.error 
          : new Error(errorMessage);
              
        // Demonstrate error service integration
        logError(errorObj, {
          code: TestErrorCode.ERR_TASK_FETCH_FAILED as any,
          severity: ErrorSeverity.ERROR,
          source: TestErrorSource.API as any,
          userMessage: 'Unable to load your tasks. Please try again later.'
        });
      }
    } catch (error) {
      logError(error as Error, {
        code: TestErrorCode.ERR_UNEXPECTED as any,
        severity: ErrorSeverity.ERROR,
        source: ErrorSource.UNKNOWN,
        userMessage: 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Task Management</h1>
      <button onClick={handleLoadTasksClick} disabled={loading}>
        {loading ? 'Loading...' : 'Load Tasks'}
      </button>
      
      {errors.length > 0 && (
        <div className="error-container" data-testid="error-container">
          <h2>Errors</h2>
          <ul>
            {errors.map((error, index) => (
              <li key={index} data-testid={`error-${index}`}>
                <div className="error-title">
                  {error.userMessage || error.message}
                </div>
                <div className="error-detail">
                  <span className="error-code">{error.code}</span>
                  <span className="error-severity">{error.severity}</span>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={clearErrors}>Clear Errors</button>
        </div>
      )}
    </div>
  );
};

describe('Error Integration with Services', () => {
  beforeEach(() => {
    // Configure factory for testing
    ServiceFactory.configure({ mode: 'test' });
    jest.clearAllMocks();
  });

  afterEach(() => {
    ServiceFactory.reset();
  });

  test('logs errors when task service fails', async () => {
    // Get mock services for spying/setup
    const taskService = ServiceFactory.getService('TaskService') as unknown as MockTaskService;
    const errorService = ServiceFactory.getService('ErrorService') as unknown as MockErrorService;
    
    // Spy on the error service
    const logErrorSpy = jest.spyOn(errorService, 'logError');
    
    // Setup task service to return an error
    taskService.mockMethod('getTasks', {
      tasks: [],
      error: {
        code: 'API_ERROR',
        message: 'Failed to fetch tasks from API',
        detail: 'Network timeout'
      }
    });
    
    // Render the component with ErrorProvider
    render(
      <ErrorProvider>
        <ErrorHandlingComponent />
      </ErrorProvider>
    );
    
    // Click the load tasks button
    fireEvent.click(screen.getByText('Load Tasks'));
    
    // Wait for error to appear
    await waitFor(() => {
      // Verify error shows up in UI
      expect(screen.getByTestId('error-container')).toBeInTheDocument();
      expect(screen.getByText('Unable to load your tasks. Please try again later.')).toBeInTheDocument();
      
      // Verify error was logged to error service
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          code: TestErrorCode.ERR_TASK_FETCH_FAILED,
          severity: ErrorSeverity.ERROR,
          source: TestErrorSource.API,
        })
      );
    });
  });

  test('clears errors when clear button is clicked', async () => {
    // Get mock services
    const taskService = ServiceFactory.getService('TaskService') as unknown as MockTaskService;
    
    // Setup task service to return an error
    taskService.mockMethod('getTasks', {
      tasks: [],
      error: {
        code: 'API_ERROR',
        message: 'Failed to fetch tasks from API'
      }
    });
    
    // Render the component
    render(
      <ErrorProvider>
        <ErrorHandlingComponent />
      </ErrorProvider>
    );
    
    // Click load tasks to trigger error
    fireEvent.click(screen.getByText('Load Tasks'));
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-container')).toBeInTheDocument();
    });
    
    // Click clear errors button
    fireEvent.click(screen.getByText('Clear Errors'));
    
    // Verify errors are cleared
    await waitFor(() => {
      expect(screen.queryByTestId('error-container')).not.toBeInTheDocument();
    });
  });

  test('handles multiple errors', async () => {
    // Get mock services
    const taskService = ServiceFactory.getService('TaskService') as unknown as MockTaskService;
    const errorService = ServiceFactory.getService('ErrorService') as unknown as MockErrorService;
    
    // Spy on the onError method instead of emit
    const onErrorSpy = jest.spyOn(errorService, 'onError');
    
    // Render the component
    render(
      <ErrorProvider>
        <ErrorHandlingComponent />
      </ErrorProvider>
    );
    
    // Setup task service to return an error the first time
    taskService.mockMethod('getTasks', {
      tasks: [],
      error: {
        code: 'API_ERROR',
        message: 'Failed to fetch tasks from API'
      }
    });
    
    // Click load tasks to trigger first error
    fireEvent.click(screen.getByText('Load Tasks'));
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-container')).toBeInTheDocument();
    });
    
    // Setup a different error
    taskService.mockMethod('getTasks', {
      tasks: [],
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'User not authorized to view tasks'
      }
    });
    
    // Click load tasks again to trigger second error
    fireEvent.click(screen.getByText('Load Tasks'));
    
    // Verify both errors are displayed
    await waitFor(() => {
      expect(screen.getAllByTestId(/error-\d+/).length).toBe(2);
      expect(screen.getByText('Unable to load your tasks. Please try again later.')).toBeInTheDocument();
      
      // Verify error handling was called
      expect(onErrorSpy).toHaveBeenCalled();
    });
  });
});
