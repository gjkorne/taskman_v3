import useSettingsDataHook, { defaultSettings, Settings as SettingsType } from './useSettingsDataHook';
import { createDataContext } from '../createDataContext';

export type Settings = SettingsType;
export { defaultSettings };

export const { Provider: SettingsDataProvider, useDataContext: useSettingsData } =
  createDataContext(useSettingsDataHook, 'SettingsData');
