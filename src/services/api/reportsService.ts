import { supabase } from '../../lib/supabase';
import {
  formatDurationHumanReadable,
  parseDurationToSeconds,
} from '../../utils/timeUtils';

export interface ReportFilter {
  startDate: Date;
  endDate: Date;
  taskIds?: string[];
  categoryNames?: string[];
  groupBy?: 'task' | 'day' | 'week' | 'category';
}

export interface TimeReportItem {
  id: string;
  label: string;
  value: number; // seconds
  formattedValue: string;
  color?: string;
  count?: number;
}

class ReportsService {
  async getTimeReport(filters: ReportFilter): Promise<TimeReportItem[]> {
    const {
      startDate,
      endDate,
      taskIds,
      categoryNames,
      groupBy = 'task',
    } = filters;

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw userError || new Error('User not authenticated');
    }

    // Build query based on the filter and grouping options
    console.log(
      'Fetching time sessions with filters:',
      JSON.stringify(filters, null, 2)
    );
    const { data, error } = await supabase
      .from('time_sessions')
      .select(
        `
        id, 
        task_id, 
        start_time, 
        end_time, 
        duration, 
        tasks(id, title, category_name, status, is_deleted)
      `
      )
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching time report data:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    console.log(`Found ${data.length} time sessions before filtering`);

    // Filter out sessions with deleted tasks or based on selected task IDs/categories
    const filteredData = data.filter((session) => {
      if (!session.tasks || session.tasks.is_deleted) {
        return false;
      }

      if (taskIds?.length && !taskIds.includes(session.task_id)) {
        return false;
      }

      if (
        categoryNames?.length &&
        !categoryNames.includes(session.tasks.category_name)
      ) {
        return false;
      }

      return true;
    });

    console.log(`After filtering: ${filteredData.length} sessions`);

    // Check if any sessions have duration values
    console.log(
      'Sample session data:',
      filteredData.length > 0
        ? JSON.stringify(filteredData[0], null, 2)
        : 'No sessions'
    );

    // Process the data based on the grouping option
    let groupedData: Record<string, TimeReportItem> = {};

