import { IService } from './IService';
import { ServiceError } from '../BaseService';

/**
 * User profile data that extends Supabase User with application-specific fields
 */
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  onboarding_complete: boolean;
  last_active_at?: string;
  created_at: string;
  updated_at?: string;
  preferences?: Record<string, any>;
}

/**
 * Events that can be emitted by the UserService
 */
export interface UserServiceEvents {
  'profile-updated': UserProfile;
  'profile-loaded': UserProfile;
  'error': ServiceError;
}

/**
 * Interface for the UserService
 * Provides methods to manage user profile data separate from authentication
 */
export interface IUserService extends IService<UserServiceEvents> {
  /**
   * Get the current user's profile
   * @returns User profile or null if not authenticated
   */
  getUserProfile(): Promise<{ profile: UserProfile | null; error: ServiceError | null }>;
  
  /**
   * Update the user's profile
   * @param data Profile data to update
   */
  updateUserProfile(data: Partial<UserProfile>): Promise<{ profile: UserProfile | null; error: ServiceError | null }>;
  
  /**
   * Check if the user has completed onboarding
   */
  hasCompletedOnboarding(): Promise<{ completed: boolean; error: ServiceError | null }>;
  
  /**
   * Mark onboarding as complete for the user
   */
  completeOnboarding(): Promise<{ success: boolean; error: ServiceError | null }>;
  
  /**
   * Get user activity statistics
   * @returns Various user activity metrics
   */
  getUserActivityStats(): Promise<{ 
    stats: { 
      tasksCreated: number;
      tasksCompleted: number;
      timeLogged: number; // in minutes
      lastActiveDate: string | null;
    } | null; 
    error: ServiceError | null 
  }>;
  
  /**
   * Update the user's last active timestamp
   */
  updateLastActive(): Promise<{ success: boolean; error: ServiceError | null }>;
}
