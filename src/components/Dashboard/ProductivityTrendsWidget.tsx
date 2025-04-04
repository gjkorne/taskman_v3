import { useState } from 'react';
import { useProductivityTrends } from '../../hooks/dashboard/useProductivityTrends';
import { DashboardWidget } from './DashboardWidget';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Clock, CheckCircle, Calendar } from 'lucide-react';

/**
 * ProductivityTrendsWidget - Shows productivity metrics over time
 * Uses our specialized useProductivityTrends hook for performance
 */
export function ProductivityTrendsWidget() {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(14);
  const trends = useProductivityTrends(timeRange);
  
  // Format completion rate as percentage
  const completionRate = Math.round(trends.weeklyCompletionRate * 100);
  
  // Format productivity (tasks per hour)
  const productivity = trends.weeklyProductivity.toFixed(2);
  
  // Determine trend direction for visual indicators
  const isPositiveCompletionTrend = completionRate >= 90;
  const isPositiveProductivityTrend = trends.weeklyProductivity > 0.5;
  
  return (
    <DashboardWidget 
      title="Productivity Trends" 
      isLoading={false}
      className="col-span-1 row-span-2 md:col-span-2"
    >
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Performance Summary</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value) as 7 | 14 | 30)}
          className="px-2 py-1 text-sm rounded border border-gray-300"
        >
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm text-gray-500">Completion Rate</span>
            </div>
            {isPositiveCompletionTrend ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <p className="mt-2 text-2xl font-bold">{completionRate}%</p>
          <p className="text-xs text-gray-500">Tasks completed vs. created</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-sm text-gray-500">Productivity</span>
            </div>
            {isPositiveProductivityTrend ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <p className="mt-2 text-2xl font-bold">{productivity}</p>
          <p className="text-xs text-gray-500">Tasks completed per hour</p>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Daily Activity
        </h4>
        
        <div className="space-y-3 max-h-52 overflow-y-auto pr-2">
          {trends.dailyData.slice().reverse().map((day, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {format(day.date, 'MMM dd')}
              </span>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  {day.minutesTracked > 0 && (
                    <div 
                      className="h-full bg-indigo-400" 
                      style={{ width: `${Math.min(100, day.minutesTracked / 10)}%` }}
                    />
                  )}
                </div>
              </div>
              <div className="flex space-x-3 text-xs">
                <span className="text-green-600">{day.tasksCompleted} done</span>
                <span className="text-blue-600">{Math.round(day.minutesTracked / 60 * 10) / 10}h tracked</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-gray-500">Total Completed</p>
            <p className="font-medium">{trends.totalTasksCompleted} tasks</p>
          </div>
          <div>
            <p className="text-gray-500">Total Time</p>
            <p className="font-medium">{Math.round(trends.totalHoursTracked * 10) / 10} hours</p>
          </div>
          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium">{trends.totalTasksCreated} tasks</p>
          </div>
        </div>
      </div>
    </DashboardWidget>
  );
}

export default ProductivityTrendsWidget;
