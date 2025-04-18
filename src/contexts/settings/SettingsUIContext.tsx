import { createUIContext } from '../createUIContext';

export const { Provider: SettingsUIProvider, useUIContext: useSettingsUI } = createUIContext({
  displayName: 'Settings',
  initialState: {
    isSettingsModalOpen: false,
    activeSettingsTab: 'general',
    showAdvancedSettings: false,
  },
  actions: (_state, setState) => ({
    openSettingsModal: (initialTab?: string) => setState(s => ({
      ...s,
      isSettingsModalOpen: true,
      activeSettingsTab: initialTab ?? s.activeSettingsTab,
    })),
    closeSettingsModal: () => setState(s => ({ ...s, isSettingsModalOpen: false })),
    setActiveTab: (tab: string) => setState(s => ({ ...s, activeSettingsTab: tab })),
    toggleAdvancedSettings: () => setState(s => ({ ...s, showAdvancedSettings: !s.showAdvancedSettings })),
  }),
});
