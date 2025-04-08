import { ReactNode, useState } from 'react';
import { MainHeader } from '../UI/MainHeader';
import { OfflineIndicator } from '../UI/OfflineIndicator';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * DashboardLayout component - serves as the container for dashboard widgets
 * This component manages the grid structure and responsive layout
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex flex-col h-screen">
      <MainHeader />
      
      <div className="flex flex-1 overflow-hidden bg-slate-50">
        {/* Sidebar */}
        <div className={`
          transition-all duration-300 ease-in-out overflow-y-auto bg-white shadow-sm
          ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-64 opacity-100'}
        `}>
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Navigation</h2>
            <ul className="space-y-2">
              <li><a href="#" className="block p-2 hover:bg-gray-100 rounded transition duration-250">Dashboard</a></li>
              <li><a href="#" className="block p-2 hover:bg-gray-100 rounded transition duration-250">Projects</a></li>
              <li><a href="#" className="block p-2 hover:bg-gray-100 rounded transition duration-250">Tasks</a></li>
              <li><a href="#" className="block p-2 hover:bg-gray-100 rounded transition duration-250">Calendar</a></li>
              <li><a href="#" className="block p-2 hover:bg-gray-100 rounded transition duration-250">Reports</a></li>
              <li><a href="#" className="block p-2 hover:bg-gray-100 rounded transition duration-250">Settings</a></li>
            </ul>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-2 md:p-6">
          <OfflineIndicator />
          
          {/* Sidebar toggle for mobile */}
          <button 
            className="md:hidden mb-4 p-2 rounded bg-white shadow-sm hover:shadow transition duration-250"
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Dashboard content */}
          <div className="bg-white rounded-lg shadow-card p-4 md:p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
