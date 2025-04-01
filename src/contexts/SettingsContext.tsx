import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of our settings
interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultView: 'list' | 'grid';
  defaultTaskSort: 'due_date' | 'priority' | 'created_at';
  notificationsEnabled: boolean;
  autoSave: boolean;
}

// Default settings
const defaultSettings: Settings = {
  theme: 'system',
  defaultView: 'list',
  defaultTaskSort: 'due_date',
  notificationsEnabled: true,
  autoSave: true,
};

// Context type definition
interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  saveAllSettings: () => void;
}

// Create the context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

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
        // Try to load each setting from localStorage
        const storedTheme = localStorage.getItem('theme') as Settings['theme'] | null;
        const storedDefaultView = localStorage.getItem('defaultView') as Settings['defaultView'] | null;
        const storedDefaultTaskSort = localStorage.getItem('defaultTaskSort') as Settings['defaultTaskSort'] | null;
        const storedNotificationsEnabled = localStorage.getItem('notificationsEnabled');
        const storedAutoSave = localStorage.getItem('autoSave');

        // Update settings state with stored values or defaults
        setSettings({
          theme: storedTheme || defaultSettings.theme,
          defaultView: storedDefaultView || defaultSettings.defaultView,
          defaultTaskSort: storedDefaultTaskSort || defaultSettings.defaultTaskSort,
          notificationsEnabled: storedNotificationsEnabled ? storedNotificationsEnabled === 'true' : defaultSettings.notificationsEnabled,
          autoSave: storedAutoSave ? storedAutoSave === 'true' : defaultSettings.autoSave,
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
    localStorage.setItem(key, value?.toString() || '');
  };

  // Function to save all settings
  const saveAllSettings = () => {
    // Save all settings to localStorage
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value?.toString() || '');
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
