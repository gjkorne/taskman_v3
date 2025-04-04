import { useWeekTimeTracked, useTimeByCategory } from '../../hooks/dashboard/useTimeTrackingMetrics';
import { DashboardWidget } from './DashboardWidget';
import { Clock } from 'lucide-react';

/**
 * TimeTrackingWidget - Shows time tracking summary and breakdown
 * Uses the specialized hooks that leverage our new context structure
 */
export function TimeTrackingWidget() {
  const { hours, formattedTimeThisWeek, isLoading } = useWeekTimeTracked();
  const { categories, isLoading: isCategoriesLoading } = useTimeByCategory();
  
  // Limit to top 5 categories by time spent
  const topCategories = categories.slice(0, 5);
  
  return (
    <DashboardWidget 
      title="Time Tracking" 
      isLoading={isLoading || isCategoriesLoading}
      className="col-span-1 row-span-2"
    >
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 relative rounded-full flex items-center justify-center bg-indigo-50 mb-4">
          <Clock className="h-6 w-6 text-indigo-400 absolute" />
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{hours}h</p>
            <p className="text-xs text-indigo-500">This Week</p>
          </div>
        </div>
        
        <p className="text-sm text-center text-gray-500 mb-4">
          You've tracked {formattedTimeThisWeek} this week
        </p>
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Time by Category</h3>
        {topCategories.length > 0 ? (
          <div className="space-y-3">
            {topCategories.map(category => (
              <div key={category.name} className="flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-600">{category.name}</span>
                  <span className="text-xs text-gray-500">{category.formattedTime}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-indigo-500 h-1.5 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (category.timeSpent / categories[0].timeSpent) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No time tracked by category yet
          </p>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button className="w-full py-2 text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          View Detailed Report
        </button>
      </div>
    </DashboardWidget>
  );
}

export default TimeTrackingWidget;
