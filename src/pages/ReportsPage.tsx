import { useState, useEffect } from 'react';
import { subDays } from 'date-fns';
import { ReportFilters } from '../components/Reports/ReportFilters';
import { TimeReportView } from '../components/Reports/TimeReportView';
import { ProductivityView } from '../components/Reports/ProductivityView';
import { TaskCompletionView } from '../components/Reports/TaskCompletionView';
import { ReportFilter, reportsService, TimeReportItem } from '../services/api/reportsService';
import { supabase } from '../lib/supabase';
import { parseDurationToSeconds, formatDurationHumanReadable, msToPostgresInterval } from '../utils/timeUtils';

export function ReportsPage() {
  const [activeReport, setActiveReport] = useState<'time' | 'productivity' | 'completion'>('time');
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    groupBy: 'task'
  });
  const [timeReportData, setTimeReportData] = useState<TimeReportItem[]>([]);
  const [productivityData, setProductivityData] = useState<any[]>([]);
  const [completionData, setCompletionData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugResults, setDebugResults] = useState<string>('');

  // Fetch categories for filters
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data, error } = await supabase
          .from('tasks')
          .select('category_name')
          .eq('created_by', userData.user.id)
          .eq('is_deleted', false)
          .not('category_name', 'is', null);

        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(
            data
              .map(task => task.category_name)
              .filter(Boolean) as string[]
          )
        );

        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error in fetchCategories:', error);
      }
    }

    fetchCategories();
  }, []);

  // Fetch report data when filters or active report change
  useEffect(() => {
    fetchReportData();
  }, [filters, activeReport]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      switch (activeReport) {
        case 'time':
          const timeData = await reportsService.getTimeReport(filters);
          setTimeReportData(timeData);
          break;
        case 'productivity':
          const productivityData = await reportsService.getProductivityReport(filters);
          setProductivityData(productivityData);
          break;
        case 'completion':
          const completionData = await reportsService.getTaskCompletionReport(filters);
          setCompletionData(completionData);
          break;
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug function to directly query and fix the time sessions
  const debugTimeSessions = async () => {
    setIsDebugMode(true);
    setDebugResults('Loading time session data...');
    setIsLoading(true);
    
    try {
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw userError || new Error('User not authenticated');
      }
      
      // Direct query to get raw time session data
      const { data, error } = await supabase
        .from('time_sessions')
        .select(`
          id, 
          task_id, 
          start_time, 
          end_time, 
          duration, 
          tasks(id, title, category_name)
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .limit(20)
        .order('start_time', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Fix sessions with missing durations
      const sessionsToFix = data.filter(session => 
        session.start_time && session.end_time && !session.duration
      );
      
      let fixResults = '';
      
      if (sessionsToFix.length > 0) {
        fixResults = `Found ${sessionsToFix.length} sessions with missing durations. Fixing now...\n`;
        
        // Fix each session
        for (const session of sessionsToFix) {
          const startTime = new Date(session.start_time);
          const endTime = new Date(session.end_time);
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationInterval = msToPostgresInterval(durationMs);
          
          // Update the session with the calculated duration
          const { error: updateError } = await supabase
            .from('time_sessions')
            .update({ duration: durationInterval })
            .eq('id', session.id);
          
          if (updateError) {
            fixResults += `Error fixing session ${session.id}: ${updateError.message}\n`;
          } else {
            fixResults += `Fixed session ${session.id} - added duration: ${durationInterval}\n`;
          }
        }
        
        // Refresh reports after fixing
        await fetchReportData();
      } else {
        fixResults = "No sessions with missing durations found. Checking for other issues...\n";
      }
      
      // Create summary of all sessions
      const sessionSummary = data.map(session => {
        const startTime = new Date(session.start_time).toLocaleString();
        const endTime = session.end_time ? new Date(session.end_time).toLocaleString() : 'In progress';
        const durationStr = session.duration || 'Not set';
        const taskTitle = session.tasks?.title || 'Unknown task';
        
        // Check if parseDurationToSeconds can handle this format
        let parsedDuration = 'N/A';
        try {
          const seconds = parseDurationToSeconds(session.duration);
          const formatted = formatDurationHumanReadable(seconds);
          parsedDuration = `${seconds}s (${formatted})`;
        } catch (err: any) {
          parsedDuration = `Error: ${err.message || 'Unknown error'}`;
        }
        
        return `
Session ID: ${session.id}
Task: ${taskTitle}
Start: ${startTime}
End: ${endTime}
Raw Duration: ${durationStr}
Parsed Duration: ${parsedDuration}
---------------------------------------`;
      }).join('\n');
      
      setDebugResults(`
==== REPORT DEBUG RESULTS ====
${fixResults}

==== SESSION DATA ====
${sessionSummary}
      `);
      
    } catch (err: any) {
      setDebugResults(`Error in debug: ${err.message || 'Unknown error'}`);
      console.error('Debug error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Force re-calculation of time report directly
  const forceRecalculateTimeReport = async () => {
    setIsLoading(true);
    try {
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw userError || new Error('User not authenticated');
      }
      
      // Direct query to get time sessions with needed information
      const { data, error } = await supabase
        .from('time_sessions')
        .select(`
          id, 
          task_id, 
          start_time, 
          end_time, 
          duration, 
          tasks(id, title, category_name)
        `)
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('start_time', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Filter by date range
      const filteredSessions = data.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= filters.startDate && sessionDate <= filters.endDate;
      });
      
      console.log(`Found ${filteredSessions.length} sessions in date range`);
      
      // Group by task directly
      const taskGroups: Record<string, {
        id: string;
        label: string;
        value: number;
        formattedValue: string;
        count: number;
      }> = {};
      
      let totalDuration = 0;
      
      // Process each session
      filteredSessions.forEach(session => {
        if (!session.tasks || session.tasks.is_deleted) return;
        
        const taskId = session.task_id;
        const taskTitle = session.tasks?.title || 'Unknown Task';
        
        if (!taskGroups[taskId]) {
          taskGroups[taskId] = {
            id: taskId,
            label: taskTitle,
            value: 0,
            formattedValue: '0m',
            count: 0
          };
        }
        
        // Calculate duration in seconds
        let durationSeconds = 0;
        
        if (session.duration) {
          durationSeconds = parseDurationToSeconds(session.duration);
          console.log(`Session ${session.id} - "${taskTitle}" - duration: "${session.duration}" → ${durationSeconds}s`);
        } else if (session.start_time && session.end_time) {
          const startTime = new Date(session.start_time);
          const endTime = new Date(session.end_time);
          durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
          console.log(`Session ${session.id} - "${taskTitle}" - calculated: ${durationSeconds}s from times`);
        }
        
        if (durationSeconds > 0) {
          taskGroups[taskId].value += durationSeconds;
          taskGroups[taskId].formattedValue = formatDurationHumanReadable(taskGroups[taskId].value);
          taskGroups[taskId].count++;
          totalDuration += durationSeconds;
          
          console.log(`Updated "${taskTitle}" total: ${taskGroups[taskId].value}s (${taskGroups[taskId].formattedValue})`);
        }
      });
      
      // Convert to array
      const timeReportItems = Object.values(taskGroups);
      
      // Sort by most time first
      timeReportItems.sort((a, b) => b.value - a.value);
      
      console.log(`Recalculated time report: ${timeReportItems.length} items, total duration: ${totalDuration}s`);
      console.log('Items:', timeReportItems);
      
      // Update the state with our manually calculated data
      setTimeReportData(timeReportItems);
      
    } catch (error: any) {
      console.error('Error in force recalculation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => setActiveReport('time')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeReport === 'time' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            Time Tracking
          </button>
          <button
            onClick={() => setActiveReport('productivity')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeReport === 'productivity' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            Productivity
          </button>
          <button
            onClick={() => setActiveReport('completion')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeReport === 'completion' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            Task Completion
          </button>
        </div>
      </div>
      
      <ReportFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
        categories={categories}
      />
      
      {isDebugMode && (
        <div className="mb-6 bg-gray-50 border p-4 rounded-lg overflow-auto text-sm font-mono" style={{maxHeight: '300px'}}>
          <div className="flex justify-between mb-2">
            <h3 className="font-bold">Debug Results</h3>
            <button 
              className="text-xs text-gray-500 hover:text-gray-700" 
              onClick={() => setIsDebugMode(false)}
            >
              Close
            </button>
          </div>
          <pre className="whitespace-pre-wrap">{debugResults}</pre>
        </div>
      )}
      
      <div className="mb-4 flex justify-end space-x-2">
        <button 
          onClick={debugTimeSessions}
          className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
        >
          Fix Time Sessions
        </button>
        
        <button 
          onClick={forceRecalculateTimeReport}
          className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200"
        >
          Recalculate Time Report
        </button>
      </div>
      
      {activeReport === 'time' && (
        <TimeReportView data={timeReportData} isLoading={isLoading} />
      )}
      
      {activeReport === 'productivity' && (
        <ProductivityView data={productivityData} isLoading={isLoading} />
      )}
      
      {activeReport === 'completion' && (
        <TaskCompletionView data={completionData} isLoading={isLoading} />
      )}
    </div>
  );
}
