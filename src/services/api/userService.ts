import { supabase } from '../../lib/supabase';
import { BaseService, ServiceError } from '../BaseService';
import {
  IUserService,
  UserProfile,
  UserServiceEvents,
} from '../interfaces/IUserService';
import { authService } from './authService';

/**
 * Implementation of the User service using Supabase
 * Handles user profile operations separate from authentication
 */
export class UserService
  extends BaseService<UserServiceEvents>
  implements IUserService
{
  private userProfileCache: UserProfile | null = null;

  constructor() {
    super();
    this.setupAuthStateListener();
    this.markReady();
  }

  /**
   * Setup listeners for auth state changes to clear cache
   */
  private setupAuthStateListener() {
    authService.on('signed-out', () => {
      // Clear cache when user signs out
      this.userProfileCache = null;
    });

    authService.on('signed-in', async () => {
      // Refresh user profile when signed in
      await this.getUserProfile();
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
   * Ensure the user is authenticated before performing operations
   * @returns The current user ID or throws an error
   */
  private async ensureAuthenticated(): Promise<string> {
    const { user, error } = await authService.getUser();

    if (error || !user) {
      throw new Error('You must be logged in to perform this action');
    }

    return user.id;
  }

  /**
   * Get the current user's profile
   */
  async getUserProfile(): Promise<{
    profile: UserProfile | null;
    error: ServiceError | null;
  }> {
    try {
      // Try to get authenticated user
      const userId = await this.ensureAuthenticated();

      // Return cached profile if available
      if (this.userProfileCache && this.userProfileCache.id === userId) {
        return { profile: this.userProfileCache, error: null };
      }

      // Fetch user profile from database
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // If no profile exists yet, create a basic one
      if (!data) {
        // Get user email from auth
        const { user } = await authService.getUser();

        if (!user) throw new Error('Unable to retrieve user information');

        // Create default profile
        const defaultProfile: UserProfile = {
          id: userId,
          email: user.email || '',
          onboarding_complete: false,
          created_at: new Date().toISOString(),
        };

        // Insert new profile
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert(defaultProfile)
          .select()
          .single();

        if (insertError) throw insertError;

        // Cache and return new profile
        this.userProfileCache = newProfile as UserProfile;
        this.emit('profile-loaded', this.userProfileCache);
        return { profile: this.userProfileCache, error: null };
      }

      // Cache and return existing profile
      this.userProfileCache = data as UserProfile;
      this.emit('profile-loaded', this.userProfileCache);
      return { profile: this.userProfileCache, error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'user.profile_error');
      this.emit('error', serviceError);
      return { profile: null, error: serviceError };
    }
  }

  /**
   * Update the user's profile
   */
  async updateUserProfile(
    data: Partial<UserProfile>
  ): Promise<{ profile: UserProfile | null; error: ServiceError | null }> {
    try {
      // Ensure user is authenticated
      const userId = await this.ensureAuthenticated();

      // Never allow id to be changed
      const updateData = { ...data };
      delete updateData.id;

      // Add updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      // Update profile in database
      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update cache and emit event
      this.userProfileCache = updatedProfile as UserProfile;
      this.emit('profile-updated', this.userProfileCache);

      return { profile: this.userProfileCache, error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'user.update_error');
      this.emit('error', serviceError);
      return { profile: null, error: serviceError };
    }
  }

  /**
   * Check if the user has completed onboarding
   */
  async hasCompletedOnboarding(): Promise<{
    completed: boolean;
    error: ServiceError | null;
  }> {
    try {
      // Get profile, which handles authentication check
      const { profile, error } = await this.getUserProfile();

      if (error) throw error;
      if (!profile) throw new Error('User profile not found');

      return { completed: profile.onboarding_complete, error: null };
    } catch (error) {
      const serviceError = this.processError(
        error,
        'user.onboarding_check_error'
      );
      this.emit('error', serviceError);
      return { completed: false, error: serviceError };
    }
  }

  /**
   * Mark onboarding as complete for the user
   */
  async completeOnboarding(): Promise<{
    success: boolean;
    error: ServiceError | null;
  }> {
    try {
      const { error: profileError } = await this.updateUserProfile({
        onboarding_complete: true,
      });

      if (profileError) throw profileError;

      return { success: true, error: null };
    } catch (error) {
      const serviceError = this.processError(
        error,
        'user.onboarding_complete_error'
      );
      this.emit('error', serviceError);
      return { success: false, error: serviceError };
    }
  }

  /**
   * Get user activity statistics
   */
  async getUserActivityStats(): Promise<{
    stats: {
      tasksCreated: number;
      tasksCompleted: number;
      timeLogged: number;
      lastActiveDate: string | null;
    } | null;
    error: ServiceError | null;
  }> {
    try {
      // Ensure user is authenticated
      const userId = await this.ensureAuthenticated();

      // Get tasks created count
      const { count: tasksCreated, error: createdError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId);

      if (createdError) throw createdError;

      // Get completed tasks count
      const { count: tasksCompleted, error: completedError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
        .eq('status', 'completed');

      if (completedError) throw completedError;

      // Get total time logged in minutes
      const { data: timeSessions, error: timeError } = await supabase
        .from('time_sessions')
        .select('duration')
        .eq('user_id', userId);

      if (timeError) throw timeError;

      // Calculate total time in minutes
      const timeLogged =
        timeSessions?.reduce((total, session) => {
          // Duration is stored as minutes in the database
          return total + (session.duration || 0);
        }, 0) || 0;

      // Get user's last active date
      const { profile } = await this.getUserProfile();
      const lastActiveDate = profile?.last_active_at || null;

      return {
        stats: {
          tasksCreated: tasksCreated || 0,
          tasksCompleted: tasksCompleted || 0,
          timeLogged,
          lastActiveDate,
        },
        error: null,
      };
    } catch (error) {
      const serviceError = this.processError(error, 'user.stats_error');
      this.emit('error', serviceError);
      return { stats: null, error: serviceError };
    }
  }

  /**
   * Update the user's last active timestamp
   */
  async updateLastActive(): Promise<{
    success: boolean;
    error: ServiceError | null;
  }> {
    try {
      // Update profile with current timestamp
      const { error } = await this.updateUserProfile({
        last_active_at: new Date().toISOString(),
      });

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'user.update_active_error');
      this.emit('error', serviceError);
      return { success: false, error: serviceError };
    }
  }
}

// Create and export a singleton instance
export const userService = new UserService();
