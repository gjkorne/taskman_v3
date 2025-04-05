import { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { TaskContainer } from './TaskContainer';
import { useTaskData, useTaskUI } from '../../contexts/task';
import { QuickTaskEntry, TaskForm } from '../TaskForm';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'; // Import icons for the dropdown
import { FilterBar } from '../FilterBar';
import { useFilterSort } from '../../contexts/filterSort';

// Define ref type for external access to TaskList methods
export interface TaskListRefType {
  refreshTaskList: () => Promise<void>;
}

interface TaskListProps {
  onTimerStateChange?: () => void;
}

export const TaskList = forwardRef<TaskListRefType, TaskListProps>(({ onTimerStateChange }, ref) => {
  // Get data management from the task data context
  const { 
    filteredTasks,
    isLoading, 
    error,
    isRefreshing,
    refreshTasks,
    filters: legacyFilters,
    setFilters: setLegacyFilters
  } = useTaskData();
  
  // Get UI management from the task UI context
  const { 
    isEditModalOpen,
    editTaskId,
    openEditModal,
    closeEditModal,
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    viewMode
  } = useTaskUI();

  // Get new filtering capabilities from FilterSortContext
  const { 
    legacyFilters: contextLegacyFilters,
    setLegacyFilters: setContextLegacyFilters,
    groupBy
  } = useFilterSort();

  // Sync legacy filters with new context filters (both ways for backward compatibility)
  useEffect(() => {
    // Only sync when they're different to avoid loops
    if (JSON.stringify(legacyFilters) !== JSON.stringify(contextLegacyFilters)) {
      setContextLegacyFilters(legacyFilters);
    }
  }, [legacyFilters, contextLegacyFilters, setContextLegacyFilters]);

  useEffect(() => {
    // Sync from context to legacy
    if (JSON.stringify(legacyFilters) !== JSON.stringify(contextLegacyFilters)) {
      setLegacyFilters(contextLegacyFilters);
    }
  }, [contextLegacyFilters, legacyFilters, setLegacyFilters]);

  // State for new task modal
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  
  // State for mobile filters dropdown
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Delete task handler that uses the data context
  const confirmDelete = async (taskId: string) => {
    try {
      await useTaskData().deleteTask(taskId);
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

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
          viewMode={viewMode}
        />
      </div>
    );
  }

  // Display error if any
  if (error) {
    return (
      <div className="w-full mx-auto px-4 py-4 bg-red-50 text-red-700 rounded-md">
        <p className="font-medium">Error loading tasks</p>
        <p>{error}</p>
      </div>
    );
  }

  // Helper to get currently active category name
  const getActiveCategoryName = () => {
    if (legacyFilters.category.length === 0) return 'All';
    return legacyFilters.category[0].charAt(0).toUpperCase() + legacyFilters.category[0].slice(1);
  };

  // Apply any grouping to tasks
  const getGroupedTasks = () => {
    // If no grouping is applied, just return the filtered tasks
    if (!groupBy || !groupBy.field) {
      return filteredTasks;
    }

    // In a real implementation, we would apply grouping logic here
    // For now, we just return the filtered tasks as-is
    return filteredTasks;
  };

  const groupedTasks = getGroupedTasks();
  const totalTaskCount = filteredTasks.length;

  const handleTaskSuccess = () => {
    closeEditModal();
    refreshTasks();
  };

  return (
    <div className="w-full mx-auto px-0 py-1 sm:px-6 sm:py-8 relative bg-gray-50 shadow-lg">
      {/* New FilterBar component for all device sizes */}
      <FilterBar 
        showTaskCount={true}
        taskCount={totalTaskCount}
        filteredCount={groupedTasks.length}
      />
      
      {/* Mobile-only simple filter dropdown (legacy) */}
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
          {legacyFilters.category.length > 0 && (
            <button
              onClick={() => {
                setLegacyFilters({
                  ...legacyFilters, 
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
                setLegacyFilters({
                  ...legacyFilters, 
                  category: []
                });
                setIsFiltersOpen(false);
              }}
              className={`block w-full text-left px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                legacyFilters.category.length === 0 
                  ? 'bg-indigo-100 text-indigo-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setLegacyFilters({
                  ...legacyFilters, 
                  category: ['work']
                });
                setIsFiltersOpen(false);
              }}
              className={`block w-full text-left px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                legacyFilters.category.includes('work') 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Work
            </button>
            <button
              onClick={() => {
                setLegacyFilters({
                  ...legacyFilters, 
                  category: ['personal']
                });
                setIsFiltersOpen(false);
              }}
              className={`block w-full text-left px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                legacyFilters.category.includes('personal') 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => {
                setLegacyFilters({
                  ...legacyFilters, 
                  category: ['childcare']
                });
                setIsFiltersOpen(false);
              }}
              className={`block w-full text-left px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                legacyFilters.category.includes('childcare') 
                  ? 'bg-green-100 text-green-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Childcare
            </button>
            <button
              onClick={() => {
                setLegacyFilters({
                  ...legacyFilters, 
                  category: ['other']
                });
                setIsFiltersOpen(false);
              }}
              className={`block w-full text-left px-2 py-1.5 text-sm font-medium rounded transition-colors ${
                legacyFilters.category.includes('other') 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              Other
            </button>
          </div>
        )}
      </div>
      
      {/* Desktop-only task entry */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg shadow-md p-2 sm:p-4 mb-3 sm:mb-6 border-l-4 border-l-indigo-400">
        <div className="flex flex-col gap-4">
          {/* Quick task entry */}
          <div className="w-full">
            <QuickTaskEntry onTaskCreated={refreshTasks} />
          </div>
        </div>
      </div>
      
      {/* Mobile-only quick task entry */}
      <div className="md:hidden mb-2">
        <div className="bg-white border border-gray-200 rounded-md shadow-md">
          <QuickTaskEntry onTaskCreated={refreshTasks} />
        </div>
      </div>
      
      {/* Task Container */}
      <TaskContainer 
        tasks={groupedTasks}
        isLoading={isRefreshing}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        viewMode={viewMode}
        onTimerStateChange={onTimerStateChange}
      />
      
      {/* Task Modals */}
      {isEditModalOpen && editTaskId && (
        <TaskForm 
          taskId={editTaskId}
          mode="edit"
          onClose={closeEditModal}
          onSuccess={handleTaskSuccess}
        />
      )}
      
      {isNewTaskModalOpen && (
        <TaskForm 
          mode="create"
          onClose={() => setIsNewTaskModalOpen(false)}
          onSuccess={() => {
            setIsNewTaskModalOpen(false);
            refreshTasks();
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && editTaskId && (
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
                  onClick={() => confirmDelete(editTaskId)}
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
