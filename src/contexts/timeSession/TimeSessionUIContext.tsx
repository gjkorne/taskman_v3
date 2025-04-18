import { createUIContext } from '../createUIContext';

// (context types are inferred via createUIContext)

export const { Provider: TimeSessionUIProvider, useUIContext: useTimeSessionUI } = createUIContext({
  displayName: 'TimeSession',
  initialState: {
    isTimerModalOpen: false,
    isHistoryModalOpen: false,
    selectedSessionId: null as string | null,
    timerDisplayMode: 'compact' as 'compact' | 'full',
  },
  actions: (state, setState) => ({
    openTimerModal: () => setState(s => ({ ...s, isTimerModalOpen: true })),
    closeTimerModal: () => setState(s => ({ ...s, isTimerModalOpen: false })),
    openHistoryModal: (sessionId?: string) => setState(s => ({
      ...s,
      isHistoryModalOpen: true,
      selectedSessionId: sessionId ?? s.selectedSessionId,
    })),
    closeHistoryModal: () => {
      setState(s => ({ ...s, isHistoryModalOpen: false, selectedSessionId: null }));
      setTimeout(() => setState(s => ({ ...s, selectedSessionId: null })), 300);
    },
    setTimerDisplayMode: (mode: 'compact' | 'full') => setState(s => ({ ...s, timerDisplayMode: mode })),
  }),
});
