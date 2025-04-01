import { ReactNode } from 'react';
import { TaskFilter } from './FilterPanel';

interface TaskContainerProps {
  children: ReactNode;
  isLoading: boolean;
  isEmpty: boolean;
  viewMode: TaskFilter['viewMode'];
}

export function TaskContainer({ children, isLoading, isEmpty, viewMode }: TaskContainerProps) {
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

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <svg 
            className="h-12 w-12 text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
        <p className="text-gray-500 mb-4">Try changing your filters or create a new task.</p>
      </div>
    );
  }

  // The actual container based on view mode
  return (
    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col space-y-2"}>
      {children}
    </div>
  );
}
