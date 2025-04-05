interface TimeTrackingWidgetProps {
  title?: string;
}

/**
 * TimeTrackingWidget - Displays time tracking stats
 */
export function TimeTrackingWidget({ title = "Time Tracking" }: TimeTrackingWidgetProps) {
  // Using static data for UI mockup
  const timeThisWeek = "16h";
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 col-span-1 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="relative">
        <div className="">
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-blue-600">{timeThisWeek}</div>
            <div className="text-gray-500 text-sm mt-2">this week</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeTrackingWidget;