    switch (groupBy) {
      case 'task':
        // Group by task
        filteredData.forEach((session) => {
          const taskId = session.task_id;
          const taskTitle = session.tasks?.title || 'Unknown Task';

          if (!groupedData[taskId]) {
            groupedData[taskId] = {
              id: taskId,
              label: taskTitle,
              value: 0,
              formattedValue: '0m',
              count: 0,
            };
          }

          // Calculate session duration in seconds
          let durationSeconds = 0;

          console.log(
            `Processing session ${session.id} for task "${taskTitle}"`
          );

          // First try to use the duration field if it exists
          if (session.duration) {
            console.log(
              `Session ${session.id} has duration: "${session.duration}"`
            );
            durationSeconds = parseDurationToSeconds(session.duration);
            console.log(`Parsed duration seconds: ${durationSeconds}`);
          }
          // If no duration but we have start and end time, calculate it
          else if (session.start_time && session.end_time) {
            try {
              console.log(
                `Session ${session.id} calculating from start/end times:`,
                session.start_time,
                session.end_time
              );
              const startTime = new Date(session.start_time);
              const endTime = new Date(session.end_time);
              durationSeconds = Math.floor(
                (endTime.getTime() - startTime.getTime()) / 1000
              );
              console.log(`Calculated duration seconds: ${durationSeconds}`);
            } catch (err) {
              console.error(
                'Error calculating duration for session:',
                session.id,
                err
              );
            }
          } else {
            console.warn(`Session ${session.id} has no duration or end_time`);
          }

          // Only add to the total if we have a valid duration
          if (durationSeconds > 0) {
            console.log(
              `Adding ${durationSeconds}s for session ${session.id} (${taskTitle})`
            );
            groupedData[taskId].value += durationSeconds;
            groupedData[taskId].formattedValue = formatDurationHumanReadable(
              groupedData[taskId].value
            );
            groupedData[taskId].count = (groupedData[taskId].count || 0) + 1;
            console.log(
              `Updated total for ${taskTitle}: ${groupedData[taskId].value}s (${groupedData[taskId].formattedValue})`
            );
          } else {
            console.warn(`Session ${session.id} has invalid or zero duration`);
          }
        });
        break;

      case 'category':
        // Group by category
        filteredData.forEach((session) => {
          const categoryName = session.tasks?.category_name || 'Uncategorized';

          if (!groupedData[categoryName]) {
            groupedData[categoryName] = {
              id: categoryName,
              label: categoryName,
              value: 0,
              formattedValue: '0m',
              count: 0,
            };
          }

          // Calculate session duration in seconds
          let durationSeconds = 0;

          console.log(
            `Processing session ${session.id} for category "${categoryName}"`
          );

          // First try to use the duration field if it exists
          if (session.duration) {
            console.log(
              `Session ${session.id} has duration: "${session.duration}"`
            );
            durationSeconds = parseDurationToSeconds(session.duration);
            console.log(`Parsed duration seconds: ${durationSeconds}`);
          }
          // If no duration but we have start and end time, calculate it
          else if (session.start_time && session.end_time) {
            try {
              console.log(
                `Session ${session.id} calculating from start/end times:`,
                session.start_time,
                session.end_time
              );
              const startTime = new Date(session.start_time);
              const endTime = new Date(session.end_time);
              durationSeconds = Math.floor(
                (endTime.getTime() - startTime.getTime()) / 1000
              );
              console.log(`Calculated duration seconds: ${durationSeconds}`);
            } catch (err) {
              console.error(
                'Error calculating duration for session:',
                session.id,
                err
              );
            }
          } else {
            console.warn(`Session ${session.id} has no duration or end_time`);
          }

          // Only add to the total if we have a valid duration
          if (durationSeconds > 0) {
            console.log(
              `Adding ${durationSeconds}s for session ${session.id} (${categoryName})`
            );
            groupedData[categoryName].value += durationSeconds;
            groupedData[categoryName].formattedValue =
              formatDurationHumanReadable(groupedData[categoryName].value);
            groupedData[categoryName].count =
              (groupedData[categoryName].count || 0) + 1;
            console.log(
              `Updated total for ${categoryName}: ${groupedData[categoryName].value}s (${groupedData[categoryName].formattedValue})`
            );
          } else {
            console.warn(`Session ${session.id} has invalid or zero duration`);
          }
        });
        break;

      case 'day':
        // Group by day
        filteredData.forEach((session) => {
          const startDate = new Date(session.start_time);
          const dayStr = startDate.toISOString().split('T')[0]; // Get YYYY-MM-DD part
          const dayDisplay = new Date(dayStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          if (!groupedData[dayStr]) {
            groupedData[dayStr] = {
              id: dayStr,
              label: dayDisplay,
              value: 0,
              formattedValue: '0m',
              count: 0,
            };
          }

          // Calculate session duration in seconds
          let durationSeconds = 0;

          console.log(
            `Processing session ${session.id} for day "${dayDisplay}"`
          );

          // First try to use the duration field if it exists
          if (session.duration) {
            console.log(
              `Session ${session.id} has duration: "${session.duration}"`
            );
            durationSeconds = parseDurationToSeconds(session.duration);
            console.log(`Parsed duration seconds: ${durationSeconds}`);
          }
          // If no duration but we have start and end time, calculate it
          else if (session.start_time && session.end_time) {
            try {
              console.log(
                `Session ${session.id} calculating from start/end times:`,
                session.start_time,
                session.end_time
              );
              const startTime = new Date(session.start_time);
              const endTime = new Date(session.end_time);
              durationSeconds = Math.floor(
                (endTime.getTime() - startTime.getTime()) / 1000
              );
              console.log(`Calculated duration seconds: ${durationSeconds}`);
            } catch (err) {
              console.error(
                'Error calculating duration for session:',
                session.id,
                err
              );
            }
          } else {
            console.warn(`Session ${session.id} has no duration or end_time`);
          }

          // Only add to the total if we have a valid duration
          if (durationSeconds > 0) {
            console.log(
              `Adding ${durationSeconds}s for session ${session.id} (${dayDisplay})`
            );
            groupedData[dayStr].value += durationSeconds;
            groupedData[dayStr].formattedValue = formatDurationHumanReadable(
              groupedData[dayStr].value
            );
            groupedData[dayStr].count = (groupedData[dayStr].count || 0) + 1;
            console.log(
              `Updated total for ${dayDisplay}: ${groupedData[dayStr].value}s (${groupedData[dayStr].formattedValue})`
            );
          } else {
            console.warn(`Session ${session.id} has invalid or zero duration`);
          }
        });
        break;

      case 'week':
        // Group by week
        filteredData.forEach((session) => {
          const startDate = new Date(session.start_time);
          const weekStart = new Date(startDate);
          weekStart.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

          const weekKey = weekStart.toISOString().split('T')[0];
          const weekLabel = `${weekStart.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })} - ${weekEnd.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}`;

          if (!groupedData[weekKey]) {
            groupedData[weekKey] = {
              id: weekKey,
              label: weekLabel,
              value: 0,
              formattedValue: '0m',
              count: 0,
            };
          }

          // Calculate session duration in seconds
          let durationSeconds = 0;

          console.log(
            `Processing session ${session.id} for week "${weekLabel}"`
          );

          // First try to use the duration field if it exists
          if (session.duration) {
            console.log(
              `Session ${session.id} has duration: "${session.duration}"`
            );
            durationSeconds = parseDurationToSeconds(session.duration);
            console.log(`Parsed duration seconds: ${durationSeconds}`);
          }
          // If no duration but we have start and end time, calculate it
          else if (session.start_time && session.end_time) {
            try {
              console.log(
                `Session ${session.id} calculating from start/end times:`,
                session.start_time,
                session.end_time
              );
              const startTime = new Date(session.start_time);
              const endTime = new Date(session.end_time);
              durationSeconds = Math.floor(
                (endTime.getTime() - startTime.getTime()) / 1000
              );
              console.log(`Calculated duration seconds: ${durationSeconds}`);
            } catch (err) {
              console.error(
                'Error calculating duration for session:',
                session.id,
                err
              );
            }
          } else {
            console.warn(`Session ${session.id} has no duration or end_time`);
          }

          // Only add to the total if we have a valid duration
          if (durationSeconds > 0) {
            console.log(
              `Adding ${durationSeconds}s for session ${session.id} (${weekLabel})`
            );
            groupedData[weekKey].value += durationSeconds;
            groupedData[weekKey].formattedValue = formatDurationHumanReadable(
              groupedData[weekKey].value
            );
            groupedData[weekKey].count = (groupedData[weekKey].count || 0) + 1;
            console.log(
              `Updated total for ${weekLabel}: ${groupedData[weekKey].value}s (${groupedData[weekKey].formattedValue})`
            );
          } else {
            console.warn(`Session ${session.id} has invalid or zero duration`);
          }
        });
        break;
    }

    // Get results as array of TimeReportItem objects
    const result = Object.values(groupedData);

    // Debug the final results
    console.log('Final time report data:', JSON.stringify(result, null, 2));

    // Sort by value in descending order (most time first)
    return result.sort((a, b) => b.value - a.value);
  }

