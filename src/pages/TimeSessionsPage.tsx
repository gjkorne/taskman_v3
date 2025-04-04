import { useState, useEffect } from 'react';
import { format, subDays, parseISO, differenceInSeconds } from 'date-fns';
import { Calendar, Clock, Download, RefreshCw } from 'lucide-react';
import { TimeSessionsList } from '../components/TimeSessions/TimeSessionsList';
import { timeSessionsService, TimeSession } from '../services/api/timeSessionsService';
import { parseDurationToSeconds, formatSecondsToTime, isSameDay, isSameWeek, isSameMonth } from '../utils/timeUtils';
import { createLogger } from '../utils/logging';

const logger = createLogger('TimeSessionsPage');

export function TimeSessionsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allSessions, setAllSessions] = useState<TimeSession[]>([]);
  const [timeStats, setTimeStats] = useState({
    today: '00:00:00',
    week: '00:00:00',
    month: '00:00:00'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sessions and calculate time stats
  useEffect(() => {
    fetchSessionsAndCalculateStats();
  }, []);

  // Fetch sessions and calculate stats
  const fetchSessionsAndCalculateStats = async () => {
    setIsLoading(true);
    try {
      // We need to fetch all sessions for the current month to calculate totals
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const data = await timeSessionsService.getSessionsByDateRange(monthStart, now);
      setAllSessions(data);

      // Calculate time stats
      calculateTimeStats(data);
    } catch (error) {
      logger.error('Error fetching time sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSessionsAndCalculateStats();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate time for different periods
  const calculateTimeStats = (sessions: TimeSession[]) => {
    logger.log('Calculating time stats with', sessions.length, 'sessions');
    const now = new Date();

    // Calculate totals for each period
    let todaySeconds = 0;
    let weekSeconds = 0;
    let monthSeconds = 0;

    // Filter out sessions that have deleted tasks or no task data
    const validSessions = sessions.filter(session => {
      // If the task is deleted or doesn't exist, skip this session
      if (!session.tasks || session.tasks.is_deleted) {
        logger.log('Skipping session for deleted/missing task:', session.id);
        return false;
      }
      return true;
    });

    logger.log('After filtering, using', validSessions.length, 'valid sessions for calculations');

    validSessions.forEach(session => {
      const startTime = parseISO(session.start_time);
      
      // Make sure we handle the duration correctly
      let durationSeconds = 0;
      
      if (session.duration) {
        durationSeconds = parseDurationToSeconds(session.duration);
      } else if (session.end_time) {
        // Calculate from start and end time if duration is missing
        const endTime = parseISO(session.end_time);
        durationSeconds = differenceInSeconds(endTime, startTime);
      }
      
      // Ensure we have a positive number
      durationSeconds = Math.max(0, durationSeconds);

      // Check if session is within today
      if (isSameDay(startTime, now)) {
        todaySeconds += durationSeconds;
      }

      // Check if session is within this week
      if (isSameWeek(startTime, now)) {
        weekSeconds += durationSeconds;
      }

      // Check if session is within this month
      if (isSameMonth(startTime, now)) {
        monthSeconds += durationSeconds;
      }
    });

    logger.log('Time totals calculated:', {
      today: formatSecondsToTime(todaySeconds),
      week: formatSecondsToTime(weekSeconds),
      month: formatSecondsToTime(monthSeconds)
    });

    setTimeStats({
      today: formatSecondsToTime(todaySeconds),
      week: formatSecondsToTime(weekSeconds),
      month: formatSecondsToTime(monthSeconds)
    });
  };

  // Export sessions as CSV
  const exportSessions = async () => {
    setIsExporting(true);

    try {
      // Get all user sessions for the selected date range
      const sessions = await timeSessionsService.getSessionsByDateRange(
        dateRange.startDate,
        dateRange.endDate
      );
      
      // If date range matches current state, use cached sessions
      const sessionsToExport = 
        dateRange.startDate.getTime() === new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() && 
        dateRange.endDate.getTime() === new Date().getTime() 
          ? allSessions 
          : sessions;

      // Format sessions for CSV
      const csvContent = [
        // Header row
        'Task ID,Task Title,Start Time,End Time,Duration,Category',
        // Data rows
        ...sessionsToExport.map((session: any) => {
          const startTime = session.start_time ? new Date(session.start_time).toISOString() : '';
          const endTime = session.end_time ? new Date(session.end_time).toISOString() : '';
          const taskTitle = session.tasks?.title || 'Unknown Task';
          const category = session.tasks?.category_name || 'Uncategorized';

          return `"${session.task_id}","${taskTitle}","${startTime}","${endTime}","${session.duration || ''}","${category}"`;
        })
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.setAttribute('href', url);
      link.setAttribute('download', `time-sessions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      logger.error('Error exporting sessions:', error);
      alert('Failed to export sessions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border">
        {/* Date Range */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="date"
              value={format(dateRange.startDate, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({...dateRange, startDate: new Date(e.target.value)})}
              className="pl-10 pr-3 py-2 border rounded text-sm"
            />
          </div>
          <span className="text-gray-500">to</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="date"
              value={format(dateRange.endDate, 'yyyy-MM-dd')}
              onChange={(e) => setDateRange({...dateRange, endDate: new Date(e.target.value)})}
              className="pl-10 pr-3 py-2 border rounded text-sm"
            />
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2 w-full sm:w-auto justify-end">
          {/* Recalculate button - calculates time totals without a full refresh */}
          <button 
            onClick={() => calculateTimeStats(allSessions)}
            className="flex items-center px-4 py-2 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
            title="Recalculate time totals without refreshing data"
          >
            <Clock className="h-4 w-4 mr-2" />
            <span>Recalculate</span>
          </button>
          
          {/* Refresh button - fetches fresh data */}
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          
          {/* Export CSV button */}
          <button 
            onClick={exportSessions}
            disabled={isExporting}
            className="flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-lg font-medium">Today</div>
          <div className="mt-1 text-3xl font-medium text-indigo-600 font-mono">
            {isLoading ? (
              <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
            ) : (
              timeStats.today
            )}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-lg font-medium">This Week</div>
          <div className="mt-1 text-3xl font-medium text-indigo-600 font-mono">
            {isLoading ? (
              <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
            ) : (
              timeStats.week
            )}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-lg font-medium">This Month</div>
          <div className="mt-1 text-3xl font-medium text-indigo-600 font-mono">
            {isLoading ? (
              <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
            ) : (
              timeStats.month
            )}
          </div>
        </div>
      </div>

      {/* Time Sessions List */}
      <div className="mt-6">
        <TimeSessionsList 
          className="p-4 bg-white rounded-lg shadow" 
          onSessionsLoaded={(time) => logger.log('Sessions loaded with total time:', time)}
          onSessionDeleted={handleRefresh} 
        />
      </div>
    </div>
  );
}
