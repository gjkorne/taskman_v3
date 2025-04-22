import { useMemo } from 'react';
import { useTaskApp } from '../../contexts/task';
import { useTimeSession } from '../../contexts/timeSession';
import type { TimeSession } from '../../contexts/timeSession/types';
import { addDays, differenceInDays, subDays } from 'date-fns';

/**
 * Hook that analyzes productivity trends over time
 * Combines task completion and time tracking data for comprehensive metrics
 * Uses our optimized context structure for better performance
 */
export function useProductivityTrends(days: number = 14) {
  const { tasks } = useTaskApp();
  const { queries: { sessions } } = useTimeSession();

  return useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, days - 1);

    // Initialize data structures
    const dailyData: {
      date: Date;
      tasksCompleted: number;
      tasksCreated: number;
      minutesTracked: number;
      productivity: number; // Tasks completed per hour worked
    }[] = [];

    // Initialize array with dates
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      dailyData.push({
        date,
        tasksCompleted: 0,
        tasksCreated: 0,
        minutesTracked: 0,
        productivity: 0,
      });
    }

    // Process tasks in a single pass
    tasks.forEach((task) => {
      // Skip deleted tasks
      if (task.is_deleted) return;

      // Count completed tasks by date
      if (task.status === 'completed' && task.updated_at) {
        const completedDate = new Date(task.updated_at);
        const dayIndex = differenceInDays(completedDate, startDate);
        if (dayIndex >= 0 && dayIndex < days) {
          dailyData[dayIndex].tasksCompleted++;
        }
      }

      // Count created tasks by date
      if (task.created_at) {
        const createdDate = new Date(task.created_at);
        const dayIndex = differenceInDays(createdDate, startDate);
        if (dayIndex >= 0 && dayIndex < days) {
          dailyData[dayIndex].tasksCreated++;
        }
      }
    });

    // Process time tracking data
    sessions.forEach((session: TimeSession) => {
      if (!session.start_time) return;

      const startTime = new Date(session.start_time);
      // Only include sessions in our date range
      const dayIndex = differenceInDays(startTime, startDate);
      if (dayIndex >= 0 && dayIndex < days) {
        // Calculate minutes tracked
        const endTime = session.end_time
          ? new Date(session.end_time)
          : new Date();
        const durationMs = endTime.getTime() - startTime.getTime();
        const minutes = Math.round(durationMs / (1000 * 60));

        dailyData[dayIndex].minutesTracked += minutes;
      }
    });

    // Calculate productivity metrics
    dailyData.forEach((day) => {
      // Calculate tasks completed per hour worked
      if (day.minutesTracked > 0) {
        day.productivity = (day.tasksCompleted / day.minutesTracked) * 60;
      }
    });

    // Calculate trends
    const trends = {
      // Overall metrics
      totalTasksCompleted: dailyData.reduce(
        (sum, day) => sum + day.tasksCompleted,
        0
      ),
      totalTasksCreated: dailyData.reduce(
        (sum, day) => sum + day.tasksCreated,
        0
      ),
      totalHoursTracked:
        dailyData.reduce((sum, day) => sum + day.minutesTracked, 0) / 60,

      // Moving averages
      weeklyCompletionRate: 0,
      weeklyProductivity: 0,

      // Daily data for charts
      dailyData,
    };

    // Calculate weekly moving averages if we have enough data
    if (days >= 7) {
      const last7Days = dailyData.slice(-7);
      const totalCompletedLast7Days = last7Days.reduce(
        (sum, day) => sum + day.tasksCompleted,
        0
      );
      const totalCreatedLast7Days = last7Days.reduce(
        (sum, day) => sum + day.tasksCreated,
        0
      );
      const totalMinutesLast7Days = last7Days.reduce(
        (sum, day) => sum + day.minutesTracked,
        0
      );

      // Tasks completed vs created rate
      trends.weeklyCompletionRate =
        totalCreatedLast7Days > 0
          ? totalCompletedLast7Days / totalCreatedLast7Days
          : 0;

      // Weekly average productivity
      trends.weeklyProductivity =
        totalMinutesLast7Days > 0
          ? (totalCompletedLast7Days / totalMinutesLast7Days) * 60
          : 0;
    }

    return trends;
  }, [tasks, sessions, days]);
}

export default useProductivityTrends;
