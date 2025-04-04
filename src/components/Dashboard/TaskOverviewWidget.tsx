import { useTaskMetrics } from '../../hooks/dashboard/useTaskMetrics';
import { DashboardWidget } from './DashboardWidget';

/**
 * TaskOverviewWidget - Shows high-level task metrics
 * Uses the specialized useTaskMetrics hook which is optimized for performance
 */
export function TaskOverviewWidget() {
  const metrics = useTaskMetrics();
  
  return (
    <DashboardWidget 
      title="Task Overview" 
      isLoading={metrics.totalTasks === 0}
      className="col-span-1 md:col-span-2"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 p-3 rounded-lg text-center">
          <p className="text-sm text-indigo-700 font-medium">Total Tasks</p>
          <p className="text-2xl font-bold text-indigo-800">{metrics.totalTasks}</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <p className="text-sm text-green-700 font-medium">Active</p>
          <p className="text-2xl font-bold text-green-800">{metrics.activeTasks}</p>
        </div>
        
        <div className="bg-amber-50 p-3 rounded-lg text-center">
          <p className="text-sm text-amber-700 font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-800">{metrics.pendingTasks}</p>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <p className="text-sm text-blue-700 font-medium">Completed</p>
          <p className="text-2xl font-bold text-blue-800">{metrics.completedTasks}</p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 border border-gray-100 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Due Today</p>
          <p className="text-xl font-semibold">{metrics.tasksDueToday}</p>
        </div>
        
        <div className="p-3 border border-gray-100 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Due This Week</p>
          <p className="text-xl font-semibold">{metrics.tasksDueThisWeek}</p>
        </div>
        
        <div className="p-3 border border-gray-100 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Overdue</p>
          <p className="text-xl font-semibold text-red-600">{metrics.overdueTask}</p>
        </div>
      </div>
    </DashboardWidget>
  );
}

export default TaskOverviewWidget;