  async getProductivityReport(filters: ReportFilter): Promise<any[]> {
    // Basic implementation that calculates productivity metrics
    // For now, we'll calculate tasks completed per day in the date range
    const { startDate, endDate } = filters;

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw userError || new Error('User not authenticated');
    }

    // Fetch completed tasks in the date range
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('created_by', user.id)
      .eq('is_deleted', false)
      .eq('status', 'completed')
      .gte('updated_at', startDate.toISOString())
      .lte('updated_at', endDate.toISOString());

    if (error) {
      console.error('Error fetching productivity data:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by day
    const groupedByDay: Record<string, any> = {};
    data.forEach((task) => {
      const updatedDate = new Date(task.updated_at);
      const dayKey = updatedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayLabel = updatedDate.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = {
          id: dayKey,
          label: dayLabel,
          value: 0,
          formattedValue: '0 tasks',
        };
      }

      groupedByDay[dayKey].value += 1;
      groupedByDay[
        dayKey
      ].formattedValue = `${groupedByDay[dayKey].value} tasks`;
    });

    // Convert to array and sort by date
    return Object.values(groupedByDay).sort(
      (a, b) => new Date(a.id).getTime() - new Date(b.id).getTime()
    );
  }

  async getTaskCompletionReport(filters: ReportFilter): Promise<any[]> {
    // Implementation to show task completion rate by category
    const { startDate, endDate, categoryNames } = filters;

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw userError || new Error('User not authenticated');
    }

    // Fetch all tasks in the date range
    const query = supabase
      .from('tasks')
      .select('*, category_name')
      .eq('created_by', user.id)
      .eq('is_deleted', false)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (categoryNames?.length) {
      query.in('category_name', categoryNames);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching task completion data:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by category
    const groupedByCategory: Record<string, any> = {};
    data.forEach((task) => {
      const categoryName = task.category_name || 'Uncategorized';

      if (!groupedByCategory[categoryName]) {
        groupedByCategory[categoryName] = {
          id: categoryName,
          label: categoryName,
          totalTasks: 0,
          completedTasks: 0,
          value: 0, // completion percentage
          formattedValue: '0%',
        };
      }

      groupedByCategory[categoryName].totalTasks += 1;

      if (task.status === 'completed') {
        groupedByCategory[categoryName].completedTasks += 1;
      }
    });

    // Calculate completion percentages
    Object.values(groupedByCategory).forEach((category: any) => {
      if (category.totalTasks > 0) {
        category.value = (category.completedTasks / category.totalTasks) * 100;
        category.formattedValue = `${Math.round(category.value)}%`;
      }
    });

    // Convert to array and sort by completion rate (descending)
    return Object.values(groupedByCategory).sort(
      (a: any, b: any) => b.value - a.value
    );
  }
}

export const reportsService = new ReportsService();
