import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { userPreferencesService } from '../../services/userPreferencesService';

// Define the shape of our settings
export interface Settings {
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
}

// Default settings
export const defaultSettings: Settings = {
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

// Settings Data Context type definition
interface SettingsDataContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  saveAllSettings: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  resetToDefaults: () => Promise<void>;
}

// Create the context
export const SettingsDataContext = createContext<SettingsDataContextType | undefined>(undefined);

// Provider component
interface SettingsDataProviderProps {
  children: ReactNode;
}

export const SettingsDataProvider = ({ children }: SettingsDataProviderProps) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load settings from database on initial render
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all preferences from the service
        const userPrefs = await userPreferencesService.getUserPreferences();
        
        // Map from UserPreferences to our Settings type
        setSettings(userPrefs as Settings);
        setIsDirty(false);
      } catch (error) {
        console.error('Error loading settings:', error);
        setError(error instanceof Error ? error : new Error('Failed to load settings'));
        
        // Fall back to defaults
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
    
    // Set up event listeners for preference changes from other sources
    const unsubscribe = userPreferencesService.on('preferences-changed', (updatedPrefs) => {
      setSettings(prevSettings => ({
        ...prevSettings,
        ...updatedPrefs
      }));
      setIsDirty(false);
    });

    return () => {
      // Clean up event listener on unmount
      unsubscribe();
    };
  }, []);

  // Update a single setting
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value
    }));
    setIsDirty(true);
    
    // If autoSave is enabled, save the setting immediately
    if (settings.autoSave) {
      userPreferencesService.setPreference(key as string, value);
    }
  };

  // Save all settings to the database
  const saveAllSettings = async () => {
    try {
      await userPreferencesService.setPreferences(settings);
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error instanceof Error ? error : new Error('Failed to save settings'));
    }
  };

  // Reset all settings to defaults
  const resetToDefaults = async () => {
    try {
      setSettings(defaultSettings);
      await userPreferencesService.resetToDefaults();
      setIsDirty(false);
    } catch (error) {
      console.error('Error resetting settings:', error);
      setError(error instanceof Error ? error : new Error('Failed to reset settings'));
    }
  };

  // AutoSave effect - save settings when they change if autoSave is enabled
  useEffect(() => {
    // Skip on first render
    if (isLoading) return;
    
    // Save settings when they change if autoSave is enabled and there are changes
    if (settings.autoSave && isDirty) {
      saveAllSettings();
    }
  }, [settings, isDirty, isLoading]);

  // Apply theme when it changes
  useEffect(() => {
    const applyTheme = () => {
      const html = document.documentElement;
      
      // Remove any existing theme classes
      html.classList.remove('theme-light', 'theme-dark');
      
      if (settings.theme === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
      } else {
        // Use explicit setting
        html.classList.add(`theme-${settings.theme}`);
      }
    };
    
    applyTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (settings.theme === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [settings.theme]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<SettingsDataContextType>(() => ({
    settings,
    updateSetting,
    saveAllSettings,
    isLoading,
    error,
    resetToDefaults
  }), [settings, isLoading, error, isDirty]);

  return (
    <SettingsDataContext.Provider value={contextValue}>
      {children}
    </SettingsDataContext.Provider>
  );
};

// Custom hook to use the settings data context
export function useSettingsData(): SettingsDataContextType {
  const context = useContext(SettingsDataContext);
  
  if (context === undefined) {
    throw new Error('useSettingsData must be used within a SettingsDataProvider');
  }
  
  return context;
}
