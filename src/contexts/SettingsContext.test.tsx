import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import {
  SettingsProvider,
  useSettings,
  defaultSettings,
} from './SettingsContext';
import { userPreferencesService } from '../services/userPreferencesService';

// Polyfill matchMedia for jsdom environment
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    }),
  });
});

// Spy on userPreferencesService methods
// and provide default behavior before each test
function setupServiceSpies() {
  vi.spyOn(userPreferencesService, 'getUserPreferences').mockResolvedValue(
    defaultSettings
  );
  vi.spyOn(userPreferencesService, 'setPreference').mockResolvedValue(
    undefined
  );
  vi.spyOn(userPreferencesService, 'setPreferences').mockResolvedValue(
    undefined
  );
  vi.spyOn(userPreferencesService, 'resetToDefaults').mockResolvedValue(
    undefined
  );
  vi.spyOn(userPreferencesService, 'on').mockReturnValue(() => {});
}

// Test component to exercise the hook
function TestComponent() {
  const {
    settings,
    isLoading,
    isSettingsModalOpen,
    openSettingsModal,
    closeSettingsModal,
    updateSetting,
    resetToDefaults,
  } = useSettings();
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="status">
        {isSettingsModalOpen ? 'open' : 'closed'}
      </span>
      <span data-testid="theme">{settings.theme}</span>
      <button data-testid="open" onClick={() => openSettingsModal()} />
      <button data-testid="close" onClick={() => closeSettingsModal()} />
      <button
        data-testid="update"
        onClick={() => updateSetting('theme', 'dark')}
      />
      <button data-testid="reset" onClick={resetToDefaults} />
    </div>
  );
}

describe('SettingsContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setupServiceSpies();
  });

  it('loads settings and toggles modal', async () => {
    const { getByTestId, findByText } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    expect(getByTestId('loading').textContent).toBe('loading');
    await findByText('loaded');
    expect(getByTestId('loading').textContent).toBe('loaded');
    fireEvent.click(getByTestId('open'));
    expect(getByTestId('status').textContent).toBe('open');
    fireEvent.click(getByTestId('close'));
    expect(getByTestId('status').textContent).toBe('closed');
  });

  it('updates theme and resets to default', async () => {
    const { getByTestId, findByText } = render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );
    await findByText('loaded');
    fireEvent.click(getByTestId('update'));
    expect(getByTestId('theme').textContent).toBe('dark');
    fireEvent.click(getByTestId('reset'));
    await waitFor(() => {
      expect(getByTestId('theme').textContent).toBe(defaultSettings.theme);
    });
  });
});
