import type { FC } from 'react';
import { FilterPanel } from './FilterPanel';
import { TaskContainer } from './TaskContainer';
import { QuickTaskEntry, TaskForm } from '../TaskForm';
import type { TaskFilter } from './FilterPanel';
import type { Task } from '../../types/task';

interface TaskListViewProps {
  filteredTasks: Task[];
  isLoading: boolean;
  filters: TaskFilter;
  setFilters: (filters: TaskFilter) => void;
  refreshTasks: () => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onTimerStateChange?: () => void;
  viewMode: 'list' | 'grid';
  error: string | null;
  isEditModalOpen: boolean;
  editTaskId: string | null;
  closeEditModal: () => void;
  isDeleteModalOpen: boolean;
  closeDeleteModal: () => void;
  confirmDelete: (taskId: string) => void;
}

export const TaskListView: FC<TaskListViewProps> = ({
  filteredTasks,
  isLoading,
  filters,
  setFilters,
  refreshTasks,
  onEdit,
  onDelete,
  onTimerStateChange,
  viewMode,
  error,
  isEditModalOpen,
  editTaskId,
  closeEditModal,
  isDeleteModalOpen,
  closeDeleteModal,
  confirmDelete,
}) => (
  <div className="w-full mx-auto px-0 py-1 sm:px-6 sm:py-8 relative bg-gray-50 shadow-lg">
    <FilterPanel
      filters={filters}
      onChange={setFilters}
      filteredCount={filteredTasks.length}
    />
    <div className="my-4">
      <QuickTaskEntry onTaskCreated={refreshTasks} />
    </div>
    <TaskContainer
      tasks={filteredTasks}
      isLoading={isLoading}
      viewMode={viewMode}
      onEdit={onEdit}
      onDelete={onDelete}
      onTimerStateChange={onTimerStateChange}
    />
    {error && (
      <div className="bg-red-50 border-l-4 border-red-500 p-2 mb-2 text-red-700">
        <p>{error}</p>
      </div>
    )}
    {isEditModalOpen && editTaskId && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-2">Edit Task</h2>
            <TaskForm
              mode="edit"
              taskId={editTaskId}
              onClose={closeEditModal}
              onSuccess={() => {
                closeEditModal();
                refreshTasks();
              }}
            />
          </div>
        </div>
      </div>
    )}
    {isDeleteModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-2">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-1">Delete Task</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeDeleteModal}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => editTaskId && confirmDelete(editTaskId)}
                className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
