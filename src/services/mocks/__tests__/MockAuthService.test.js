// Tests for the MockAuthService
// This demonstrates how to use the mock in your component and service tests

import { MockAuthService } from '../MockAuthService';
import { ServiceError } from '../../BaseService';

describe('MockAuthService', () => {
  let mockService;

  beforeEach(() => {
    // Create a fresh instance of the mock service for each test
    mockService = new MockAuthService();
  });

  test('initializes with no authenticated user by default', async () => {
    // Verify no user or session
    const { user } = await mockService.getUser();
    const { session } = await mockService.getSession();
    
    expect(user).toBeNull();
    expect(session).toBeNull();
    expect(await mockService.isAuthenticated()).toBe(false);
    expect(await mockService.getCurrentUserId()).toBeNull();
  });

  test('signs in successfully with valid credentials', async () => {
    // Valid credentials are email + 'validpassword'
    const { session, error } = await mockService.signIn('test@example.com', 'validpassword');
    
    // Verify successful sign-in
    expect(error).toBeNull();
    expect(session).toBeTruthy();
    expect(session.user.email).toBe('test@example.com');
    
    // Verify user is authenticated
    expect(await mockService.isAuthenticated()).toBe(true);
    expect(await mockService.getCurrentUserId()).toBe(session.user.id);
    
    // Verify method call was tracked
    expect(mockService.methodCalls.signIn.length).toBe(1);
    expect(mockService.methodCalls.signIn[0].email).toBe('test@example.com');
  });

  test('fails sign in with invalid credentials', async () => {
    // Invalid password
    const { session, error } = await mockService.signIn('test@example.com', 'wrongpassword');
    
    // Verify failed sign-in
    expect(session).toBeNull();
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe('invalid_credentials');
    
    // Verify user is not authenticated
    expect(await mockService.isAuthenticated()).toBe(false);
  });

  test('signs up successfully with valid details', async () => {
    // Valid signup
    const { user, error } = await mockService.signUp('newuser@example.com', 'password123');
    
    // Verify successful sign-up
    expect(error).toBeNull();
    expect(user).toBeTruthy();
    expect(user.email).toBe('newuser@example.com');
    
    // Verify user is authenticated after signup
    expect(await mockService.isAuthenticated()).toBe(true);
    
    // Verify method call was tracked
    expect(mockService.methodCalls.signUp.length).toBe(1);
  });

  test('fails sign up with invalid details', async () => {
    // Invalid email
    const { user: user1, error: error1 } = await mockService.signUp('notanemail', 'password123');
    
    expect(user1).toBeNull();
    expect(error1).toBeInstanceOf(ServiceError);
    expect(error1.code).toBe('invalid_email');
    
    // Password too short
    const { user: user2, error: error2 } = await mockService.signUp('valid@example.com', '12345');
    
    expect(user2).toBeNull();
    expect(error2).toBeInstanceOf(ServiceError);
    expect(error2.code).toBe('weak_password');
  });

  test('signs out successfully', async () => {
    // First sign in
    await mockService.signIn('test@example.com', 'validpassword');
    expect(await mockService.isAuthenticated()).toBe(true);
    
    // Then sign out
    const { error } = await mockService.signOut();
    
    // Verify successful sign-out
    expect(error).toBeNull();
    expect(await mockService.isAuthenticated()).toBe(false);
    expect(await mockService.getCurrentUserId()).toBeNull();
    
    // Verify method call was tracked
    expect(mockService.methodCalls.signOut.length).toBe(1);
  });

  test('resets password with valid email', async () => {
    // Valid email
    const { error } = await mockService.resetPassword('test@example.com');
    
    // Verify successful password reset
    expect(error).toBeNull();
    
    // Verify method call was tracked
    expect(mockService.methodCalls.resetPassword.length).toBe(1);
    expect(mockService.methodCalls.resetPassword[0].email).toBe('test@example.com');
  });

  test('fails password reset with invalid email', async () => {
    // Invalid email
    const { error } = await mockService.resetPassword('notanemail');
    
    // Verify failed password reset
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe('invalid_email');
  });

  test('updates password when authenticated', async () => {
    // First sign in
    await mockService.signIn('test@example.com', 'validpassword');
    
    // Then update password
    const { error } = await mockService.updatePassword('newpassword123');
    
    // Verify successful password update
    expect(error).toBeNull();
    
    // Verify method call was tracked
    expect(mockService.methodCalls.updatePassword.length).toBe(1);
    expect(mockService.methodCalls.updatePassword[0].password).toBe('newpassword123');
  });

  test('fails password update when not authenticated', async () => {
    // Update password without signing in
    const { error } = await mockService.updatePassword('newpassword123');
    
    // Verify failed password update
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe('not_authenticated');
  });

  test('fails password update with weak password', async () => {
    // First sign in
    await mockService.signIn('test@example.com', 'validpassword');
    
    // Try to update with weak password
    const { error } = await mockService.updatePassword('weak');
    
    // Verify failed password update
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe('weak_password');
  });

  test('emits events for authentication actions', async () => {
    // Set up event listeners
    const signInHandler = jest.fn();
    const signOutHandler = jest.fn();
    const errorHandler = jest.fn();
    
    mockService.on('signed-in', signInHandler);
    mockService.on('signed-out', signOutHandler);
    mockService.on('error', errorHandler);
    
    // Sign in
    await mockService.signIn('test@example.com', 'validpassword');
    
    // Verify signed-in event was emitted
    expect(signInHandler).toHaveBeenCalled();
    expect(signInHandler.mock.calls[0][0].user.email).toBe('test@example.com');
    
    // Sign out
    await mockService.signOut();
    
    // Verify signed-out event was emitted
    expect(signOutHandler).toHaveBeenCalled();
    
    // Trigger an error
    await mockService.signIn('test@example.com', 'wrongpassword');
    
    // Verify error event was emitted
    expect(errorHandler).toHaveBeenCalled();
    expect(errorHandler.mock.calls[0][0].code).toBe('invalid_credentials');
  });

  test('allows mocking return values for methods', async () => {
    // Create a mock session
    const mockSession = {
      access_token: 'mock-token',
      user: {
        id: 'mock-user-id',
        email: 'mock@example.com'
      }
    };
    
    // Mock the getSession method
    mockService.mockMethod('getSession', { session: mockSession, error: null });
    
    // Call the method
    const { session } = await mockService.getSession();
    
    // Verify the mock value is returned
    expect(session).toBe(mockSession);
    expect(session.user.id).toBe('mock-user-id');
    
    // Verify method call was tracked
    expect(mockService.methodCalls.getSession.length).toBe(1);
  });

  test('allows simulating authenticated state', async () => {
    // Initially not authenticated
    expect(await mockService.isAuthenticated()).toBe(false);
    
    // Simulate authenticated state
    mockService.simulateAuthenticated(true, 'simulated@example.com');
    
    // Verify authenticated state
    expect(await mockService.isAuthenticated()).toBe(true);
    
    const { user } = await mockService.getUser();
    expect(user).toBeTruthy();
    expect(user.email).toBe('simulated@example.com');
    
    // Simulate unauthenticated state
    mockService.simulateAuthenticated(false);
    
    // Verify unauthenticated state
    expect(await mockService.isAuthenticated()).toBe(false);
    expect((await mockService.getUser()).user).toBeNull();
  });

  test('resets state', async () => {
    // Simulate authenticated state
    mockService.simulateAuthenticated(true);
    
    // Verify authenticated
    expect(await mockService.isAuthenticated()).toBe(true);
    
    // Reset the mock service
    mockService.reset();
    
    // Verify state is reset
    expect(await mockService.isAuthenticated()).toBe(false);
    expect((await mockService.getUser()).user).toBeNull();
    
    // Verify method call tracking is reset
    expect(mockService.methodCalls.isAuthenticated.length).toBe(0);
  });
});
