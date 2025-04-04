import { useQuery } from '@tanstack/react-query';
import { DashboardWidget } from './DashboardWidget';
import { AlertTriangle, AlertCircle, Check } from 'lucide-react';
import { useTaskData } from '../../contexts/task';
import { TIME_SESSION_QUERY_KEYS } from '../../contexts/timeSession/TimeSessionDataContext';

/**
 * TaskPriorityWidget - Shows the distribution of tasks by priority
 * Uses our React Query optimized task data
 */
export function TaskPriorityWidget() {
  const { tasks } = useTaskData();
  
  // Use React Query for task priority metrics
  const { data: priorityData, isLoading } = useQuery({
    queryKey: [...TIME_SESSION_QUERY_KEYS.metrics(), 'task-priority'],
    queryFn: () => calculatePriorityMetrics(tasks),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
    // Use the local data we already have
    enabled: tasks.length > 0,
  });
  
  return (
    <DashboardWidget
      title="Task Priorities"
      isLoading={isLoading}
      className="col-span-1 md:col-span-1"
    >
      <div className="grid grid-cols-1 gap-4">
        {/* High Priority Card */}
        <div className="bg-red-50 p-4 rounded-lg flex items-center">
          <div className="p-2 bg-red-100 rounded-full mr-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">High Priority</p>
            <p className="text-2xl font-bold text-red-900">{priorityData?.high || 0}</p>
          </div>
          {priorityData?.highPercentage ? (
            <span className="text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded-full">
              {priorityData.highPercentage}%
            </span>
          ) : null}
        </div>
        
        {/* Medium Priority Card */}
        <div className="bg-amber-50 p-4 rounded-lg flex items-center">
          <div className="p-2 bg-amber-100 rounded-full mr-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Medium Priority</p>
            <p className="text-2xl font-bold text-amber-900">{priorityData?.medium || 0}</p>
          </div>
          {priorityData?.mediumPercentage ? (
            <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
              {priorityData.mediumPercentage}%
            </span>
          ) : null}
        </div>
        
        {/* Low Priority Card */}
        <div className="bg-green-50 p-4 rounded-lg flex items-center">
          <div className="p-2 bg-green-100 rounded-full mr-3">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Low Priority</p>
            <p className="text-2xl font-bold text-green-900">{priorityData?.low || 0}</p>
          </div>
          {priorityData?.lowPercentage ? (
            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
              {priorityData.lowPercentage}%
            </span>
          ) : null}
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {priorityData?.total || 0} total active tasks
        </p>
      </div>
    </DashboardWidget>
  );
}

// Helper function to calculate priority metrics
function calculatePriorityMetrics(tasks: any[]) {
  const activeTasks = tasks.filter(task => 
    !task.is_deleted && task.status !== 'completed' && task.status !== 'archived'
  );
  
  const total = activeTasks.length;
  
  const high = activeTasks.filter(task => 
    task.priority === 'high' || task.priority === 'urgent'
  ).length;
  
  const medium = activeTasks.filter(task => 
    task.priority === 'medium'
  ).length;
  
  const low = activeTasks.filter(task => 
    task.priority === 'low'
  ).length;
  
  // Calculate percentages
  const highPercentage = total > 0 ? Math.round((high / total) * 100) : 0;
  const mediumPercentage = total > 0 ? Math.round((medium / total) * 100) : 0;
  const lowPercentage = total > 0 ? Math.round((low / total) * 100) : 0;
  
  return {
    high,
    medium,
    low,
    total,
    highPercentage,
    mediumPercentage,
    lowPercentage
  };
}

export default TaskPriorityWidget;
