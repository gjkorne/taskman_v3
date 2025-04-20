import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimerDataProvider, useTimerData } from './TimerDataContext';

// Since TimerDataContext uses a compatibility layer, we'll just smoke test the provider
vi.mock('../TimerCompat', () => ({
  useTimer: () => ({
    timerState: {
      status: 'idle',
      taskId: null,
      sessionId: null,
      startTime: null,
      elapsedTime: 0,
      previouslyElapsed: 0,
    },
    startTimer: vi.fn(),
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
    stopTimer: vi.fn(),
    resetTimer: vi.fn(),
    formatElapsedTime: (c: boolean) => (c ? 'x' : 'xx'),
    getDisplayTime: () => 'y',
    clearTimerStorage: vi.fn(),
  }),
}));

function TestComponent() {
  const { timerState, formatElapsedTime, getDisplayTime } = useTimerData();
  return (
    <div>
      <span data-testid="status">{timerState.status}</span>
      <span data-testid="format">{formatElapsedTime(true)}</span>
      <span data-testid="display">
        {getDisplayTime({
          id: 't',
          title: '',
          description: '',
          status: 'pending',
          priority: 'low',
          due_date: null,
          estimated_time: null,
          actual_time: null,
          tags: null,
          created_at: '',
          updated_at: null,
          created_by: null,
          is_deleted: false,
          is_starred: false,
          list_id: null,
          category_name: null,
          notes: null,
          checklist_items: null,
          note_type: null,
        })}
      </span>
    </div>
  );
}

describe('TimerDataContext', () => {
  it('provides compatibility layer outputs', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <TimerDataProvider>
          <TestComponent />
        </TimerDataProvider>
      </QueryClientProvider>
    );
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(screen.getByTestId('format')).toHaveTextContent('x');
    expect(screen.getByTestId('display')).toHaveTextContent('y');
  });
});
