import { IAuthService, AuthServiceEvents } from '../interfaces/IAuthService';
import { User, Session } from '@supabase/supabase-js';
import { ServiceError } from '../BaseService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementation of ServiceError for mock service
 * This allows creating error objects that match the ServiceError interface
 */
class MockServiceError implements ServiceError {
  code: string;
  message: string;
  detail?: string;
  originalError?: any;

  constructor(code: string, message: string, context?: Record<string, any>) {
    this.code = code;
    this.message = message;
    this.originalError = context;
  }
}

/**
 * Mock implementation of the AuthService for testing
 * This allows tests to simulate authentication flows without actual API calls
 */
export class MockAuthService implements IAuthService {
  // Mock user and session state
  private user: User | null = null;
  private session: Session | null = null;
  private authenticated: boolean = false;
  
  // Track method calls for assertions
  methodCalls: Record<string, any[]> = {
    getSession: [],
    getUser: [],
    signIn: [],
    signUp: [],
    signOut: [],
    resetPassword: [],
    updatePassword: [],
    isAuthenticated: [],
    getCurrentUserId: [],
    on: [],
    off: [],
    emit: []
  };
  
  // Store mock return values for various methods
  mockReturnValues: Record<string, any> = {};
  
  // Event handlers
  private eventHandlers: Partial<Record<keyof AuthServiceEvents, Array<(data: any) => void>>> = {};
  
  /**
   * Create a new MockAuthService with optional initial user
   */
  constructor(initialUser?: User, initialSession?: Session) {
    if (initialUser) {
      this.user = initialUser;
      this.authenticated = true;
    }
    
    if (initialSession) {
      this.session = initialSession;
    } else if (initialUser) {
      // Create a mock session if user provided but no session
      this.session = this.createMockSession(initialUser);
    }
  }
  
  /**
   * Get the current session
   */
  async getSession(): Promise<{ session: Session | null; error: ServiceError | null }> {
    this.methodCalls.getSession.push({});
    
    if (this.mockReturnValues.getSession) {
      return this.mockReturnValues.getSession;
    }
    
    return { session: this.session, error: null };
  }
  
  /**
   * Get the current user
   */
  async getUser(): Promise<{ user: User | null; error: ServiceError | null }> {
    this.methodCalls.getUser.push({});
    
    if (this.mockReturnValues.getUser) {
      return this.mockReturnValues.getUser;
    }
    
    return { user: this.user, error: null };
  }
  
  /**
   * Sign in with email and password
   */
  async signIn(
    email: string, 
    password: string
  ): Promise<{ session: Session | null; error: ServiceError | null }> {
    this.methodCalls.signIn.push({ email, password });
    
    if (this.mockReturnValues.signIn) {
      return this.mockReturnValues.signIn;
    }
    
    // Mock implementation - succeed if password is "validpassword"
    if (password === 'validpassword') {
      // Create a mock user and session
      this.user = this.createMockUser(email);
      this.session = this.createMockSession(this.user);
      this.authenticated = true;
      
      // Emit signed-in event
      this.emit('signed-in', this.session);
      
      return { session: this.session, error: null };
    }
    
    // Failed login
    const error = new MockServiceError(
      'invalid_credentials', 
      'Invalid email or password',
      { email }
    );
    
    // Emit error event
    this.emit('error', error);
    
    return { session: null, error };
  }
  
