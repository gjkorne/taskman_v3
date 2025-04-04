import { supabase } from '../../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { BaseService, ServiceError } from '../BaseService';
import { AuthServiceEvents, IAuthService } from '../interfaces/IAuthService';

/**
 * Implementation of the Auth service using Supabase
 * Extends BaseService for standardized error handling and event management
 */
export class AuthService extends BaseService<AuthServiceEvents> implements IAuthService {
  constructor() {
    super();
    // Initialize auth state listener
    this.setupAuthStateListener();
    this.markReady();
  }

  /**
   * Setup Supabase auth state listener to handle auth events
   */
  private async setupAuthStateListener() {
    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        this.emit('signed-in', session);
      } else if (event === 'SIGNED_OUT') {
        this.emit('signed-out');
      } else if (event === 'USER_UPDATED' && session?.user) {
        this.emit('user-updated', session.user);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        this.emit('session-refreshed', session);
      }
    });
  }

  /**
   * Mark the service as ready
   */
  protected markReady() {
    this.ready = true;
    this.emit('ready');
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<{ session: Session | null; error: ServiceError | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      return { session: data.session, error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'auth.session_error');
      this.emit('error', serviceError);
      return { session: null, error: serviceError };
    }
  }

  /**
   * Get the current user
   */
  async getUser(): Promise<{ user: User | null; error: ServiceError | null }> {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'auth.user_error');
      this.emit('error', serviceError);
      return { user: null, error: serviceError };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ session: Session | null; error: ServiceError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Event is automatically emitted by auth state listener
      return { session: data.session, error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'auth.signin_error');
      this.emit('error', serviceError);
      return { session: null, error: serviceError };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<{ user: User | null; error: ServiceError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'auth.signup_error');
      this.emit('error', serviceError);
      return { user: null, error: serviceError };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: ServiceError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Event is automatically emitted by auth state listener
      return { error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'auth.signout_error');
      this.emit('error', serviceError);
      return { error: serviceError };
    }
  }

  /**
   * Send a password reset email
   */
  async resetPassword(email: string): Promise<{ error: ServiceError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      this.emit('password-reset');
      return { error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'auth.reset_password_error');
      this.emit('error', serviceError);
      return { error: serviceError };
    }
  }

  /**
   * Update the user's password
   */
  async updatePassword(password: string): Promise<{ error: ServiceError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'auth.update_password_error');
      this.emit('error', serviceError);
      return { error: serviceError };
    }
  }

  /**
   * Check if the current user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { session } = await this.getSession();
    return !!session;
  }

  /**
   * Get the current user's ID if authenticated
   */
  async getCurrentUserId(): Promise<string | null> {
    const { user } = await this.getUser();
    return user?.id || null;
  }
}

// Create and export a singleton instance
export const authService = new AuthService();
