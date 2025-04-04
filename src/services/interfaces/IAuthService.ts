import { IService } from './IService';
import { User, Session } from '@supabase/supabase-js';
import { ServiceError } from '../BaseService';

/**
 * Events that can be emitted by the AuthService
 */
export interface AuthServiceEvents {
  'signed-in': Session;
  'signed-out': void;
  'user-updated': User;
  'session-refreshed': Session;
  'password-reset': void;
  'error': ServiceError;
}

/**
 * Interface for the AuthService
 * Provides methods to manage authentication and user sessions
 */
export interface IAuthService extends IService<AuthServiceEvents> {
  /**
   * Get the current session
   */
  getSession(): Promise<{ session: Session | null; error: ServiceError | null }>;
  
  /**
   * Get the current user
   */
  getUser(): Promise<{ user: User | null; error: ServiceError | null }>;
  
  /**
   * Sign in with email and password
   */
  signIn(email: string, password: string): Promise<{ session: Session | null; error: ServiceError | null }>;
  
  /**
   * Sign up with email and password
   */
  signUp(email: string, password: string): Promise<{ user: User | null; error: ServiceError | null }>;
  
  /**
   * Sign out the current user
   */
  signOut(): Promise<{ error: ServiceError | null }>;
  
  /**
   * Send a password reset email
   */
  resetPassword(email: string): Promise<{ error: ServiceError | null }>;
  
  /**
   * Update the current user's password
   */
  updatePassword(password: string): Promise<{ error: ServiceError | null }>;
  
  /**
   * Check if the current user is authenticated
   */
  isAuthenticated(): Promise<boolean>;
  
  /**
   * Get the current user's ID if authenticated
   */
  getCurrentUserId(): Promise<string | null>;
}
