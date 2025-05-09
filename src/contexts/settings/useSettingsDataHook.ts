import { useState, useEffect, useCallback } from 'react';
import { userPreferencesService } from '../../services/userPreferencesService';

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

/**
 * Utility to handle errors in a consistent way.
 */
function handleError(setError: (err: Error) => void, message: string) {
  return (err: unknown) => {
    const error = err instanceof Error ? err : new Error(message);
    setError(error);
    // Optionally, add a toast/notification system here
  };
}

/**
 * Hook to manage user settings (preferences) with grouped return values.
 */
export default function useSettingsDataHook() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userPrefs = await userPreferencesService.getUserPreferences();
        setSettings(userPrefs as Settings);
        setIsDirty(false);
      } catch (err) {
        handleError(setError, 'Failed to load settings')(err);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
    const unsubscribe = userPreferencesService.on(
      'preferences-changed',
      (updatedPrefs) => {
        setSettings((prev) => ({ ...prev, ...updatedPrefs }));
        setIsDirty(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
      if (settings.autoSave) {
        userPreferencesService.setPreference(key as string, value);
      }
    },
    [settings.autoSave]
  );

  const saveAllSettings = useCallback(async () => {
    try {
      await userPreferencesService.setPreferences(settings);
      setIsDirty(false);
    } catch (err) {
      handleError(setError, 'Failed to save settings')(err);
    }
  }, [settings]);

  const resetToDefaults = useCallback(async () => {
    try {
      setSettings(defaultSettings);
      await userPreferencesService.resetToDefaults();
      setIsDirty(false);
    } catch (err) {
      handleError(setError, 'Failed to reset settings')(err);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (settings.autoSave && isDirty) {
      saveAllSettings();
    }
  }, [settings, isDirty, isLoading, saveAllSettings]);

  useEffect(() => {
    const applyTheme = () => {
      const html = document.documentElement;
      html.classList.remove('theme-light', 'theme-dark');
      if (settings.theme === 'dark') html.classList.add('theme-dark');
      else if (settings.theme === 'light') html.classList.add('theme-light');
    };
    applyTheme();
  }, [settings.theme]);

  return {
    queries: {
      settings,
      isLoading,
      error,
      isDirty,
    },
    mutations: {
      updateSetting,
      saveAllSettings,
      resetToDefaults,
    },
  };
}
