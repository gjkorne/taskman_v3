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
      {/* Compact and improved search/filter bar */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Left side - Search with integrated refresh */}
          <div className="flex-grow flex items-center min-w-[260px] max-w-md">
            <SearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tasks..."
              className="flex-grow"
            />
            <button
              onClick={() => refreshTasks()}
              className={`ml-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
              disabled={isRefreshing}
              aria-label="Refresh tasks"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          
          {/* Right side - Compact filter */}
          <div className="flex-shrink-0 flex items-center ml-auto">
            <FilterPanel 
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
            />
          </div>
        </div>
      </div>
      
      {/* Quick Category Filters */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <h3 className="text-sm font-medium text-gray-600">Quick Filters:</h3>
          {filters.category.length > 0 && (
            <button
              onClick={() => {
                setFilters({
                  ...filters, 
                  category: []
                });
              }}
              className="ml-2 text-xs text-indigo-600 hover:text-indigo-800"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setFilters({
                ...filters, 
                category: []
              });
            }}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.category.length === 0 
                ? 'bg-indigo-100 text-indigo-800' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          
          <button
            onClick={() => {
              const newCategory = filters.category.includes('work') 
                ? filters.category.filter(c => c !== 'work')
                : [...filters.category, 'work'];
              setFilters({
                ...filters, 
                category: newCategory
              });
            }}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.category.includes('work') 
                ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            Work
          </button>
          
          <button
            onClick={() => {
              const newCategory = filters.category.includes('personal') 
                ? filters.category.filter(c => c !== 'personal')
                : [...filters.category, 'personal'];
              setFilters({
                ...filters, 
                category: newCategory
              });
            }}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.category.includes('personal') 
                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >
            Personal
          </button>
          
          <button
            onClick={() => {
              const newCategory = filters.category.includes('childcare') 
                ? filters.category.filter(c => c !== 'childcare')
                : [...filters.category, 'childcare'];
              setFilters({
                ...filters, 
                category: newCategory
              });
            }}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.category.includes('childcare') 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            Childcare
          </button>
          
          <button
            onClick={() => {
              const newCategory = filters.category.includes('other') 
                ? filters.category.filter(c => c !== 'other')
                : [...filters.category, 'other'];
              setFilters({
                ...filters, 
                category: newCategory
              });
            }}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filters.category.includes('other') 
                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                : 'bg-gray-100 text-gray-800 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            Other
          </button>
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
