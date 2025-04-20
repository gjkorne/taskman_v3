import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskUIProvider, useTaskUI } from './TaskUIContext';

function TestComponent() {
  const {
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
  } = useTaskUI();

  return (
    <div>
      <span data-testid="edit-modal">
        {isEditModalOpen ? 'open' : 'closed'}
      </span>
      <span data-testid="edit-id">{editTaskId ?? 'none'}</span>
      <span data-testid="delete-modal">
        {isDeleteModalOpen ? 'open' : 'closed'}
      </span>
      <span data-testid="delete-id">{taskToDelete ?? 'none'}</span>
      <span data-testid="view">{viewMode}</span>
      <button data-testid="open-edit" onClick={() => openEditModal('e1')} />
      <button data-testid="close-edit" onClick={closeEditModal} />
      <button data-testid="open-delete" onClick={() => openDeleteModal('d1')} />
      <button data-testid="close-delete" onClick={closeDeleteModal} />
      <button data-testid="grid" onClick={() => setViewMode('grid')} />
      <button data-testid="list" onClick={() => setViewMode('list')} />
    </div>
  );
}

describe('TaskUIContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('has correct default values', () => {
    render(
      <TaskUIProvider>
        <TestComponent />
      </TaskUIProvider>
    );
    expect(screen.getByTestId('edit-modal')).toHaveTextContent('closed');
    expect(screen.getByTestId('edit-id')).toHaveTextContent('none');
    expect(screen.getByTestId('delete-modal')).toHaveTextContent('closed');
    expect(screen.getByTestId('delete-id')).toHaveTextContent('none');
    expect(screen.getByTestId('view')).toHaveTextContent('list');
  });

  it('opens and closes edit modal', () => {
    render(
      <TaskUIProvider>
        <TestComponent />
      </TaskUIProvider>
    );
    fireEvent.click(screen.getByTestId('open-edit'));
    expect(screen.getByTestId('edit-modal')).toHaveTextContent('open');
    expect(screen.getByTestId('edit-id')).toHaveTextContent('e1');
    fireEvent.click(screen.getByTestId('close-edit'));
    expect(screen.getByTestId('edit-modal')).toHaveTextContent('closed');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId('edit-id')).toHaveTextContent('none');
  });

  it('opens and closes delete modal', () => {
    render(
      <TaskUIProvider>
        <TestComponent />
      </TaskUIProvider>
    );
    fireEvent.click(screen.getByTestId('open-delete'));
    expect(screen.getByTestId('delete-modal')).toHaveTextContent('open');
    expect(screen.getByTestId('delete-id')).toHaveTextContent('d1');
    fireEvent.click(screen.getByTestId('close-delete'));
    expect(screen.getByTestId('delete-modal')).toHaveTextContent('closed');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId('delete-id')).toHaveTextContent('none');
  });

  it('sets view mode', () => {
    render(
      <TaskUIProvider>
        <TestComponent />
      </TaskUIProvider>
    );
    fireEvent.click(screen.getByTestId('grid'));
    expect(screen.getByTestId('view')).toHaveTextContent('grid');
    fireEvent.click(screen.getByTestId('list'));
    expect(screen.getByTestId('view')).toHaveTextContent('list');
  });
});
