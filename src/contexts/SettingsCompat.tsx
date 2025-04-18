import { useSettings as useUnifiedSettings } from './SettingsContext';

/**
 * Compatibility layer for the old useSettings hook
 * This allows components using the old API to continue working
 * while we transition to the new context structure
 */
export function useSettings() {
  return useUnifiedSettings();
}
