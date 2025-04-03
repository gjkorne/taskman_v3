import { forwardRef, useImperativeHandle, useState } from 'react';
import { TaskContainer } from './TaskContainer';
import { useTaskContext } from '../../contexts/TaskContext';
import { useTaskModal } from '../../hooks/useTaskModal';
import { QuickTaskEntry, TaskForm } from '../TaskForm';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'; // Import icons for the dropdown

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
    filters,
    setFilters
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
  
  // State for mobile filters dropdown
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    refreshTaskList: refreshTasks
  }));

  // Render loading state
  if (isLoading && !isRefreshing) {
    return (
      <div className="w-full mx-auto px-0 py-1 sm:px-6 sm:py-8 relative bg-gray-50">
        <TaskContainer 
          isLoading={true}
          tasks={[]}
          viewMode={filters.viewMode}
        />
      </div>
    );
  }

  // Helper to get currently active category name
  const getActiveCategoryName = () => {
    if (filters.category.length === 0) return 'All';
    return filters.category[0].charAt(0).toUpperCase() + filters.category[0].slice(1);
  };

  return (
    <div className="w-full mx-auto px-0 py-1 sm:px-6 sm:py-8 relative bg-gray-50 shadow-lg">
      {/* Mobile-only simple filter dropdown */}
      <div className="md:hidden mb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center justify-between w-full px-2 py-1.5 bg-gray-100 rounded-md text-sm font-medium text-gray-700"
          >
            <div className="flex items-center">
              <Filter className="h-3.5 w-3.5 mr-1" />
              <span className="text-sm">Filter: {getActiveCategoryName()}</span>
            </div>
            {isFiltersOpen ? (
              <ChevronUp className="h-3.5 w-3.5 ml-1" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            )}
          </button>
          {filters.category.length > 0 && (
            <button
              onClick={() => {
                setFilters({
                  ...filters, 
                  category: []
                });
              }}
              className="ml-1 text-xs text-indigo-600 hover:text-indigo-800"
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Mobile dropdown content */}
        {isFiltersOpen && (
          <div className="bg-white border border-gray-200 rounded-md shadow-sm mt-1 mb-2 p-1 space-y-1">
            <button
              onClick={() => {
                setFilters({
                  ...filters, 
                  category: []
                });
                setIsFiltersOpen(false);
              }}
              className={`block w-full text-left px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                filters.category.length === 0 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setFilters({
                  ...filters, 
                  category: ['work']
                });
                setIsFiltersOpen(false);
              }}
              className={`block w-full text-left px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                filters.category.includes('work') 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Work
            </button>
            <button
              onClick={() => {
                setFilters({
                  ...filters, 
                  category: ['personal']
                });
                setIsFiltersOpen(false);
              }}
              className={`block w-full text-left px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                filters.category.includes('personal') 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => {
                setFilters({
                  ...filters, 
                  category: ['childcare']
                });
                setIsFiltersOpen(false);
              }}
              className={`block w-full text-left px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                filters.category.includes('childcare') 
                  ? 'bg-green-100 text-green-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Childcare
            </button>
            <button
              onClick={() => {
                setFilters({
                  ...filters, 
                  category: ['other']
                });
                setIsFiltersOpen(false);
              }}
              className={`block w-full text-left px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                filters.category.includes('other') 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Other
            </button>
          </div>
        )}
      </div>
      
      {/* Desktop-only filter and task entry */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg shadow-md p-2 sm:p-4 mb-3 sm:mb-6 border-l-4 border-l-indigo-400">
        <div className="flex flex-col gap-4">
          {/* Quick task entry */}
          <div className="w-full">
            <QuickTaskEntry onTaskCreated={refreshTasks} />
          </div>
          
          {/* Quick Category Filters - Desktop only */}
          <div className="w-full">
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
                    category: ['work']
                  });
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filters.category.includes('work') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-800 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                Work
              </button>
              <button
                onClick={() => {
                  setFilters({
                    ...filters, 
                    category: ['personal']
                  });
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filters.category.includes('personal') 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-800 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => {
                  setFilters({
                    ...filters, 
                    category: ['childcare']
                  });
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filters.category.includes('childcare') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-800 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                Childcare
              </button>
              <button
                onClick={() => {
                  setFilters({
                    ...filters, 
                    category: ['other']
                  });
                }}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filters.category.includes('other') 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-gray-100 text-gray-800 hover:bg-amber-50 hover:text-amber-700'
                }`}
              >
                Other
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-2 mb-2 text-red-700">
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
      
      {/* New task modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">Create New Task</h2>
              <TaskForm 
                mode="create"
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-1">Delete Task</h2>
              <p className="text-gray-600 mb-4">Are you sure you want to delete this task? This action cannot be undone.</p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeDeleteModal}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete()}
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
});
