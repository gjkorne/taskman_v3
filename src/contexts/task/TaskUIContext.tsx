import { createUIContext } from '../createUIContext';

export const { Provider: TaskUIProvider, useUIContext: useTaskUI } =
  createUIContext({
    displayName: 'Task',
    initialState: {
      editTaskId: null as string | null,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      taskToDelete: null as string | null,
      viewMode: 'list' as 'list' | 'grid',
    },
    actions: (_state, setState) => ({
      openEditModal: (taskId: string) =>
        setState((s) => ({ ...s, editTaskId: taskId, isEditModalOpen: true })),
      closeEditModal: () => {
        setState((s) => ({ ...s, isEditModalOpen: false }));
        setTimeout(() => setState((s) => ({ ...s, editTaskId: null })), 300);
      },
      openDeleteModal: (taskId: string) =>
        setState((s) => ({
          ...s,
          taskToDelete: taskId,
          isDeleteModalOpen: true,
        })),
      closeDeleteModal: () => {
        setState((s) => ({ ...s, isDeleteModalOpen: false }));
        setTimeout(() => setState((s) => ({ ...s, taskToDelete: null })), 300);
      },
      setViewMode: (mode: 'list' | 'grid') =>
        setState((s) => ({ ...s, viewMode: mode })),
    }),
  });
