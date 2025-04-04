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
      title="Tasks Due Today" 
      isLoading={metrics.totalTasks === 0}
      className="col-span-1"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-blue-600">
          {metrics.tasksDueToday}
        </div>
        <div className="text-gray-500 text-sm mt-2">
          of {metrics.totalTasks} total
        </div>
      </div>
    </DashboardWidget>
  );
}

export default TaskOverviewWidget;
