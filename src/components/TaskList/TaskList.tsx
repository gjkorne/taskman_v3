import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { TaskContainer } from './TaskContainer';
import { useTaskData, useTaskUI } from '../../contexts/task';
import { QuickTaskEntry, TaskForm } from '../TaskForm';
import { FilterBar } from '../FilterBar';
import { useFilterSort } from '../../contexts/filterSort';
import { Portal } from '../UI/Portal';
import { SearchPanel } from './SearchPanel';
import { Task } from '../../types/task';

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
  
  // Delete task handler that uses the data context
  const confirmDelete = async () => {
    try {
      await refreshTasks();
      closeDeleteModal();
    } catch (e) {
      console.error('Failed to delete task:', e);
    }
  };

  // Expose methods to parent components via ref
  useImperativeHandle(ref, () => ({
    refreshTaskList: refreshTasks
  }));

  // Apply any grouping to tasks
  const getGroupedTasks = () => {
    // If no grouping is applied, just return null
    if (!groupBy || !groupBy.field) {
      return null;
    }

    // Group tasks by the specified field
    const groupedTasks: Record<string, Task[]> = {};
    
    filteredTasks.forEach(task => {
      // Get the group value from the task based on the groupBy field
      let groupValue = task[groupBy.field as keyof typeof task];
      
      // Handle special formatting for certain fields
      switch (groupBy.field) {
        case 'due_date':
          groupValue = groupValue ? new Date(groupValue).toLocaleDateString() : 'No Due Date';
          break;
        case 'category':
          groupValue = task.category_name || 'Uncategorized';
          break;
        case 'priority':
          // Format priority nicely
          switch (groupValue) {
            case 'urgent': groupValue = 'Urgent (P1)'; break;
            case 'high': groupValue = 'High (P2)'; break;
            case 'medium': groupValue = 'Medium (P3)'; break;
            case 'low': groupValue = 'Low (P4)'; break;
            default: groupValue = 'No Priority';
          }
          break;
        case 'status':
          // Format status nicely
          groupValue = groupValue.replace('_', ' ');
          // Capitalize first letter of each word
          groupValue = groupValue.split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          break;
        default:
          // For any other field, use a default for null/undefined values
          groupValue = groupValue || `No ${groupBy.field}`;
      }
      
      // Create the group if it doesn't exist
      if (!groupedTasks[groupValue]) {
        groupedTasks[groupValue] = [];
      }
      
      // Add the task to the group
      groupedTasks[groupValue].push(task);
    });
    
    return groupedTasks;
  };

  const groupedTasks = getGroupedTasks();
  const totalTaskCount = filteredTasks.length;

  // Simple handler for task creation success
  const handleTaskSuccess = () => {
    refreshTasks();
  };

  // Show loading state
  if (isLoading && !isRefreshing) {
    return (
      <div className="w-full mx-auto px-0 py-1 sm:px-6 sm:py-8 relative bg-gray-50">
        <TaskContainer 
          tasks={[]}
          isLoading={true}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onTimerStateChange={onTimerStateChange}
          viewMode={viewMode}
          groupedTasks={null}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search and filter section */}
      <div className="sticky top-0 bg-gray-50 z-10 p-4 shadow-sm">
        <SearchPanel />
        
        {/* Responsive filter bar - appears below search on mobile, beside on larger screens */}
        <div className="mt-4">
          <FilterBar 
            showTaskCount={true}
            taskCount={totalTaskCount}
            filteredCount={groupedTasks ? Object.values(groupedTasks).reduce((count, tasks) => count + tasks.length, 0) : filteredTasks.length}
          />
        </div>
        
        {/* Mobile-only simple filter dropdown (legacy) */}
        <div className="md:hidden mt-4">
          {/* Additional mobile filters here if needed */}
        </div>
      </div>
      
      {/* Error state */}
      {error && (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 mt-4">
          <h3 className="text-red-800 font-medium">Error loading tasks</h3>
          <p className="text-red-600 mt-1 text-sm">{String(error)}</p>
          <button 
            onClick={() => refreshTasks()} 
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-800 text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Quick task creation */}
      <div className="my-4 mx-4">
        <QuickTaskEntry 
          onTaskCreated={handleTaskSuccess}
        />
      </div>
      
      {/* Main content area with scrolling */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {/* Task Container */}
        <TaskContainer 
          tasks={filteredTasks}
          isLoading={isRefreshing}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onTimerStateChange={onTimerStateChange}
          viewMode={viewMode}
          groupedTasks={groupBy && groupBy.field ? groupedTasks : null}
        />
      </div>
      
      {/* Task Modals */}
      {isEditModalOpen && editTaskId && (
        <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[1000] p-2">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <TaskForm 
                taskId={editTaskId}
                onCancel={closeEditModal}
                onSuccess={handleTaskSuccess}
                mode="edit"
              />
            </div>
          </div>
        </Portal>
      )}

      {/* Delete confirmation modal */}
      {isDeleteModalOpen && (
        <Portal>
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[1000] p-2">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-1">Delete Task</h2>
                <p className="text-gray-600 mb-4">Are you sure you want to delete this task? This action cannot be undone.</p>
                <div className="flex space-x-2 justify-end">
                  <button
                    onClick={closeDeleteModal}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
        )}
    </div>
  );
});
