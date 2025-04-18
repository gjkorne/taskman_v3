import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { TaskDataProvider, useTaskData } from './TaskDataContext';
import { Task } from '../../types/task';

// Mock toast hook
vi.mock('../../components/Toast/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }));

// Mock task service methods
const mockTasks = [{ id: 't1', title: 'Test', status: 'pending', created_at: '', updated_at: '' } as Task];
const updatedTask = { ...mockTasks[0], status: 'completed' } as Task;
const taskServiceMock = {
  getTasks: vi.fn().mockResolvedValue(mockTasks),
  refreshTasks: vi.fn().mockResolvedValue(undefined),
  sync: vi.fn().mockResolvedValue(undefined),
  updateTaskStatus: vi.fn().mockResolvedValue(updatedTask),
  updateTask: vi.fn().mockResolvedValue(updatedTask),
  deleteTask: vi.fn().mockResolvedValue(undefined),
  hasUnsyncedChanges: vi.fn().mockResolvedValue(false),
};

beforeEach(() => {
  vi.spyOn(ServiceRegistry, 'getTaskService').mockReturnValue(taskServiceMock as any);
});

type ReactElement = import('react').ReactElement;
function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TaskDataProvider>{ui}</TaskDataProvider>
    </QueryClientProvider>
  );
}

function TestComponent() {
  const {
    tasks,
    isLoading,
    fetchTasks,
    refreshTasks,
    syncTasks,
    updateTaskStatus,
    deleteTask,
  } = useTaskData();

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="count">{tasks.length}</span>
      <button data-testid="fetch" onClick={() => fetchTasks()} />
      <button data-testid="refresh" onClick={() => refreshTasks()} />
      <button data-testid="sync" onClick={() => syncTasks()} />
      <button data-testid="update" onClick={() => updateTaskStatus('t1', 'completed')} />
      <button data-testid="delete" onClick={() => deleteTask('t1')} />
    </div>
  );
}

describe('TaskDataContext', () => {
  it('loads tasks on mount', async () => {
    renderWithClient(<TestComponent />);
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('loaded'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(taskServiceMock.getTasks).toHaveBeenCalled();
  });

  it('invokes service methods on actions', async () => {
    renderWithClient(<TestComponent />);
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('loaded'));

    fireEvent.click(screen.getByTestId('fetch'));
    expect(taskServiceMock.getTasks).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('refresh'));
    expect(taskServiceMock.getTasks).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('sync'));
    await waitFor(() => expect(taskServiceMock.sync).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('update'));
    await waitFor(() => expect(taskServiceMock.updateTaskStatus).toHaveBeenCalledWith('t1', 'completed'));

    fireEvent.click(screen.getByTestId('delete'));
    await waitFor(() => expect(taskServiceMock.deleteTask).toHaveBeenCalledWith('t1'));
  });
});
