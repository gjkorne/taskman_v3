import { forwardRef, useImperativeHandle, useEffect } from 'react';
import { TaskContainer } from './TaskContainer';
import { useTaskData, useTaskUI } from '../../contexts/task';
import { TaskForm } from '../TaskForm';
import { FilterBar } from '../FilterBar';
import { useFilterSort } from '../../contexts/filterSort';
import { Portal } from '../UI/Portal';
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

  // Handle task creation/update success from TaskForm (used by Edit Modal)
  const handleTaskSuccess = () => {
    console.log('Task operation success.');
    refreshTasks(); // Refresh the list on success
    closeEditModal(); // Close modal if it was an edit
  };

  // Show loading state
  if (isLoading && !isRefreshing) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search/Filter Section - Now at the top */}
      <div className="sticky top-0 bg-white z-10 p-2 shadow-sm border-b border-gray-200"> 
        <FilterBar 
          showTaskCount={true}
          taskCount={totalTaskCount}
          filteredCount={groupedTasks ? Object.values(groupedTasks).reduce((count, tasks) => count + tasks.length, 0) : filteredTasks.length}
        />
      </div>
        
      {/* Error state */}
      {error && (
        <div className="bg-red-50 p-4 rounded-md border border-red-200 mt-4 mx-4">
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
        
      {/* Main content area with scrolling */}
      <div className="flex-1 overflow-auto px-4 pb-4">
        {/* Task List Header */}
        <div className="py-2 mb-2 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Tasks</h2>
          {/* Add view mode toggles or other controls here if needed */}
        </div>

        {/* Task Container */}
        <TaskContainer 
          tasks={filteredTasks}
          isLoading={isLoading}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onTimerStateChange={onTimerStateChange}
          viewMode={viewMode}
          groupedTasks={groupedTasks}
        />
      </div>

      {/* Edit Task Modal */}
      {isEditModalOpen && editTaskId && (
        <Portal>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">Edit Task</h2>
              <TaskForm taskId={editTaskId} onSuccess={handleTaskSuccess} onCancel={closeEditModal} mode="edit" />
            </div>
          </div>
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <Portal>
          {/* Simplified delete confirmation for brevity */}
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded shadow-lg">
              <p>Are you sure you want to delete?</p>
              <button onClick={confirmDelete}>Yes</button>
              <button onClick={closeDeleteModal}>No</button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
});
