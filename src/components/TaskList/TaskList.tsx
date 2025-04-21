import { forwardRef, useImperativeHandle } from 'react';
import { TaskListView } from './TaskListView';
import { useTaskApp } from '../../contexts/task/useTaskApp';

export interface TaskListRefType {
  refreshTaskList: () => Promise<void>;
}

interface TaskListProps {
  onTimerStateChange?: () => void;
}

export const TaskList = forwardRef<TaskListRefType, TaskListProps>(
  ({ onTimerStateChange }, ref) => {
    const {
      filteredTasks,
      isLoading,
      error,
      isRefreshing,
      refreshTasks,
      filters,
      setFilters,
      openEditModal,
      closeEditModal,
      openDeleteModal,
      closeDeleteModal,
      isEditModalOpen,
      editTaskId,
      isDeleteModalOpen,
      viewMode,
      deleteTask,
    } = useTaskApp();

    useImperativeHandle(ref, () => ({ refreshTaskList: refreshTasks }));

    return (
      <TaskListView
        filteredTasks={filteredTasks}
        isLoading={!isRefreshing && isLoading}
        filters={filters}
        setFilters={setFilters}
        refreshTasks={refreshTasks}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onTimerStateChange={onTimerStateChange}
        viewMode={viewMode}
        error={error}
        isEditModalOpen={isEditModalOpen}
        editTaskId={editTaskId}
        closeEditModal={closeEditModal}
        isDeleteModalOpen={isDeleteModalOpen}
        closeDeleteModal={closeDeleteModal}
        confirmDelete={deleteTask}
      />
    );
  }
);
