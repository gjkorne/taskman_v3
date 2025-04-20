import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import { TimerUIProvider, useTimerUI } from './TimerUIContext';

function TestComponent() {
  const { isTimerOpen, openTimer, closeTimer, viewMode, setViewMode } =
    useTimerUI();
  return (
    <div>
      <span data-testid="open">{isTimerOpen.toString()}</span>
      <span data-testid="view">{viewMode}</span>
      <button data-testid="open-btn" onClick={() => openTimer()}>
        Open
      </button>
      <button data-testid="close-btn" onClick={() => closeTimer()}>
        Close
      </button>
      <button data-testid="mode-digital" onClick={() => setViewMode('digital')}>
        Digital
      </button>
      <button data-testid="mode-analog" onClick={() => setViewMode('analog')}>
        Analog
      </button>
    </div>
  );
}

describe('TimerUIContext', () => {
  it('provides default values', () => {
    render(
      <TimerUIProvider>
        <TestComponent />
      </TimerUIProvider>
    );
    expect(screen.getByTestId('open')).toHaveTextContent('false');
    expect(screen.getByTestId('view')).toHaveTextContent('digital');
  });

  it('opens/closes timer and sets view mode', () => {
    render(
      <TimerUIProvider>
        <TestComponent />
      </TimerUIProvider>
    );
    fireEvent.click(screen.getByTestId('open-btn'));
    expect(screen.getByTestId('open')).toHaveTextContent('true');
    fireEvent.click(screen.getByTestId('close-btn'));
    expect(screen.getByTestId('open')).toHaveTextContent('false');
    fireEvent.click(screen.getByTestId('mode-analog'));
    expect(screen.getByTestId('view')).toHaveTextContent('analog');
    fireEvent.click(screen.getByTestId('mode-digital'));
    expect(screen.getByTestId('view')).toHaveTextContent('digital');
  });
});
