import { supabase } from '../lib/supabase';
import { 
  DEFAULT_USER_PREFERENCES, 
  IUserPreferencesService, 
  UserPreferences, 
  UserPreferencesEvents 
} from './interfaces/IUserPreferencesService';
import { BaseService, ServiceError } from './BaseService';

/**
 * Service to manage user preferences with cross-device sync
 * Uses the user_preferences table in Supabase
 * Extends BaseService for standardized error handling and event management
 */
export class UserPreferencesService extends BaseService<UserPreferencesEvents> implements IUserPreferencesService {
  private cachedPreferences: UserPreferences | null = null;
  private userId: string | null = null;
  private isInitialized = false;

  constructor() {
    super();
    // Get the current user
    this.initUserPreferences();
    
    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        this.initUserPreferences();
      } else if (event === 'SIGNED_OUT') {
        this.cachedPreferences = null;
        this.userId = null;
        this.isInitialized = false;
      }
    });
  }
  
  /**
   * Initialize user preferences by loading them from the database
   */
  private async initUserPreferences(): Promise<void> {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      this.userId = user.id;
      
      // Load preferences from the database
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        // Create default preferences if none exist
        await this.createDefaultPreferences();
      } else {
        // Merge database preferences with defaults to ensure all fields exist
        const dbPreferences = {
          ...DEFAULT_USER_PREFERENCES,
          ...(data.preferences || {}),
          ...(data.ui_preferences || {})
        };
        
        // Special case for theme which is stored directly
        if (data.theme) {
          dbPreferences.theme = data.theme;
        }
        
        this.cachedPreferences = dbPreferences;
        this.emit('preferences-loaded', this.cachedPreferences || {});
      }
      
      this.isInitialized = true;
      this.markReady();
    } catch (error) {
      const serviceError = this.processError(error, 'preferences.init_error');
      this.emit('preferences-error', serviceError);
      
      // Fall back to defaults
      this.cachedPreferences = { ...DEFAULT_USER_PREFERENCES };
      this.markReady();
    }
  }
  
  /**
   * Create default preferences record for a new user
   */
  private async createDefaultPreferences(): Promise<void> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: this.userId,
        preferences: {},
        ui_preferences: {},
        theme: DEFAULT_USER_PREFERENCES.theme
      });
    
    if (error) {
      throw error;
    }
    
    this.cachedPreferences = { ...DEFAULT_USER_PREFERENCES };
  }

  /**
   * Get all user preferences
   */
  async getUserPreferences(): Promise<UserPreferences> {
    // Make sure we're initialized
    if (!this.isInitialized) {
      await this.initUserPreferences();
    }
    
    return this.cachedPreferences || { ...DEFAULT_USER_PREFERENCES };
  }

  /**
   * Get a specific preference
   */
  async getPreference<T>(key: keyof UserPreferences, defaultValue: T): Promise<T> {
    const preferences = await this.getUserPreferences();
    
    if (key in preferences) {
      return preferences[key] as unknown as T;
    }
    
    return defaultValue;
  }

  /**
   * Set a specific preference
   */
  async setPreference<T>(key: keyof UserPreferences, value: T): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }
      
      // Make sure we have preferences loaded
      await this.getUserPreferences();
      
      // Update local cache
      if (this.cachedPreferences) {
        this.cachedPreferences = {
          ...this.cachedPreferences,
          [key]: value
        };
      }
      
      // Determine which database field to update based on the key
      let updateField: string;
      let updateValue: any;
      
      if (key === 'theme') {
        // Theme is stored directly
        updateField = 'theme';
        updateValue = value;
      } else {
        // Separate UI preferences from general preferences
        const uiPreferenceKeys = ['defaultView', 'uiDensity'];
        if (uiPreferenceKeys.includes(key as string)) {
          updateField = 'ui_preferences';
          
          // Get current UI preferences
          const { data, error } = await supabase
            .from('user_preferences')
            .select('ui_preferences')
            .eq('user_id', this.userId)
            .single();
          
          if (error) throw error;
          
          // Merge with new value
          updateValue = {
            ...(data?.ui_preferences || {}),
            [key]: value
          };
        } else {
          updateField = 'preferences';
          
          // Get current preferences
          const { data, error } = await supabase
            .from('user_preferences')
            .select('preferences')
            .eq('user_id', this.userId)
            .single();
          
          if (error) throw error;
          
          // Merge with new value
          updateValue = {
            ...(data?.preferences || {}),
            [key]: value
          };
        }
      }
      
      // Update in database
      const { error } = await supabase
        .from('user_preferences')
        .update({ [updateField]: updateValue })
        .eq('user_id', this.userId);
      
      if (error) throw error;
      
      // Emit events
      this.emit('preferences-changed', this.cachedPreferences || {});
      if (key === 'theme') {
        this.emit('theme-changed', value as unknown as string);
      }
    } catch (error) {
      const serviceError = this.processError(error, 'preferences.set_preference_error');
      this.emit('preferences-error', serviceError);
      throw serviceError;
    }
  }

  /**
   * Set multiple preferences at once
   */
  async setPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }
      
      // Make sure we have preferences loaded
      await this.getUserPreferences();
      
      // Update local cache
      if (this.cachedPreferences) {
        this.cachedPreferences = {
          ...this.cachedPreferences,
          ...preferences
        };
      }
      
      // Split preferences into the database schema fields
      const theme = preferences.theme;
      const uiPreferenceKeys = ['defaultView', 'uiDensity'];
      
      const uiPreferences: Record<string, any> = {};
      const generalPreferences: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(preferences)) {
        if (key === 'theme') continue; // Handled separately
        
        if (uiPreferenceKeys.includes(key)) {
          uiPreferences[key] = value;
        } else {
          generalPreferences[key] = value;
        }
      }
      
      // Get current values
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences, ui_preferences')
        .eq('user_id', this.userId)
        .single();
      
      if (error) throw error;
      
      // Prepare the update object
      const updateObj: Record<string, any> = {};
      
      if (theme !== undefined) {
        updateObj.theme = theme;
      }
      
      if (Object.keys(uiPreferences).length > 0) {
        updateObj.ui_preferences = {
          ...(data?.ui_preferences || {}),
          ...uiPreferences
        };
      }
      
      if (Object.keys(generalPreferences).length > 0) {
        updateObj.preferences = {
          ...(data?.preferences || {}),
          ...generalPreferences
        };
      }
      
      // Update in database
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update(updateObj)
        .eq('user_id', this.userId);
      
      if (updateError) throw updateError;
      
      // Emit events
      this.emit('preferences-changed', this.cachedPreferences || {});
      if (theme !== undefined) {
        this.emit('theme-changed', theme);
      }
    } catch (error) {
      const serviceError = this.processError(error, 'preferences.set_preferences_error');
      this.emit('preferences-error', serviceError);
      throw serviceError;
    }
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error('User not authenticated');
      }
      
      // Update local cache
      this.cachedPreferences = { ...DEFAULT_USER_PREFERENCES };
      
      // Update in database
      const { error } = await supabase
        .from('user_preferences')
        .update({
          preferences: {},
          ui_preferences: {},
          theme: DEFAULT_USER_PREFERENCES.theme
        })
        .eq('user_id', this.userId);
      
      if (error) throw error;
      
      // Emit events
      this.emit('preferences-changed', this.cachedPreferences);
      this.emit('theme-changed', DEFAULT_USER_PREFERENCES.theme);
    } catch (error) {
      const serviceError = this.processError(error, 'preferences.reset_error');
      this.emit('preferences-error', serviceError);
      throw serviceError;
    }
  }

  /**
   * Get the effective theme (light or dark) based on preferences and system settings
   */
  async getEffectiveTheme(): Promise<'light' | 'dark'> {
    const preferences = await this.getUserPreferences();
    
    if (preferences.theme === 'light') {
      return 'light';
    } else if (preferences.theme === 'dark') {
      return 'dark';
    } else {
      // System preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
  }
}

// Create and export a singleton instance
export const userPreferencesService = new UserPreferencesService();
