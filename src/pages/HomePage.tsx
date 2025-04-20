import { TaskOverviewWidget } from '../components/Dashboard/TaskOverviewWidget';
import { TimeTrackingWidget } from '../components/Dashboard/TimeTrackingWidget';
import { ProjectProgressWidget } from '../components/Dashboard/ProjectProgressWidget';
import { UpcomingTasksWidget } from '../components/Dashboard/UpcomingTasksWidget';
import { RecentTasksWidget } from '../components/Dashboard/RecentTasksWidget';

const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium transition duration-250">
            Today
          </button>
          <button className="px-4 py-2 bg-taskman-blue-500 text-white rounded hover:bg-taskman-blue-600 text-sm font-medium transition duration-250">
            This Week
          </button>
          <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium transition duration-250">
            This Month
          </button>
        </div>
      </div>

      {/* Widget Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Row 1 - Key Metrics */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2">
          <TaskOverviewWidget title="Task Overview" />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <TimeTrackingWidget title="Time Tracking" />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <ProjectProgressWidget title="Projects" />
        </div>

        {/* Row 2 - Recent Tasks Widget */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <RecentTasksWidget title="Recent Activity" limit={6} />
        </div>

        {/* Row 3 - Detail Widgets */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <UpcomingTasksWidget title="Upcoming Tasks" />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
