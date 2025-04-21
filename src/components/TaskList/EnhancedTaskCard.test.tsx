import { vi } from 'vitest';

// Mock useTaskApp facade
vi.mock('../../contexts/task/useTaskApp', () => ({
  useTaskApp: () => ({
    refreshTasks: vi.fn(),
    updateTask: vi.fn(),
  }),
}));

// Mock useTaskActions hook
vi.mock('../../hooks/useTaskActions', () => ({
  useTaskActions: () => ({ updateTaskStatus: vi.fn() }),
}));

// Mock timer context
vi.mock('../../contexts/TimerCompat', () => ({
  useTimer: () => ({
    timerState: { taskId: '', status: 'idle' },
    stopTimer: vi.fn(),
  }),
}));

// Mock categories context
vi.mock('../../contexts/category', () => ({
  useCategories: () => ({ categories: [] }),
}));

// Mock TimerControls to bypass SettingsProvider requirement
vi.mock('../Timer/TimerControls', () => ({
  TimerControls: () => <div data-testid="timer-controls" />,
}));

// Mock SettingsCompat
vi.mock('../../contexts/SettingsCompat', () => ({
  useSettings: () => ({ settings: { allowTaskSwitching: false } }),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EnhancedTaskCard } from './EnhancedTaskCard';
import { TaskStatus } from '../../types/task';

describe('EnhancedTaskCard', () => {
  const sampleTask: any = {
    id: '1',
    title: 'Test Task',
    description: 'A sample task',
    status: TaskStatus.ACTIVE,
    estimated_time: '1 hour',
    due_date: '2025-05-01T12:00:00.000Z',
    is_starred: false,
    priority: 'low',
    created_at: '',
    updated_at: '',
    category_name: 'Work',
  };

  it('renders title, estimated time and due date', () => {
    render(<EnhancedTaskCard task={sampleTask} index={0} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText(/1h/)).toBeInTheDocument();
    expect(screen.getByText(/Due: 05\/01/)).toBeInTheDocument();
  });

  it('calls onEdit when clicked', () => {
    const onEdit = vi.fn();
    render(<EnhancedTaskCard task={sampleTask} index={0} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Test Task'));
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
