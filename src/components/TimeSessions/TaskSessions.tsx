import { useState } from 'react';
import { Clock, BarChart } from 'lucide-react';
import { Task } from '../../types/task';
import { TimeSessionsList } from './TimeSessionsList';
import { cn } from '../../lib/utils';

interface TaskSessionsProps {
  task: Task;
  className?: string;
}

export function TaskSessions({ task, className }: TaskSessionsProps) {
  const [showAll, setShowAll] = useState(false);
  const [totalTime, setTotalTime] = useState('00:00:00');
  const [isStatsView, setIsStatsView] = useState(false);

  // Calculate percentage of estimated time used
  const calculateProgress = () => {
    if (!task.estimated_time || !totalTime) return 0;
    
    // Parse estimated time from PostgreSQL interval format
    const estimatedParts = task.estimated_time.split(' ');
    let estimatedSeconds = 0;
    if (estimatedParts.length === 2 && estimatedParts[1] === 'seconds') {
      estimatedSeconds = parseInt(estimatedParts[0], 10);
    }
    
    // Parse actual time (totalTime) in format HH:MM:SS
    const [hours, minutes, seconds] = totalTime.split(':').map(num => parseInt(num, 10));
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    
    if (estimatedSeconds <= 0) return 0;
    return Math.min(100, Math.round((totalSeconds / estimatedSeconds) * 100));
  };

  // Handle sessions loaded callback
  const handleSessionsLoaded = (time: string) => {
    setTotalTime(time);
  };

  return (
    <div className={cn("rounded-lg border", className)}>
      <div className="bg-indigo-50 border-b p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-indigo-800 flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Time Tracking
          </h2>
          <div className="flex items-center space-x-2">
            <button 
              className={cn(
                "p-2 rounded-md text-sm",
                !isStatsView ? "bg-indigo-600 text-white" : "bg-white text-indigo-600 border border-indigo-200"
              )}
              onClick={() => setIsStatsView(false)}
            >
              Sessions
            </button>
            <button 
              className={cn(
                "p-2 rounded-md text-sm",
                isStatsView ? "bg-indigo-600 text-white" : "bg-white text-indigo-600 border border-indigo-200"
              )}
              onClick={() => setIsStatsView(true)}
            >
              <BarChart className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Summary Info */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-md border shadow-sm">
            <div className="text-gray-500 text-sm">Total Time</div>
            <div className="text-lg font-mono font-medium">{totalTime}</div>
          </div>
          
          {task.estimated_time ? (
            <div className="bg-white p-3 rounded-md border shadow-sm">
              <div className="text-gray-500 text-sm">Estimated Time</div>
              <div className="flex items-center justify-between">
                <div className="text-lg font-mono font-medium">
                  {task.estimatedTimeMinutes 
                    ? `${Math.floor(task.estimatedTimeMinutes / 60)}h ${task.estimatedTimeMinutes % 60}m`
                    : task.estimated_time}
                </div>
                <div className="text-sm font-medium">
                  {calculateProgress()}%
                </div>
              </div>
              <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full",
                    calculateProgress() > 100 ? "bg-red-500" : 
                    calculateProgress() > 80 ? "bg-amber-500" : "bg-green-500"
                  )}
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white p-3 rounded-md border shadow-sm">
              <div className="text-gray-500 text-sm">Estimated Time</div>
              <div className="text-lg font-medium text-gray-400">Not set</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Time Sessions or Stats View */}
      {!isStatsView ? (
        <div className="p-4">
          <TimeSessionsList 
            taskId={task.id}
            limit={showAll ? undefined : 5}
            onSessionsLoaded={handleSessionsLoaded}
          />
          
          {!showAll && (
            <div className="mt-4 text-center">
              <button 
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100"
                onClick={() => setShowAll(true)}
              >
                Show All Sessions
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="bg-white p-6 rounded-lg border text-center">
            <h3 className="text-lg font-medium mb-6">Time Distribution</h3>
            
            {/* Time distribution chart - simple placeholder */}
            <div className="h-64 flex items-end justify-around space-x-2 mb-4 px-4">
              {[...Array(7)].map((_, i) => {
                const height = Math.floor(Math.random() * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-indigo-200 rounded-t-sm hover:bg-indigo-300 transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <div className="text-xs mt-2 text-gray-500">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-sm text-gray-500 mt-2">
              This is a placeholder for a time statistics view. Full implementation would include daily/weekly charts.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