  /**
   * Sign up with email and password
   */
  async signUp(
    email: string, 
    password: string
  ): Promise<{ user: User | null; error: ServiceError | null }> {
    this.methodCalls.signUp.push({ email, password });
    
    if (this.mockReturnValues.signUp) {
      return this.mockReturnValues.signUp;
    }
    
    // Mock implementation - succeed with any valid-looking email and password
    if (this.isValidEmail(email) && password.length >= 6) {
      // Create a mock user
      this.user = this.createMockUser(email);
      this.session = this.createMockSession(this.user);
      this.authenticated = true;
      
      return { user: this.user, error: null };
    }
    
    // Failed signup
    let errorCode = 'signup_failed';
    let errorMessage = 'Failed to create account';
    
    if (!this.isValidEmail(email)) {
      errorCode = 'invalid_email';
      errorMessage = 'Invalid email format';
    } else if (password.length < 6) {
      errorCode = 'weak_password';
      errorMessage = 'Password must be at least 6 characters';
    }
    
    const error = new MockServiceError(errorCode, errorMessage, { email });
    
    // Emit error event
    this.emit('error', error);
    
    return { user: null, error };
  }
  
  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: ServiceError | null }> {
    this.methodCalls.signOut.push({});
    
    if (this.mockReturnValues.signOut) {
      return this.mockReturnValues.signOut;
    }
    
    // Mock implementation - always succeed
    this.user = null;
    this.session = null;
    this.authenticated = false;
    
    // Emit signed-out event
    this.emit('signed-out');
    
    return { error: null };
  }
  
  /**
   * Send a password reset email
   */
  async resetPassword(email: string): Promise<{ error: ServiceError | null }> {
    this.methodCalls.resetPassword.push({ email });
    
    if (this.mockReturnValues.resetPassword) {
      return this.mockReturnValues.resetPassword;
    }
    
    // Mock implementation - succeed with valid email
    if (this.isValidEmail(email)) {
      // Emit password-reset event
      this.emit('password-reset');
      
      return { error: null };
    }
    
    // Failed reset
    const error = new MockServiceError(
      'invalid_email', 
      'Invalid email format',
      { email }
    );
    
    // Emit error event
    this.emit('error', error);
    
    return { error };
  }
  
  /**
   * Update the current user's password
   */
  async updatePassword(password: string): Promise<{ error: ServiceError | null }> {
    this.methodCalls.updatePassword.push({ password });
    
    if (this.mockReturnValues.updatePassword) {
      return this.mockReturnValues.updatePassword;
    }
    
    // Mock implementation - fail if not authenticated
    if (!this.authenticated || !this.user) {
      const error = new MockServiceError(
        'not_authenticated', 
        'User must be authenticated to update password'
      );
      
      // Emit error event
      this.emit('error', error);
      
      return { error };
    }
    
    // Mock implementation - fail if password too short
    if (password.length < 6) {
      const error = new MockServiceError(
        'weak_password', 
        'Password must be at least 6 characters'
      );
      
      // Emit error event
      this.emit('error', error);
      
      return { error };
    }
    
    // Success case
    return { error: null };
  }
  
  /**
   * Check if the current user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    this.methodCalls.isAuthenticated.push({});
    
    if (this.mockReturnValues.isAuthenticated !== undefined) {
      return this.mockReturnValues.isAuthenticated;
    }
    
    return this.authenticated;
  }
  
  /**
   * Get the current user's ID if authenticated
   */
  async getCurrentUserId(): Promise<string | null> {
    this.methodCalls.getCurrentUserId.push({});
    
    if (this.mockReturnValues.getCurrentUserId !== undefined) {
      return this.mockReturnValues.getCurrentUserId;
    }
    
    return this.user?.id || null;
  }
  
  /**
   * Subscribe to service events
   */
  on<K extends keyof AuthServiceEvents>(
    event: K, 
    callback: (data: AuthServiceEvents[K]) => void
  ): () => void {
    this.methodCalls.on.push({ event, callback });
    
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    
    this.eventHandlers[event]!.push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  /**
   * Unsubscribe from service events
   */
  off<K extends keyof AuthServiceEvents>(
    event: K, 
    callback: (data: AuthServiceEvents[K]) => void
  ): void {
    this.methodCalls.off.push({ event, callback });
    
    if (!this.eventHandlers[event]) {
      return;
    }
    
    const index = this.eventHandlers[event]!.indexOf(callback as any);
    if (index !== -1) {
      this.eventHandlers[event]!.splice(index, 1);
    }
  }
  
  /**
   * Emit an event with data
   */
  emit<K extends keyof AuthServiceEvents>(
    event: K, 
    data?: AuthServiceEvents[K]
  ): void {
    this.methodCalls.emit.push({ event, data });
    
    if (!this.eventHandlers[event]) {
      return;
    }
    
    for (const handler of this.eventHandlers[event]!) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${String(event)}:`, error);
      }
    }
  }
  
  /**
   * Reset the mock service state
   */
  reset(): void {
    this.user = null;
    this.session = null;
    this.authenticated = false;
    this.mockReturnValues = {};
    
    // Reset method call tracking
    Object.keys(this.methodCalls).forEach(method => {
      this.methodCalls[method] = [];
    });
    
    // Clear event handlers
    this.eventHandlers = {};
  }
  
  /**
   * Set a mock return value for a method
   */
  mockMethod(methodName: string, returnValue: any): void {
    this.mockReturnValues[methodName] = returnValue;
  }
  
  /**
   * Simulate authenticated state
   */
  simulateAuthenticated(authenticated: boolean = true, email: string = 'test@example.com'): void {
    this.authenticated = authenticated;
    
    if (authenticated) {
      this.user = this.createMockUser(email);
      this.session = this.createMockSession(this.user);
    } else {
      this.user = null;
      this.session = null;
    }
  }
  
  /**
   * Create a mock user
   */
  private createMockUser(email: string): User {
    return {
      id: uuidv4(),
      app_metadata: {},
      user_metadata: {
        name: email.split('@')[0], // Use part before @ as name
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email,
      email_confirmed_at: new Date().toISOString(),
      phone: '',
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      role: 'authenticated',
      updated_at: new Date().toISOString()
    } as User;
  }
  
  /**
   * Create a mock session
   */
  private createMockSession(user: User): Session {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    
    return {
      access_token: `mock-token-${uuidv4()}`,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: expiresAt,
      refresh_token: `mock-refresh-${uuidv4()}`,
      user: user
    } as Session;
  }
  
  /**
   * Basic email validation
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
