import { forwardRef, useImperativeHandle } from 'react';
import { TaskListView } from './TaskListView';
import { useTaskData } from '../../contexts/task/TaskDataContext';
import { useTaskUI } from '../../contexts/task/TaskUIContext';
import { useFilterSort } from '../../contexts/FilterSortContext';

export interface TaskListRefType {
  refreshTaskList: () => Promise<void>;
}

interface TaskListProps {
  onTimerStateChange?: () => void;
}

export const TaskList = forwardRef<TaskListRefType, TaskListProps>(
  ({ onTimerStateChange }, ref) => {
    const { isLoading, error, isRefreshing, refreshTasks, deleteTask } = useTaskData();
    const { openEditModal, closeEditModal, openDeleteModal, closeDeleteModal, isEditModalOpen, editTaskId, isDeleteModalOpen, viewMode } = useTaskUI();

    const { filteredTasks, filters, setFilters } = useFilterSort();

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
