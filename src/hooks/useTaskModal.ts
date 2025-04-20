import { useState, useCallback } from 'react';
import { useTaskActions } from './useTaskActions';

export interface UseTaskModalOptions {
  onModalAction?: (action: 'edit' | 'delete', taskId: string) => void;
}

export function useTaskModal(options: UseTaskModalOptions = {}) {
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Get task actions
  const { deleteTask } = useTaskActions({
    onSuccess: (action) => {
      if (action === 'delete') {
        closeDeleteModal();
      }
    },
  });

  // Open edit modal
  const openEditModal = useCallback(
    (taskId: string) => {
      setEditTaskId(taskId);
      setIsEditModalOpen(true);
      options.onModalAction?.('edit', taskId);
    },
    [options]
  );

  // Close edit modal
  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditTaskId(null);
  }, []);

  // Open delete modal
  const openDeleteModal = useCallback(
    (taskId: string) => {
      setTaskToDelete(taskId);
      setIsDeleteModalOpen(true);
      options.onModalAction?.('delete', taskId);
    },
    [options]
  );

  // Close delete modal
  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  }, []);

  // Confirm deletion
  const confirmDelete = useCallback(async () => {
    if (!taskToDelete) return;

    await deleteTask(taskToDelete);
    // The modal will be closed in the onSuccess callback
  }, [taskToDelete, deleteTask]);

  return {
    // Edit modal
    isEditModalOpen,
    editTaskId,
    openEditModal,
    closeEditModal,

    // Delete modal
    isDeleteModalOpen,
    taskToDelete,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
  };
}
