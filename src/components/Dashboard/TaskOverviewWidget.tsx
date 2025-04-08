import React from 'react';
import { useTaskMetrics } from '../../hooks/dashboard/useTaskMetrics';

interface TaskOverviewWidgetProps {
  title?: string;
}

export const TaskOverviewWidget: React.FC<TaskOverviewWidgetProps> = ({
  title = "Overview"
}) => {
  const metrics = useTaskMetrics();

  const completionPercentage = Math.round((metrics.completedTasks / metrics.totalTasks) * 100) || 0;

  return (
    <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-300 p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button className="text-gray-500 hover:text-taskman-blue-500 transition duration-250">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      <div className="mt-2 flex flex-col items-center">
        <div className="w-full flex justify-between mb-2">
          <span className="text-gray-600 text-sm">Completion Rate</span>
          <span className="text-taskman-blue-600 text-sm font-medium">{completionPercentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-taskman-blue-500 h-2 rounded-full" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-3 w-full mt-4 gap-2">
          <div className="bg-gray-50 p-3 rounded text-center">
            <span className="block text-xl font-bold text-taskman-blue-500">{metrics.completedTasks}</span>
            <span className="text-xs text-gray-500">Completed</span>
          </div>
          <div className="bg-gray-50 p-3 rounded text-center">
            <span className="block text-xl font-bold text-yellow-500">{metrics.activeTasks}</span>
            <span className="text-xs text-gray-500">In Progress</span>
          </div>
          <div className="bg-gray-50 p-3 rounded text-center">
            <span className="block text-xl font-bold text-gray-500">{metrics.pendingTasks}</span>
            <span className="text-xs text-gray-500">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskOverviewWidget;
