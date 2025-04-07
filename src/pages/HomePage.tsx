import { TaskOverviewWidget } from '../components/Dashboard/TaskOverviewWidget';
import { UpcomingTasksWidget } from '../components/Dashboard/UpcomingTasksWidget';
import { RecentTasksWidget } from '../components/Dashboard/RecentTasksWidget';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  // Function to navigate to a specific route
  const handleNavigation = (route: string) => {
    navigate(route);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* Widget Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Row 1 - Key Metrics (split evenly) */}
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <TaskOverviewWidget />
        </div>
        
        <div className="col-span-1 md:col-span-1 lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => handleNavigation('/tasks')}
                className="w-full py-2 px-4 bg-taskman-blue-500 text-white rounded hover:bg-taskman-blue-600 transition duration-250 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create New Task
              </button>
              <button 
                onClick={() => handleNavigation('/timer')}
                className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition duration-250 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Start Timer
              </button>
              <button 
                onClick={() => handleNavigation('/reports')}
                className="w-full py-2 px-4 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition duration-250 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
                View Reports
              </button>
            </div>
          </div>
        </div>
        
        {/* Row 2 - Recent tasks and productivity */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <RecentTasksWidget title="Recently Worked Tasks" limit={5} />
        </div>

        {/* Row 3 - Task and Project data */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <UpcomingTasksWidget />
        </div>
      </div>  
    </div>
  );
}

export default HomePage;
