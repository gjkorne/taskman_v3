import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimeSessionUIProvider, useTimeSessionUI } from './TimeSessionUIContext';

describe('TimeSessionUIContext', () => {
  function wrapper({ children }: { children: React.ReactNode }) {
    return <TimeSessionUIProvider>{children}</TimeSessionUIProvider>;
  }

  it('provides default UI state', () => {
    const { result } = renderHook(() => useTimeSessionUI(), { wrapper });
    expect(result.current.isTimerModalOpen).toBe(false);
    expect(result.current.isHistoryModalOpen).toBe(false);
    expect(result.current.selectedSessionId).toBeNull();
    expect(result.current.timerDisplayMode).toBe('compact');
  });

  it('opens and closes timer modal', () => {
    const { result } = renderHook(() => useTimeSessionUI(), { wrapper });
    act(() => result.current.openTimerModal());
    expect(result.current.isTimerModalOpen).toBe(true);
    act(() => result.current.closeTimerModal());
    expect(result.current.isTimerModalOpen).toBe(false);
  });

  it('opens and closes history modal with session ID', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTimeSessionUI(), { wrapper });
    act(() => result.current.openHistoryModal('sess123'));
    expect(result.current.isHistoryModalOpen).toBe(true);
    expect(result.current.selectedSessionId).toBe('sess123');
    act(() => result.current.closeHistoryModal());
    expect(result.current.isHistoryModalOpen).toBe(false);
    // allow for cleanup delay
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.selectedSessionId).toBeNull();
    vi.useRealTimers();
  });

  it('sets display mode', () => {
    const { result } = renderHook(() => useTimeSessionUI(), { wrapper });
    act(() => result.current.setTimerDisplayMode('full'));
    expect(result.current.timerDisplayMode).toBe('full');
  });
});
