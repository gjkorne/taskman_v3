import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TimeSessionUIProvider, useTimeSessionUI } from './TimeSessionUIContext';

function TestComponent() {
  const {
    isTimerModalOpen,
    isHistoryModalOpen,
    selectedSessionId,
    timerDisplayMode,
    openTimerModal,
    closeTimerModal,
    openHistoryModal,
    closeHistoryModal,
    setTimerDisplayMode,
  } = useTimeSessionUI();

  return (
    <div>
      <span data-testid="timer-modal">{isTimerModalOpen ? 'open' : 'closed'}</span>
      <span data-testid="history-modal">{isHistoryModalOpen ? 'open' : 'closed'}</span>
      <span data-testid="selected">{selectedSessionId ?? 'none'}</span>
      <span data-testid="view">{timerDisplayMode}</span>
      <button data-testid="open-timer" onClick={openTimerModal}>OpenTimer</button>
      <button data-testid="close-timer" onClick={closeTimerModal}>CloseTimer</button>
      <button data-testid="open-history" onClick={() => openHistoryModal('sess123')}>OpenHistory</button>
      <button data-testid="close-history" onClick={closeHistoryModal}>CloseHistory</button>
      <button data-testid="set-full" onClick={() => setTimerDisplayMode('full')}>Full</button>
      <button data-testid="set-compact" onClick={() => setTimerDisplayMode('compact')}>Compact</button>
    </div>
  );
}

describe('TimeSessionUIContext', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('provides default UI state', () => {
    render(
      <TimeSessionUIProvider>
        <TestComponent />
      </TimeSessionUIProvider>
    );
    expect(screen.getByTestId('timer-modal')).toHaveTextContent('closed');
    expect(screen.getByTestId('history-modal')).toHaveTextContent('closed');
    expect(screen.getByTestId('selected')).toHaveTextContent('none');
    expect(screen.getByTestId('view')).toHaveTextContent('compact');
  });

  it('opens and closes timer modal', () => {
    render(
      <TimeSessionUIProvider>
        <TestComponent />
      </TimeSessionUIProvider>
    );
    fireEvent.click(screen.getByTestId('open-timer'));
    expect(screen.getByTestId('timer-modal')).toHaveTextContent('open');
    fireEvent.click(screen.getByTestId('close-timer'));
    expect(screen.getByTestId('timer-modal')).toHaveTextContent('closed');
  });

  it('opens and closes history modal with session ID and clears selection', () => {
    render(
      <TimeSessionUIProvider>
        <TestComponent />
      </TimeSessionUIProvider>
    );
    fireEvent.click(screen.getByTestId('open-history'));
    expect(screen.getByTestId('history-modal')).toHaveTextContent('open');
    expect(screen.getByTestId('selected')).toHaveTextContent('sess123');
    fireEvent.click(screen.getByTestId('close-history'));
    expect(screen.getByTestId('history-modal')).toHaveTextContent('closed');
    act(() => { vi.advanceTimersByTime(300); });
    expect(screen.getByTestId('selected')).toHaveTextContent('none');
  });

  it('sets display mode', () => {
    render(
      <TimeSessionUIProvider>
        <TestComponent />
      </TimeSessionUIProvider>
    );
    fireEvent.click(screen.getByTestId('set-full'));
    expect(screen.getByTestId('view')).toHaveTextContent('full');
    fireEvent.click(screen.getByTestId('set-compact'));
    expect(screen.getByTestId('view')).toHaveTextContent('compact');
  });
});
