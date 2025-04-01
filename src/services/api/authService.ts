import { supabase } from '../../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

// Define the interface for the Auth service
export interface IAuthService {
  // Session and user management
  getSession(): Promise<{ session: Session | null; error: Error | null }>;
  getUser(): Promise<{ user: User | null; error: Error | null }>;
  
  // Authentication methods
  signIn(email: string, password: string): Promise<{ session: Session | null; error: Error | null }>;
  signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  
  // Password management
  resetPassword(email: string): Promise<{ error: Error | null }>;
  updatePassword(password: string): Promise<{ error: Error | null }>;
}

// Implementation of the Auth service using Supabase
export class AuthService implements IAuthService {
  /**
   * Get the current session
   */
  async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      return { session: data.session, error: null };
    } catch (error) {
      console.error('Error getting session:', error);
      return { session: null, error: error as Error };
    }
  }

  /**
   * Get the current user
   */
  async getUser(): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error getting user:', error);
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { session: data.session, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { session: null, error: error as Error };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: error as Error };
    }
  }

  /**
   * Send a password reset email
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error: error as Error };
    }
  }

  /**
   * Update the user's password
   */
  async updatePassword(password: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error updating password:', error);
      return { error: error as Error };
    }
  }
}

// Create and export a singleton instance
export const authService = new AuthService();
