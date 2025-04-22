import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import Dashboard from '../Dashboard';

const mockFetchTasks = vi.fn();
const mockFetchSessions = vi.fn();

vi.mock('../../contexts/task', () => ({
  useTaskData: () => ({
    fetchTasks: mockFetchTasks,
    isLoading: true,
  }),
}));

vi.mock('../../contexts/timeSession', () => ({
  useTimeSession: () => ({
    fetchers: { fetchSessions: mockFetchSessions },
    queries: { isLoading: true },
  }),
}));

describe('Dashboard', () => {
  it('calls fetchTasks and fetchSessions on mount and shows spinner', () => {
    render(<Dashboard />);
    expect(mockFetchTasks).toHaveBeenCalled();
    expect(mockFetchSessions).toHaveBeenCalled();
    // Spinner should be rendered
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });
});
