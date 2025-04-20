import { useState, useEffect, useMemo } from 'react';
import { useTimeSessionData } from '../../contexts/timeSession';
import { formatMillisecondsToTime } from '../../utils/timeUtils';

/**
 * Custom hook that provides time tracking metrics for dashboard displays
 * Takes advantage of our optimized context structure with proper memoization
 */
export function useTimeTrackingMetrics() {
  const { sessions, calculateTodayTimeSpent, calculateWeekTimeSpent } =
    useTimeSessionData();
  const [timeSpentToday, setTimeSpentToday] = useState(0);
  const [timeSpentThisWeek, setTimeSpentThisWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load time metrics on mount
  useEffect(() => {
    const loadTimeMetrics = async () => {
      setIsLoading(true);
      try {
        const [today, week] = await Promise.all([
          calculateTodayTimeSpent(),
          calculateWeekTimeSpent(),
        ]);

        setTimeSpentToday(today);
        setTimeSpentThisWeek(week);
      } catch (error) {
        console.error('Error loading time metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimeMetrics();
  }, [calculateTodayTimeSpent, calculateWeekTimeSpent]);

  // Calculate time metrics from sessions
  const metrics = useMemo(() => {
    // Start with our pre-calculated values
    const result = {
      timeSpentToday,
      timeSpentThisWeek,

      // Formatted display values
      formattedTimeToday: formatMillisecondsToTime(timeSpentToday),
      formattedTimeThisWeek: formatMillisecondsToTime(timeSpentThisWeek),

      // Start with empty category and task time tracking
      categoryTimeDistribution: {} as Record<string, number>,
      taskTimeDistribution: {} as Record<
        string,
        {
          taskId: string;
          taskName: string;
          timeSpent: number;
          formattedTime: string;
        }
      >,

      // Most active times
      mostActiveHour: 0,
      mostActiveDay: 0, // 0 = Sunday, 1 = Monday, etc.

      isLoading,
    };

    // Skip further calculations if we're still loading or have no sessions
    if (isLoading || sessions.length === 0) {
      return result;
    }

    // Initialize hourly and daily tracking
    const hourCounts = Array(24).fill(0);
    const dayCounts = Array(7).fill(0);

    // Process sessions to calculate time distribution by category and task
    sessions.forEach((session) => {
      if (session.is_deleted) return;

      // We need start_time and either end_time or assume it's ongoing
      if (!session.start_time) return;

      const startTime = new Date(session.start_time);
      const endTime = session.end_time
        ? new Date(session.end_time)
        : new Date();

      // Calculate duration in milliseconds
      const duration = endTime.getTime() - startTime.getTime();
      if (duration <= 0) return;

      // Track by hour and day for activity patterns
      hourCounts[startTime.getHours()] += duration;
      dayCounts[startTime.getDay()] += duration;

      // Track by task
      if (session.task_id) {
        const taskKey = session.task_id;
        if (!result.taskTimeDistribution[taskKey]) {
          result.taskTimeDistribution[taskKey] = {
            taskId: session.task_id,
            taskName: session.tasks?.title || 'Unknown Task',
            timeSpent: 0,
            formattedTime: '',
          };
        }

        result.taskTimeDistribution[taskKey].timeSpent += duration;
        result.taskTimeDistribution[taskKey].formattedTime =
          formatMillisecondsToTime(
            result.taskTimeDistribution[taskKey].timeSpent
          );
      }

      // Track by category
      const category = session.tasks?.category_name || 'Uncategorized';
      if (category) {
        if (!result.categoryTimeDistribution[category]) {
          result.categoryTimeDistribution[category] = 0;
        }
        result.categoryTimeDistribution[category] += duration;
      }
    });

    // Find most active hour and day
    result.mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
    result.mostActiveDay = dayCounts.indexOf(Math.max(...dayCounts));

    return result;
  }, [sessions, timeSpentToday, timeSpentThisWeek, isLoading]);

  return metrics;
}

/**
 * Hook to get time tracked this week formatted for dashboard display
 */
export function useWeekTimeTracked() {
  const { timeSpentThisWeek, formattedTimeThisWeek, isLoading } =
    useTimeTrackingMetrics();

  // Return just what's needed for the dashboard time widget
  return {
    timeSpentThisWeek,
    formattedTimeThisWeek,
    isLoading,
    // Calculate hours for display purposes (show as 16h for example)
    hours: Math.floor(timeSpentThisWeek / (1000 * 60 * 60)),
  };
}

/**
 * Hook to get time tracked by project/category for dashboard
 */
export function useTimeByCategory() {
  const { categoryTimeDistribution, isLoading } = useTimeTrackingMetrics();

  return useMemo(() => {
    // Convert the distribution object to an array for easier rendering
    const categories = Object.entries(categoryTimeDistribution)
      .map(([name, timeSpent]) => ({
        name,
        timeSpent,
        formattedTime: formatMillisecondsToTime(timeSpent),
      }))
      .sort((a, b) => b.timeSpent - a.timeSpent);

    return {
      categories,
      isLoading,
    };
  }, [categoryTimeDistribution, isLoading]);
}
