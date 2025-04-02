import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of our settings
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'list' | 'grid';
  defaultTaskSort: 'due_date' | 'priority' | 'created_at';
  notificationsEnabled: boolean;
  autoSave: boolean;
  allowTaskSwitching: boolean; // Whether to switch tasks when starting a timer while another one is running
}

// Default settings
export const defaultSettings: Settings = {
  theme: 'system',
  defaultView: 'list',
  defaultTaskSort: 'due_date',
  notificationsEnabled: true,
  autoSave: true,
  allowTaskSwitching: false, // Default to the safe behavior of not auto-switching
};

// Context type definition
interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  saveAllSettings: () => void;
}

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Load a boolean setting from localStorage
 */
function loadBooleanSetting(key: string, defaultValue: boolean): boolean {
  const storedValue = localStorage.getItem(key);
  if (storedValue === null) return defaultValue;
  return storedValue === 'true';
}

/**
 * Load a string enum setting from localStorage
 */
function loadStringSetting<T extends string>(key: string, defaultValue: T, validValues: readonly T[]): T {
  const storedValue = localStorage.getItem(key);
  if (storedValue === null) return defaultValue;
  return validValues.includes(storedValue as T) ? (storedValue as T) : defaultValue;
}

/**
 * Save a setting to localStorage
 */
function saveSetting(key: string, value: string | boolean | number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
  }
}

// Provider component
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const loadSettings = () => {
      try {
        // Load settings with proper type safety
        const theme = loadStringSetting('theme', defaultSettings.theme, ['light', 'dark', 'system'] as const);
        const defaultView = loadStringSetting('defaultView', defaultSettings.defaultView, ['list', 'grid'] as const);
        const defaultTaskSort = loadStringSetting(
          'defaultTaskSort', 
          defaultSettings.defaultTaskSort, 
          ['due_date', 'priority', 'created_at'] as const
        );
        const notificationsEnabled = loadBooleanSetting('notificationsEnabled', defaultSettings.notificationsEnabled);
        const autoSave = loadBooleanSetting('autoSave', defaultSettings.autoSave);
        const allowTaskSwitching = loadBooleanSetting('allowTaskSwitching', defaultSettings.allowTaskSwitching);

        setSettings({
          theme,
          defaultView,
          defaultTaskSort,
          notificationsEnabled,
          autoSave,
          allowTaskSwitching
        });
      } catch (error) {
        console.error('Error loading settings:', error);
        // Fall back to defaults
        setSettings(defaultSettings);
      }
      
      setIsInitialized(true);
    };

    loadSettings();
  }, []);

  // Update theme when theme setting changes
  useEffect(() => {
    if (!isInitialized) return;

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
  }, [settings.theme, isInitialized]);

  // Function to update a specific setting
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Save to localStorage immediately
    saveSetting(key, value);
  };

  // Function to save all settings
  const saveAllSettings = () => {
    // Save all settings to localStorage
    Object.entries(settings).forEach(([key, value]) => {
      saveSetting(key, value);
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, saveAllSettings }}>
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
