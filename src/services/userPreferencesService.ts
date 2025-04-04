import { supabase } from '../lib/supabase';
import { EventEmitter } from '../utils/eventEmitter';
import { 
  DEFAULT_USER_PREFERENCES, 
  IUserPreferencesService, 
  UserPreferences, 
  UserPreferencesEvents 
} from './interfaces/IUserPreferencesService';
import { AppError, ErrorType } from '../utils/errorHandling';

/**
 * Service to manage user preferences with cross-device sync
 * Uses the user_preferences table in Supabase
 */
export class UserPreferencesService implements IUserPreferencesService {
  private eventEmitter = new EventEmitter<UserPreferencesEvents>();
  private cachedPreferences: UserPreferences | null = null;
  private userId: string | null = null;
  private isInitialized = false;

  constructor() {
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
        throw new AppError(
          ErrorType.AUTHENTICATION,
          'User not authenticated',
          { code: 'AUTH_REQUIRED' }
        );
      }
      
      this.userId = user.id;
      
      // Load preferences from the database
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .maybeSingle();
      
      if (error) throw new AppError(
        ErrorType.DATABASE,
        'Failed to load user preferences',
        { 
          code: 'PREFERENCES_LOAD_ERROR',
          originalError: error
        }
      );
      
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
    } catch (error) {
      console.error('Error initializing user preferences:', error);
      this.emit('preferences-error', error instanceof Error ? error : new Error(String(error)));
      
      // Fall back to defaults
      this.cachedPreferences = { ...DEFAULT_USER_PREFERENCES };
    }
  }
  
  /**
   * Create default preferences record for a new user
   */
  private async createDefaultPreferences(): Promise<void> {
    if (!this.userId) {
      throw new AppError(
        ErrorType.AUTHENTICATION,
        'User not authenticated',
        { code: 'AUTH_REQUIRED' }
      );
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
      console.error('Error creating default user preferences:', error);
      throw new AppError(
        ErrorType.DATABASE,
        'Failed to create user preferences',
        { 
          code: 'PREFERENCES_CREATE_ERROR',
          originalError: error
        }
      );
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
    const prefs = await this.getUserPreferences();
    return (prefs[key] as unknown as T) ?? defaultValue;
  }

  /**
   * Set a specific preference
   */
  async setPreference<T>(key: keyof UserPreferences, value: T): Promise<void> {
    if (!this.userId) {
      throw new AppError(
        ErrorType.AUTHENTICATION,
        'User not authenticated',
        { code: 'AUTH_REQUIRED' }
      );
    }
    
    // Make sure we're initialized
    if (!this.isInitialized) {
      await this.initUserPreferences();
    }
    
    // Update local cache
    this.cachedPreferences = {
      ...this.cachedPreferences || DEFAULT_USER_PREFERENCES,
      [key]: value
    };
    
    // Determine whether this is a UI preference or app preference
    const isUiPreference = [
      'uiDensity',
      'defaultView',
      'theme'
    ].includes(key as string);
    
    // Special case for theme which is stored directly
    if (key === 'theme') {
      const { error } = await supabase
        .from('user_preferences')
        .update({ 
          theme: value as string,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('Error updating theme preference:', error);
        throw new AppError(
          ErrorType.DATABASE,
          'Failed to save theme preference',
          { 
            code: 'PREFERENCES_UPDATE_ERROR',
            originalError: error
          }
        );
      }
      
      this.emit('theme-changed', value as string);
    } else {
      // Get current preferences from database
      const { data, error } = await supabase
        .from('user_preferences')
        .select(isUiPreference ? 'ui_preferences' : 'preferences')
        .eq('user_id', this.userId)
        .single();
      
      if (error) {
        console.error('Error fetching current preferences:', error);
        throw new AppError(
          ErrorType.DATABASE,
          'Failed to fetch current preferences',
          { 
            code: 'PREFERENCES_FETCH_ERROR',
            originalError: error
          }
        );
      }
      
      // Update the specific column
      const updatedPreferences = {
        ...(isUiPreference 
          ? data.ui_preferences || {} 
          : data.preferences || {}),
        [key]: value
      };
      
      // Save back to database
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({ 
          [isUiPreference ? 'ui_preferences' : 'preferences']: updatedPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId);
      
      if (updateError) {
        console.error('Error updating preferences:', updateError);
        throw new AppError(
          ErrorType.DATABASE,
          'Failed to save preference',
          { 
            code: 'PREFERENCES_UPDATE_ERROR',
            originalError: updateError
          }
        );
      }
    }
    
    // Emit change event
    this.emit('preferences-changed', { [key]: value });
  }

  /**
   * Set multiple preferences at once
   */
  async setPreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.userId) {
      throw new AppError(
        ErrorType.AUTHENTICATION,
        'User not authenticated',
        { code: 'AUTH_REQUIRED' }
      );
    }
    
    // Make sure we're initialized
    if (!this.isInitialized) {
      await this.initUserPreferences();
    }
    
    // Update local cache
    this.cachedPreferences = {
      ...this.cachedPreferences || DEFAULT_USER_PREFERENCES,
      ...preferences
    };
    
    // Get current preferences from database
    const { data, error } = await supabase
      .from('user_preferences')
      .select('preferences, ui_preferences, theme')
      .eq('user_id', this.userId)
      .single();
    
    if (error) {
      console.error('Error fetching current preferences:', error);
      throw new AppError(
        ErrorType.DATABASE,
        'Failed to fetch current preferences',
        { 
          code: 'PREFERENCES_FETCH_ERROR',
          originalError: error
        }
      );
    }
    
    // Separate preferences into UI, app, and theme
    const uiPrefs: Record<string, any> = {};
    const appPrefs: Record<string, any> = {};
    let theme = data.theme;
    
    for (const [key, value] of Object.entries(preferences)) {
      if (key === 'theme') {
        theme = value as string;
      } else if (['uiDensity', 'defaultView'].includes(key)) {
        uiPrefs[key] = value;
      } else {
        appPrefs[key] = value;
      }
    }
    
    // Update preferences in database
    const { error: updateError } = await supabase
      .from('user_preferences')
      .update({ 
        preferences: {
          ...data.preferences || {},
          ...appPrefs
        },
        ui_preferences: {
          ...data.ui_preferences || {},
          ...uiPrefs
        },
        theme: theme,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.userId);
    
    if (updateError) {
      console.error('Error updating preferences:', updateError);
      throw new AppError(
        ErrorType.DATABASE,
        'Failed to save preferences',
        { 
          code: 'PREFERENCES_UPDATE_ERROR',
          originalError: updateError
        }
      );
    }
    
    // Emit change event
    this.emit('preferences-changed', preferences);
    
    // Emit theme change event if theme was updated
    if (preferences.theme) {
      this.emit('theme-changed', preferences.theme);
    }
  }

  /**
   * Reset preferences to defaults
   */
  async resetToDefaults(): Promise<void> {
    if (!this.userId) {
      throw new AppError(
        ErrorType.AUTHENTICATION,
        'User not authenticated',
        { code: 'AUTH_REQUIRED' }
      );
    }
    
    // Update local cache
    this.cachedPreferences = { ...DEFAULT_USER_PREFERENCES };
    
    // Reset preferences in database
    const { error } = await supabase
      .from('user_preferences')
      .update({ 
        preferences: {},
        ui_preferences: {},
        theme: DEFAULT_USER_PREFERENCES.theme,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.userId);
    
    if (error) {
      console.error('Error resetting preferences:', error);
      throw new AppError(
        ErrorType.DATABASE,
        'Failed to reset preferences',
        { 
          code: 'PREFERENCES_RESET_ERROR',
          originalError: error
        }
      );
    }
    
    // Emit change event
    this.emit('preferences-changed', DEFAULT_USER_PREFERENCES);
    this.emit('theme-changed', DEFAULT_USER_PREFERENCES.theme);
  }

  /**
   * Get the effective theme based on preferences and system settings
   */
  async getEffectiveTheme(): Promise<'light' | 'dark'> {
    const preferences = await this.getUserPreferences();
    
    if (preferences.theme === 'light') {
      return 'light';
    } else if (preferences.theme === 'dark') {
      return 'dark';
    } else {
      // System preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
  }

  // IService interface implementation
  on<K extends keyof UserPreferencesEvents>(
    event: K, 
    callback: (data: UserPreferencesEvents[K]) => void
  ): () => void {
    return this.eventEmitter.on(event, callback);
  }

  off<K extends keyof UserPreferencesEvents>(
    event: K
  ): void {
    this.eventEmitter.off(event);
  }

  emit<K extends keyof UserPreferencesEvents>(
    event: K, 
    data?: UserPreferencesEvents[K]
  ): void {
    this.eventEmitter.emit(event, data);
  }
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService();
