import { useMemo } from 'react';
import { Task } from '../../types/task';
import { TaskFilter } from './FilterPanel';
import { TaskCard } from './TaskCard';
import { TaskSection } from './TaskSection';
import { useTaskCategories } from '../../hooks/useTaskCategories';

interface TaskContainerProps {
  tasks: Task[];
  isLoading: boolean;
  viewMode: TaskFilter['viewMode'];
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onTimerStateChange?: () => void;
  groupedTasks?: Record<string, Task[]> | null;
}

// Simple function component
export function TaskContainer(props: TaskContainerProps) {
  const { 
    tasks, 
    isLoading, 
    viewMode, 
    onEdit, 
    onDelete, 
    onTimerStateChange, 
    groupedTasks 
  } = props;

  // Call hooks at the top level of the component
  const {
    activeTasks,
    pausedTasks,
    inProgressTasks,
    todoTasks,
    completedTasks,
    archivedTasks
  } = useTaskCategories(tasks);

  // Helper function to render a single task card (used in board view)
  const renderTaskCard = (task: Task, index: number) => (
    <TaskCard
      key={task.id}
      task={task}
      index={index}
      onEdit={onEdit}
      onDelete={onDelete}
      onTimerStateChange={onTimerStateChange}
    />
  );

  // Use useMemo to stabilize the render output, but DON'T call hooks inside it
  const renderContent = useMemo(() => {
    // Loading state indicator
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-200 rounded-full mb-2"></div>
            <div className="h-4 w-24 bg-blue-100 rounded"></div>
          </div>
        </div>
      );
    }

    // Empty state indicator
    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <div className="rounded-full bg-gray-100 p-3 mb-3">
            <svg className="h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
          <p className="mt-2 text-gray-500">Create your first task to get started.</p>
        </div>
      );
    }

    // Render grouped tasks when grouping is applied
    if (groupedTasks && Object.keys(groupedTasks).length > 0) {
      if (viewMode === 'list') {
        // Display grouped tasks in list view
        return (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <div key={groupName} className="mb-8">
                <div className="flex items-center px-3 py-2 bg-gray-100 rounded-t-md mb-2">
                  <h3 className="font-semibold text-gray-700">{groupName}</h3>
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {groupTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {groupTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onTimerStateChange={onTimerStateChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      } else {
        // Grid view for grouped tasks
        return (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <div key={groupName} className="mb-8">
                <div className="flex items-center px-3 py-2 bg-gray-100 rounded-t-md mb-2">
                  <h3 className="font-semibold text-gray-700">{groupName}</h3>
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {groupTasks.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onTimerStateChange={onTimerStateChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      }
    }

    // Render in list view (vertically stacked sections)
    if (viewMode === 'list') {
      return (
        <div className="space-y-6">
          <TaskSection 
            tasks={activeTasks} 
            sectionKey="activeNow" 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onTimerStateChange={onTimerStateChange} 
          />
          <TaskSection 
            tasks={pausedTasks} 
            sectionKey="paused" 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onTimerStateChange={onTimerStateChange} 
          />
          <TaskSection 
            tasks={inProgressTasks} 
            sectionKey="inProgress" 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onTimerStateChange={onTimerStateChange} 
          />
          <TaskSection 
            tasks={todoTasks} 
            sectionKey="todo" 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onTimerStateChange={onTimerStateChange} 
          />
          <TaskSection 
            tasks={completedTasks} 
            sectionKey="completed" 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onTimerStateChange={onTimerStateChange} 
          />
          <TaskSection 
            tasks={archivedTasks} 
            sectionKey="archived" 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onTimerStateChange={onTimerStateChange} 
          />
        </div>
      );
    } 
  
    // Render in board view (horizontally arranged columns)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1: Active tasks */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium px-2">Active & In Progress</h2>
          {/* Section for active tasks */}
          <div className="px-2">
            {activeTasks.map((task, index) => renderTaskCard(task, index))}
            {pausedTasks.map((task, index) => renderTaskCard(task, index))}
            {inProgressTasks.map((task, index) => renderTaskCard(task, index))}
          </div>
        </div>
        
        {/* Column 2: Pending tasks */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium px-2">Todo</h2>
          <div className="px-2">
            {todoTasks.map((task, index) => renderTaskCard(task, index))}
          </div>
        </div>
        
        {/* Column 3: Completed & Archived tasks */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium px-2">Completed & Archived</h2>
          <div className="px-2">
            {completedTasks.map((task, index) => renderTaskCard(task, index))}
            {archivedTasks.map((task, index) => renderTaskCard(task, index))}
          </div>
        </div>
      </div>
    );
  }, [
    tasks, 
    isLoading, 
    viewMode, 
    onEdit, 
    onDelete, 
    onTimerStateChange, 
    groupedTasks,
    // Include all task category variables in dependencies
    activeTasks,
    pausedTasks,
    inProgressTasks,
    todoTasks,
    completedTasks,
    archivedTasks
  ]);

  // Render the memoized content
  return renderContent;
}
