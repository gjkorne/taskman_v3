// Tests for the MockErrorService
// This demonstrates how to use the error service in your component and service tests

import { MockErrorService } from '../MockErrorService';
import { 
  BaseAppError, 
  ErrorCode, 
  ErrorSeverity, 
  ErrorSource 
} from '../../error/ErrorTypes';

describe('MockErrorService', () => {
  let mockService;

  beforeEach(() => {
    // Create a fresh instance of the mock service for each test
    mockService = new MockErrorService();
  });

  test('logs errors correctly', () => {
    // Create a test error
    const testError = new BaseAppError({
      message: 'Test error',
      code: ErrorCode.ERR_UNKNOWN,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN
    });
    
    // Log the error
    mockService.logError(testError);
    
    // Verify the error was logged
    expect(mockService.errors.length).toBe(1);
    expect(mockService.errors[0]).toBe(testError);
    
    // Verify the method was called with the correct arguments
    expect(mockService.methodCalls.logError.length).toBe(1);
    expect(mockService.methodCalls.logError[0].error).toBe(testError);
  });

  test('gets errors with filters', () => {
    // Create test errors with different severities
    const errorHigh = new BaseAppError({
      message: 'High priority error',
      code: ErrorCode.ERR_NETWORK_OFFLINE,
      severity: ErrorSeverity.CRITICAL,
      source: ErrorSource.NETWORK
    });
    
    const errorMedium = new BaseAppError({
      message: 'Medium priority error',
      code: ErrorCode.ERR_VALIDATION_REQUIRED,
      severity: ErrorSeverity.WARNING,
      source: ErrorSource.VALIDATION
    });
    
    // Log the errors
    mockService.logError(errorHigh);
    mockService.logError(errorMedium);
    
    // Get errors with filter
    const criticalErrors = mockService.getErrors({ 
      severity: ErrorSeverity.CRITICAL 
    });
    
    // Verify filtering works
    expect(criticalErrors.length).toBe(1);
    expect(criticalErrors[0].severity).toBe(ErrorSeverity.CRITICAL);
    
    // Verify method call tracking
    expect(mockService.methodCalls.getErrors.length).toBe(1);
  });

  test('clears errors', () => {
    // Create and log test errors
    const networkError = new BaseAppError({
      message: 'Network error',
      code: ErrorCode.ERR_NETWORK_OFFLINE,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.NETWORK
    });
    
    const validationError = new BaseAppError({
      message: 'Validation error',
      code: ErrorCode.ERR_VALIDATION_REQUIRED,
      severity: ErrorSeverity.WARNING,
      source: ErrorSource.VALIDATION
    });
    
    mockService.logError(networkError);
    mockService.logError(validationError);
    
    // Verify both errors are logged
    expect(mockService.errors.length).toBe(2);
    
    // Clear only network errors
    mockService.clearErrors({ source: ErrorSource.NETWORK });
    
    // Verify only validation error remains
    expect(mockService.errors.length).toBe(1);
    expect(mockService.errors[0].source).toBe(ErrorSource.VALIDATION);
    
    // Verify method call tracking
    expect(mockService.methodCalls.clearErrors.length).toBe(1);
  });

  test('tracks error listeners', () => {
    // Create a listener spy
    const listenerSpy = jest.fn();
    
    // Register the listener
    const unsubscribe = mockService.onError(listenerSpy);
    
    // Log an error to trigger the listener
    const testError = new BaseAppError({
      message: 'Test error',
      code: ErrorCode.ERR_UNKNOWN,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN
    });
    
    mockService.logError(testError);
    
    // Verify listener was called
    expect(listenerSpy).toHaveBeenCalledWith(testError);
    
    // Unsubscribe the listener
    unsubscribe();
    
    // Log another error
    const anotherError = new BaseAppError({
      message: 'Another error',
      code: ErrorCode.ERR_UNKNOWN,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN
    });
    
    mockService.logError(anotherError);
    
    // Verify listener wasn't called again
    expect(listenerSpy).toHaveBeenCalledTimes(1);
  });

  test('creates app errors from various sources', () => {
    // Create from a standard Error
    const standardError = new Error('Standard error');
    const appError1 = mockService.createAppError(standardError);
    
    expect(appError1.message).toBe('Standard error');
    expect(appError1.code).toBe(ErrorCode.ERR_UNKNOWN);
    
    // Create from a string
    const appError2 = mockService.createAppError('String error');
    
    expect(appError2.message).toBe('String error');
    
    // Create with custom options
    const appError3 = mockService.createAppError('Custom error', {
      code: ErrorCode.ERR_NETWORK_TIMEOUT,
      severity: ErrorSeverity.CRITICAL,
      source: ErrorSource.NETWORK
    });
    
    expect(appError3.code).toBe(ErrorCode.ERR_NETWORK_TIMEOUT);
    expect(appError3.severity).toBe(ErrorSeverity.CRITICAL);
    expect(appError3.source).toBe(ErrorSource.NETWORK);
  });

  test('simulates errors for testing', () => {
    // Create a listener spy
    const listenerSpy = jest.fn();
    
    // Register the listener
    mockService.onError(listenerSpy);
    
    // Create a test error
    const testError = new BaseAppError({
      message: 'Simulated error',
      code: ErrorCode.ERR_NETWORK_OFFLINE,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.NETWORK
    });
    
    // Simulate the error
    mockService.simulateError(testError);
    
    // Verify error was logged
    expect(mockService.errors.length).toBe(1);
    expect(mockService.errors[0]).toBe(testError);
    
    // Verify listener was notified
    expect(listenerSpy).toHaveBeenCalledWith(testError);
  });

  test('allows mocking method return values', () => {
    // Create a mock error
    const mockError = new BaseAppError({
      message: 'Mock error',
      code: ErrorCode.ERR_UNKNOWN,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN
    });
    
    // Mock the getLastError method
    mockService.mockMethod('getLastError', mockError);
    
    // Call the method
    const result = mockService.getLastError();
    
    // Verify the mock value is returned
    expect(result).toBe(mockError);
    
    // Verify method call was tracked
    expect(mockService.methodCalls.getLastError.length).toBe(1);
  });

  test('handles errors properly', () => {
    // Create a test error
    const testError = new BaseAppError({
      message: 'Test error',
      code: ErrorCode.ERR_UNKNOWN,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN
    });
    
    // Handle the error silently
    mockService.handleError(testError, { silent: true });
    
    // Verify error was logged
    expect(mockService.errors.length).toBe(1);
    
    // Verify handleError was called with the right arguments
    expect(mockService.methodCalls.handleError.length).toBe(1);
    expect(mockService.methodCalls.handleError[0].error).toBe(testError);
    expect(mockService.methodCalls.handleError[0].options.silent).toBe(true);
    
    // Test that error is rethrown when requested
    expect(() => {
      mockService.handleError(testError, { rethrow: true });
    }).toThrow();
  });

  test('tracks reportError calls', async () => {
    // Create a test error
    const testError = new BaseAppError({
      message: 'Test error',
      code: ErrorCode.ERR_UNKNOWN,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN
    });
    
    // Report the error
    await mockService.reportError(testError);
    
    // Verify method call was tracked
    expect(mockService.methodCalls.reportError.length).toBe(1);
    expect(mockService.methodCalls.reportError[0].error).toBe(testError);
    
    // Mock a failure
    const reportError = new Error('Failed to report');
    mockService.mockMethod('reportError', reportError);
    
    // Verify error is propagated
    await expect(mockService.reportError(testError)).rejects.toThrow('Failed to report');
  });

  test('resets state between tests', () => {
    // Log an error
    const testError = new BaseAppError({
      message: 'Test error',
      code: ErrorCode.ERR_UNKNOWN,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.UNKNOWN
    });
    
    mockService.logError(testError);
    
    // Verify error was logged
    expect(mockService.errors.length).toBe(1);
    expect(mockService.methodCalls.logError.length).toBe(1);
    
    // Reset the service
    mockService.reset();
    
    // Verify state is reset
    expect(mockService.errors.length).toBe(0);
    expect(mockService.methodCalls.logError.length).toBe(0);
  });
});
