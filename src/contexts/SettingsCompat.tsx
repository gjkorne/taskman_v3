import { useSettingsData } from './settings/SettingsDataContext';
import { useSettingsUI } from './settings/SettingsUIContext';

/**
 * Compatibility layer for the old useSettings hook
 * This allows components using the old API to continue working
 * while we transition to the new context structure
 */
export function useSettings() {
  // Get data and UI state from our new contexts
  const {
    settings,
    updateSetting,
    saveAllSettings,
    isLoading,
    error,
    resetToDefaults
  } = useSettingsData();
  
  // Access UI context but we don't destructure it since the old context
  // doesn't have UI-specific properties
  useSettingsUI();
  
  // Combine all the functionality to match the old context API
  return {
    settings,
    updateSetting,
    saveAllSettings,
    isLoading,
    error,
    resetToDefaults
  };
}
