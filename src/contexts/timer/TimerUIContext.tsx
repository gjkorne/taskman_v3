import { createUIContext } from '../createUIContext';

export type TimerViewMode = 'digital' | 'analog';

export const { Provider: TimerUIProvider, useUIContext: useTimerUI } = createUIContext({
  displayName: 'Timer',
  initialState: {
    isTimerOpen: false,
    viewMode: 'digital' as TimerViewMode,
  },
  actions: (_state, setState) => ({
    openTimer: () => setState(s => ({ ...s, isTimerOpen: true })),
    closeTimer: () => setState(s => ({ ...s, isTimerOpen: false })),
    setViewMode: (mode: TimerViewMode) => setState(s => ({ ...s, viewMode: mode })),
  }),
});
