import { forwardRef, useImperativeHandle } from 'react';
import { RefreshCw } from 'lucide-react';
import { TaskEditForm } from './TaskEditForm';
import { FilterPanel } from './FilterPanel';
import { TaskContainer } from './TaskContainer';
import { SearchBar } from './SearchBar';
import { useTaskContext } from '../../contexts/TaskContext';

// Define ref type for external access to TaskList methods
export interface TaskListRefType {
  refreshTaskList: () => Promise<void>;
}

export const TaskList = forwardRef<TaskListRefType>((_, ref) => {
  // Get everything we need from the task context
  const { 
    filteredTasks,
    isLoading, 
    error,
    isRefreshing,
    refreshTasks,
    isEditModalOpen,
    editTaskId,
    closeEditModal,
    isDeleteModalOpen,
    taskToDelete,
    closeDeleteModal,
    deleteTask,
    openEditModal,
    openDeleteModal,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    resetFilters
  } = useTaskContext();

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    refreshTaskList: refreshTasks
  }));

  // Render loading state
  if (isLoading && !isRefreshing) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Tasks</h1>
        <TaskContainer 
          isLoading={true}
          tasks={[]}
          viewMode={filters.viewMode}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex items-center mt-2 sm:mt-0">
          <button
            onClick={() => refreshTasks()}
            className="flex items-center text-gray-600 hover:text-indigo-600 mr-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
          />

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Task Container */}
          <TaskContainer
            isLoading={isLoading}
            tasks={filteredTasks}
            viewMode={filters.viewMode}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />

          {filteredTasks.length === 0 && !isLoading && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
              <p className="mt-2 text-gray-500">
                {filteredTasks.length === 0 
                  ? 'Try adjusting your filters or search query'
                  : 'Create your first task to get started'
                }
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        <div className="order-first md:order-last">
          <FilterPanel 
            filters={filters} 
            onChange={setFilters}
            taskCount={filteredTasks.length}
            filteredCount={filteredTasks.length}
            onReset={resetFilters}
          />
        </div>
      </div>

      {/* Task Edit Modal */}
      {isEditModalOpen && editTaskId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Edit Task</h2>
            </div>
            <div className="p-4">
              <TaskEditForm
                taskId={editTaskId}
                onSaved={() => {
                  // Refresh tasks after saving
                  refreshTasks();
                  closeEditModal();
                }}
                onCancel={closeEditModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Confirm Delete</h2>
            </div>
            <div className="p-4">
              <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            </div>
            <div className="flex justify-end p-4 space-x-2 border-t">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => taskToDelete && deleteTask(taskToDelete)}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
