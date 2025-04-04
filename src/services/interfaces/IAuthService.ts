import { IService } from './IService';
import { User, Session } from '@supabase/supabase-js';

/**
 * Events that can be emitted by the AuthService
 */
export interface AuthServiceEvents {
  'signed-in': Session;
  'signed-out': void;
  'user-updated': User;
  'session-refreshed': Session;
  'password-reset': void;
  'error': Error;
}

/**
 * Interface for the AuthService
 * Provides methods to manage authentication and user sessions
 */
export interface IAuthService extends IService<AuthServiceEvents> {
  /**
   * Get the current session
   */
  getSession(): Promise<{ session: Session | null; error: Error | null }>;
  
  /**
   * Get the current user
   */
  getUser(): Promise<{ user: User | null; error: Error | null }>;
  
  /**
   * Sign in with email and password
   */
  signIn(email: string, password: string): Promise<{ session: Session | null; error: Error | null }>;
  
  /**
   * Sign up with email and password
   */
  signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  
  /**
   * Sign out the current user
   */
  signOut(): Promise<{ error: Error | null }>;
  
  /**
   * Send a password reset email
   */
  resetPassword(email: string): Promise<{ error: Error | null }>;
  
  /**
   * Update the current user's password
   */
  updatePassword(password: string): Promise<{ error: Error | null }>;
  
  /**
   * Check if the current user is authenticated
   */
  isAuthenticated(): Promise<boolean>;
  
  /**
   * Get the current user's ID if authenticated
   */
  getCurrentUserId(): Promise<string | null>;
}
