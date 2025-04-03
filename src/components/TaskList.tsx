import { useState, forwardRef, useImperativeHandle } from 'react';
import { TaskList as TaskListDisplay } from './TaskList/TaskList';

// Define a type for the ref methods we want to expose
export type TaskListRefType = {
  refreshTaskList: () => void;
};

export const TaskList = forwardRef<TaskListRefType, {}>((_, ref) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Expose refreshTaskList method via ref
  useImperativeHandle(ref, () => ({
    refreshTaskList: () => {
      setRefreshTrigger(prev => prev + 1);
    }
  }));

  return (
    <div className="max-w-6xl mx-auto relative">
      {/* Task List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <TaskListDisplay key={refreshTrigger} />
      </div>
    </div>
  );
});