import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userPreferencesService } from '../services/userPreferencesService';

// Define the shape of our settings
// This type is preserved for backwards compatibility with existing components
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'list' | 'grid';
  defaultTaskSort: 'due_date' | 'priority' | 'created_at';
  notificationsEnabled: boolean;
  autoSave: boolean;
  allowTaskSwitching: boolean; // Whether to switch tasks when starting a timer while another one is running
  hiddenCategories: string[]; // Array of category IDs that should be hidden
  hideDefaultCategories: boolean; // Whether to hide all default categories
  quickTaskCategories: string[]; // Categories to show in quick task entry
  defaultQuickTaskCategory: string; // Default selected category for quick task entry
  uiDensity: 'default' | 'compact'; // UI density preference
  pomodoroWorkDuration: number; // Duration of a work session in minutes
  pomodoroBreakDuration: number; // Duration of a break session in minutes
}

// Default settings
export const defaultSettings: Settings = {
  theme: 'system',
  defaultView: 'list',
  defaultTaskSort: 'due_date',
  notificationsEnabled: true,
  autoSave: true,
  allowTaskSwitching: true, // Enable auto-switching by default
  hiddenCategories: [], // No hidden categories by default
  hideDefaultCategories: false, // Don't hide default categories by default
  quickTaskCategories: ['personal', 'family', 'work'], // Updated default categories
  defaultQuickTaskCategory: 'personal', // Default to personal category
  uiDensity: 'default', // Default to regular spacing and font size
  pomodoroWorkDuration: 25, // Default Pomodoro work duration (minutes)
  pomodoroBreakDuration: 5, // Default Pomodoro break duration (minutes)
};

// Context type definition
interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  saveAllSettings: () => void;
  isLoading: boolean;
  error: Error | null;
  resetToDefaults: () => Promise<void>;
}

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load settings from database on initial render
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all preferences from the service
        const userPrefs = await userPreferencesService.getUserPreferences();
        
        // Map from UserPreferences to our Settings type (they have the same shape)
        setSettings(userPrefs as Settings);
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
    });

    return () => {
      // Clean up event listener on unmount
      unsubscribe();
    };
  }, []);

  // Update theme when theme setting changes
  useEffect(() => {
    // Apply theme to document
    const applyTheme = () => {
      const html = document.documentElement;
      
      if (settings.theme === 'dark' || 
         (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system theme changes if theme is set to 'system'
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  // Function to update a single setting
  const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    try {
      // Update state immediately for responsive UI
      setSettings(prevSettings => ({
        ...prevSettings,
        [key]: value
      }));
      
      // Save to database through service
      await userPreferencesService.setPreference(key, value);
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      setError(error instanceof Error ? error : new Error(`Failed to update ${key}`));
      
      // Revert to previous value in case of error
      userPreferencesService.getUserPreferences()
        .then(prefs => setSettings(prefs as Settings))
        .catch(err => console.error('Error reverting settings:', err));
    }
  };

  // Function to save all settings at once
  const saveAllSettings = async () => {
    try {
      await userPreferencesService.setPreferences(settings);
    } catch (error) {
      console.error('Error saving all settings:', error);
      setError(error instanceof Error ? error : new Error('Failed to save settings'));
    }
  };
  
  // Function to reset to default settings
  const resetToDefaults = async () => {
    try {
      await userPreferencesService.resetToDefaults();
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
      setError(error instanceof Error ? error : new Error('Failed to reset settings'));
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    settings,
    updateSetting,
    saveAllSettings,
    isLoading,
    error,
    resetToDefaults
  }), [settings, isLoading, error]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
