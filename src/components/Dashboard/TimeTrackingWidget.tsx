import { DashboardWidget } from './DashboardWidget';

/**
 * TimeTrackingWidget - Displays time tracking stats
 */
export function TimeTrackingWidget() {
  // Using static data for UI mockup
  const timeThisWeek = "16h";
  
  return (
    <DashboardWidget 
      title="Time Tracked" 
      isLoading={false}
      className="col-span-1"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-blue-600">
          {timeThisWeek}
        </div>
        <div className="text-gray-500 text-sm mt-2">
          this week
        </div>
      </div>
    </DashboardWidget>
  );
}

export default TimeTrackingWidget;
