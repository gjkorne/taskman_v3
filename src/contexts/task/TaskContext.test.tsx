import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceRegistry } from '../../services/ServiceRegistry';
import { TaskProvider, useTaskContext } from './index';
import { Task } from '../../types/task';

// Mock toast hook
vi.mock('../../components/Toast/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }));

const mockTasks = [{ id: 't1', title: 'Test', description: '', status: 'pending', priority: 'low', due_date: null, estimated_time: null, actual_time: null, tags: null, created_at: '', updated_at: null, created_by: null, is_deleted: false, is_starred: false, list_id: null, category_name: null, notes: null, checklist_items: null, note_type: null } as Task];
const updatedTask = { ...mockTasks[0], status: 'completed' } as Task;

function setupServiceSpies() {
  const svc = {
    getTasks: vi.fn().mockResolvedValue(mockTasks),
    refreshTasks: vi.fn().mockResolvedValue(undefined),
    sync: vi.fn().mockResolvedValue(undefined),
    updateTaskStatus: vi.fn().mockResolvedValue(updatedTask),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    hasUnsyncedChanges: vi.fn().mockResolvedValue(false),
  };
  vi.spyOn(ServiceRegistry, 'getTaskService').mockReturnValue(svc as any);
  return svc;
}

beforeEach(() => { vi.restoreAllMocks(); });

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

function TestComponent() {
  const {
    tasks,
    isLoading,
    editTaskId,
    isEditModalOpen,
    isDeleteModalOpen,
    taskToDelete,
    viewMode,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    setViewMode,
    updateTaskStatus,
    deleteTask,
  } = useTaskContext();

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="count">{tasks.length}</span>
      <span data-testid="edit-modal">{isEditModalOpen ? 'open' : 'closed'}</span>
      <span data-testid="edit-id">{editTaskId ?? 'none'}</span>
      <span data-testid="delete-modal">{isDeleteModalOpen ? 'open' : 'closed'}</span>
      <span data-testid="delete-id">{taskToDelete ?? 'none'}</span>
      <span data-testid="view">{viewMode}</span>
      <button data-testid="open-edit" onClick={() => openEditModal('t1')} />
      <button data-testid="close-edit" onClick={closeEditModal} />
      <button data-testid="open-delete" onClick={() => openDeleteModal('t1')} />
      <button data-testid="close-delete" onClick={closeDeleteModal} />
      <button data-testid="grid" onClick={() => setViewMode('grid')} />
      <button data-testid="list" onClick={() => setViewMode('list')} />
      <button data-testid="update" onClick={() => updateTaskStatus('t1', 'completed')} />
      <button data-testid="delete" onClick={() => deleteTask('t1')} />
    </div>
  );
}

describe('TaskContext (merged data+UI)', () => {
  it('loads data and default UI state', async () => {
    const svc = setupServiceSpies();
    renderWithClient(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );
    // Wait for tasks to load
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
    expect(svc.getTasks).toHaveBeenCalled();
    expect(screen.getByTestId('edit-modal')).toHaveTextContent('closed');
    expect(screen.getByTestId('edit-id')).toHaveTextContent('none');
    expect(screen.getByTestId('delete-modal')).toHaveTextContent('closed');
    expect(screen.getByTestId('delete-id')).toHaveTextContent('none');
    expect(screen.getByTestId('view')).toHaveTextContent('list');
  });

  it('handles UI actions and data operations', async () => {
    const svc = setupServiceSpies();
    renderWithClient(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );
    // Wait for tasks to load
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByTestId('open-edit'));
    expect(screen.getByTestId('edit-modal')).toHaveTextContent('open');
    expect(screen.getByTestId('edit-id')).toHaveTextContent('t1');

    fireEvent.click(screen.getByTestId('close-edit'));
    expect(screen.getByTestId('edit-modal')).toHaveTextContent('closed');
    await waitFor(() => expect(screen.getByTestId('edit-id')).toHaveTextContent('none'));

    fireEvent.click(screen.getByTestId('open-delete'));
    expect(screen.getByTestId('delete-modal')).toHaveTextContent('open');
    expect(screen.getByTestId('delete-id')).toHaveTextContent('t1');

    fireEvent.click(screen.getByTestId('close-delete'));
    expect(screen.getByTestId('delete-modal')).toHaveTextContent('closed');
    await waitFor(() => expect(screen.getByTestId('delete-id')).toHaveTextContent('none'));

    fireEvent.click(screen.getByTestId('grid'));
    expect(screen.getByTestId('view')).toHaveTextContent('grid');
    fireEvent.click(screen.getByTestId('list'));
    expect(screen.getByTestId('view')).toHaveTextContent('list');

    fireEvent.click(screen.getByTestId('update'));
    await waitFor(() => expect(svc.updateTaskStatus).toHaveBeenCalledWith('t1', 'completed'));

    fireEvent.click(screen.getByTestId('delete'));
    await waitFor(() => expect(svc.deleteTask).toHaveBeenCalledWith('t1'));
  });
});
