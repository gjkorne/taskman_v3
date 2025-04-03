import { useState, useEffect } from 'react';
import { format, subDays, parseISO, differenceInSeconds } from 'date-fns';
import { Calendar, Clock, Download } from 'lucide-react';
import { TimeSessionsList } from '../components/TimeSessions/TimeSessionsList';
import { timeSessionsService } from '../services/api/timeSessionsService';
import type { TimeSession } from '../services/api/timeSessionsService';
import { parseDurationToSeconds, formatSecondsToTime, isSameDay, isSameWeek, isSameMonth } from '../utils/timeUtils';

export function TimeSessionsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  });
  const [isExporting, setIsExporting] = useState(false);
  const [allSessions, setAllSessions] = useState<TimeSession[]>([]);
  const [timeStats, setTimeStats] = useState({
    today: '00:00:00',
    week: '00:00:00',
    month: '00:00:00'
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch sessions and calculate time stats
  useEffect(() => {
    const fetchSessions = async () => {
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
        console.error('Error fetching time sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Calculate time for different periods
  const calculateTimeStats = (sessions: TimeSession[]) => {
    const now = new Date();

    // Calculate totals for each period
    let todaySeconds = 0;
    let weekSeconds = 0;
    let monthSeconds = 0;

    sessions.forEach(session => {
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
      console.error('Error exporting sessions:', error);
      alert('Failed to export sessions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle date range changes
  const handleDateChange = (type: 'startDate' | 'endDate') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({
      ...prev,
      [type]: new Date(e.target.value)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Time Sessions
        </h1>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-1 bg-white border rounded-md px-2 py-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={format(dateRange.startDate, 'yyyy-MM-dd')}
                onChange={handleDateChange('startDate')}
                className="text-sm border-none focus:ring-0"
              />
            </div>
            <span className="text-gray-500">to</span>
            <div className="flex items-center space-x-1 bg-white border rounded-md px-2 py-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={format(dateRange.endDate, 'yyyy-MM-dd')}
                onChange={handleDateChange('endDate')}
                className="text-sm border-none focus:ring-0"
              />
            </div>
          </div>

          <button
            onClick={exportSessions}
            disabled={isExporting}
            className="flex items-center space-x-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
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

      {/* Sessions List */}
      <div className="bg-white border rounded-lg shadow-sm">
        <TimeSessionsList />
      </div>
    </div>
  );
}
