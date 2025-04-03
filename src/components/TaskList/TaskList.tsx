import { forwardRef, useImperativeHandle, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { TaskEditForm } from './TaskEditForm';
import { FilterPanel } from './FilterPanel';
import { TaskContainer } from './TaskContainer';
import { SearchBar } from './SearchBar';
import { useTaskContext } from '../../contexts/TaskContext';
import { useTaskModal } from '../../hooks/useTaskModal';

// Define ref type for external access to TaskList methods
export interface TaskListRefType {
  refreshTaskList: () => Promise<void>;
}

interface TaskListProps {
  onTimerStateChange?: () => void;
}

export const TaskList = forwardRef<TaskListRefType, TaskListProps>(({ onTimerStateChange }, ref) => {
  // Get everything we need from the task context
  const { 
    filteredTasks,
    isLoading, 
    error,
    isRefreshing,
    refreshTasks,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    resetFilters
  } = useTaskContext();
  
  // Use our task modal hook
  const { 
    isEditModalOpen,
    editTaskId,
    openEditModal,
    closeEditModal,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete
  } = useTaskModal();

  // State for new task modal
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    refreshTaskList: refreshTasks
  }));

  // Render loading state
  if (isLoading && !isRefreshing) {
    return (
      <div className="max-w-full mx-auto px-4 py-6">
        <TaskContainer 
          isLoading={true}
          tasks={[]}
          viewMode={filters.viewMode}
        />
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 py-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center mt-2 sm:mt-0">
          <button
            onClick={() => refreshTasks()}
            className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            disabled={isRefreshing}
            aria-label="Refresh tasks"
          >
            <RefreshCw className="h-5 w-5 text-gray-600" />
          </button>
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search tasks..."
            className="w-full sm:w-64 md:w-80"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0 w-full sm:w-auto">
          <FilterPanel 
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
          />
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      <TaskContainer 
        tasks={filteredTasks}
        isLoading={isRefreshing}
        viewMode={filters.viewMode}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onTimerStateChange={onTimerStateChange}
      />
      
      {/* Task edit modal */}
      {isEditModalOpen && editTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
              <TaskEditForm 
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
      
      {/* New task modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
              <TaskEditForm 
                onClose={() => setIsNewTaskModalOpen(false)} 
                onSuccess={() => {
                  setIsNewTaskModalOpen(false);
                  refreshTasks();
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">Delete Task</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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
});
