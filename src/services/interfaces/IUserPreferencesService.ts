import { IService } from './IService';
import { ServiceError } from '../BaseService';

/**
 * Events that can be emitted by the UserPreferencesService
 */
export interface UserPreferencesEvents {
  'preferences-changed': Record<string, any>;
  'preferences-loaded': Record<string, any>;
  'preferences-error': ServiceError;
  'theme-changed': string;
}

/**
 * Interface for user application preferences
 */
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'list' | 'grid';
  defaultTaskSort: 'due_date' | 'priority' | 'created_at';
  notificationsEnabled: boolean;
  autoSave: boolean;
  allowTaskSwitching: boolean;
  hiddenCategories: string[];
  hideDefaultCategories: boolean;
  quickTaskCategories: string[];
  defaultQuickTaskCategory: string;
  uiDensity: 'default' | 'compact';
  [key: string]: any; // Allow for extension
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  defaultView: 'list',
  defaultTaskSort: 'due_date',
  notificationsEnabled: true,
  autoSave: true,
  allowTaskSwitching: false,
  hiddenCategories: [],
  hideDefaultCategories: false,
  quickTaskCategories: ['work', 'personal', 'childcare', 'other'],
  defaultQuickTaskCategory: 'work',
  uiDensity: 'default',
};

/**
 * Interface for the UserPreferencesService
 * Provides methods to manage user preferences with cross-device sync
 */
export interface IUserPreferencesService
  extends IService<UserPreferencesEvents> {
  /**
   * Get all user preferences or a default if none exist
   */
  getUserPreferences(): Promise<UserPreferences>;

  /**
   * Get a specific preference value
   * @param key The preference key
   * @param defaultValue Default value if preference doesn't exist
   */
  getPreference<T>(key: keyof UserPreferences, defaultValue: T): Promise<T>;

  /**
   * Set a specific preference value
   * @param key The preference key
   * @param value The new value
   */
  setPreference<T>(key: keyof UserPreferences, value: T): Promise<void>;

  /**
   * Set multiple preferences at once
   * @param preferences Object with preferences to update
   */
  setPreferences(preferences: Partial<UserPreferences>): Promise<void>;

  /**
   * Reset all preferences to default values
   */
  resetToDefaults(): Promise<void>;

  /**
   * Get the current theme setting
   * Takes into account user preferences and system settings
   */
  getEffectiveTheme(): Promise<'light' | 'dark'>;
}
