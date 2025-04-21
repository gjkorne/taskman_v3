/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import useTaskFilterHook, { filterTasksCore, defaultFilters } from './useTaskFilterHook';
import type { Task } from '../../types/task';

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Alpha task',
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
  },
  {
    id: '2',
    title: 'Beta task',
    description: '',
    status: 'completed',
    priority: 'high',
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
  },
];

// Mock useTaskData to return our mockTasks
vi.mock('./TaskDataContext', () => ({
  useTaskData: () => ({ tasks: mockTasks }),
}));

function TestComponent() {
  const { filteredTasks } = useTaskFilterHook();
  return <div data-testid="count">{filteredTasks.length}</div>;
}

describe('filterTasksCore', () => {
  it('returns all tasks when default filters and empty search', () => {
    expect(filterTasksCore(mockTasks, defaultFilters, '')).toEqual(mockTasks);
  });

  it('filters tasks by search query', () => {
    const filtered = filterTasksCore(mockTasks, defaultFilters, 'Alpha');
    expect(filtered).toEqual([mockTasks[0]]);
  });

  it('filters tasks by status', () => {
    const filters = { ...defaultFilters, status: ['pending'] };
    const filtered = filterTasksCore(mockTasks, filters, '');
    expect(filtered).toEqual([mockTasks[0]]);
  });

  it('filters tasks by priority', () => {
    const filters = { ...defaultFilters, priority: ['high'] };
    const filtered = filterTasksCore(mockTasks, filters, '');
    expect(filtered).toEqual([mockTasks[1]]);
  });

  it('filters tasks by due date', () => {
    const filters = { ...defaultFilters, dueDate: ['today'] };
    const filtered = filterTasksCore(mockTasks, filters, '');
    expect(filtered).toEqual([]);
  });

  it('filters tasks by multiple filters', () => {
    const filters = { ...defaultFilters, status: ['pending'], priority: ['low'] };
    const filtered = filterTasksCore(mockTasks, filters, '');
    expect(filtered).toEqual([mockTasks[0]]);
  });
});

describe('useTaskFilterHook', () => {
  it('provides filteredTasks equal to tasks length initially', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('count')).toHaveTextContent('2');
  });
});
