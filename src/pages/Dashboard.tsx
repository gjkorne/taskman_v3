import { useEffect } from 'react';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import TaskOverviewWidget from '../components/Dashboard/TaskOverviewWidget';
import TimeTrackingWidget from '../components/Dashboard/TimeTrackingWidget';
import ProjectProgressWidget from '../components/Dashboard/ProjectProgressWidget';
import ProductivityTrendsWidget from '../components/Dashboard/ProductivityTrendsWidget';
import TaskPriorityWidget from '../components/Dashboard/TaskPriorityWidget';
import UpcomingTasksWidget from '../components/Dashboard/UpcomingTasksWidget';
import { useTaskData } from '../contexts/task';
import { useTimeSessionData } from '../contexts/timeSession';

/**
 * Dashboard page component that uses our new context pattern
 * This demonstrates how to leverage the separation of data and UI concerns
 * and our new React Query implementation for optimal performance
 */
export function Dashboard() {
  // Get task and time session data functions from our contexts
  const { fetchTasks, isLoading: isTasksLoading } = useTaskData();
  const { fetchSessions, isLoading: isSessionsLoading } = useTimeSessionData();

  // Fetch initial data on mount
  useEffect(() => {
    fetchTasks();
    fetchSessions();
  }, [fetchTasks, fetchSessions]);

  // Show loading state while data is being fetched
  if (isTasksLoading && isSessionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Task overview widget - spans 2 columns on larger screens */}
      <TaskOverviewWidget />

      {/* Task Priority Widget - spans 1 column */}
      <TaskPriorityWidget />

      {/* Time tracking widget - spans 1 column */}
      <TimeTrackingWidget />

      {/* Upcoming Tasks Widget - shows tasks with upcoming due dates */}
      <UpcomingTasksWidget />

      {/* Project progress widget - spans 2 columns */}
      <ProjectProgressWidget />

      {/* Productivity trends widget - spans 2 columns and 2 rows */}
      <ProductivityTrendsWidget />
    </DashboardLayout>
  );
}

export default Dashboard;
