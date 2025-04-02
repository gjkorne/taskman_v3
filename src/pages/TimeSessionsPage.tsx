import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Calendar, Clock, Download } from 'lucide-react';
import { TimeSessionsList } from '../components/TimeSessions/TimeSessionsList';
import { timeSessionsService } from '../services/api/timeSessionsService';

export function TimeSessionsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  });
  const [isExporting, setIsExporting] = useState(false);
  
  // Export sessions as CSV
  const exportSessions = async () => {
    setIsExporting(true);
    
    try {
      // Get all user sessions for the selected date range
      const sessions = await timeSessionsService.getSessionsByDateRange(
        dateRange.startDate,
        dateRange.endDate
      );
      
      // Format sessions for CSV
      const csvContent = [
        // Header row
        'Task ID,Task Title,Start Time,End Time,Duration,Category',
        // Data rows
        ...sessions.map((session: any) => {
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
          <div className="mt-1 text-3xl font-medium text-indigo-600 font-mono">00:00:00</div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-lg font-medium">This Week</div>
          <div className="mt-1 text-3xl font-medium text-indigo-600 font-mono">00:00:00</div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="text-lg font-medium">This Month</div>
          <div className="mt-1 text-3xl font-medium text-indigo-600 font-mono">00:00:00</div>
        </div>
      </div>
      
      {/* Sessions List */}
      <div className="bg-white border rounded-lg shadow-sm">
        <TimeSessionsList />
      </div>
    </div>
  );
}
