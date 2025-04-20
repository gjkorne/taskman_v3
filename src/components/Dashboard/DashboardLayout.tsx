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

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Main header */}
      <MainHeader onToggleSidebar={toggleSidebar} />

      {/* Offline indicator */}
      <OfflineIndicator />

      {/* Main content area with sidebar and content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`w-64 h-full bg-gray-50 border-r overflow-y-auto transition-all duration-400 ${
            sidebarCollapsed ? '-ml-64' : 'ml-0'
          }`}
        >
          <div className="p-4">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 mb-4 rounded hover:bg-gray-200 transition duration-250"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-lg font-semibold mb-4">Navigation</h2>

            <nav className="space-y-2">
              <a
                href="#"
                className="block px-4 py-2 rounded bg-taskman-blue-100 text-taskman-blue-700 font-medium transition duration-250"
              >
                Dashboard
              </a>
              <a
                href="#"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition duration-250"
              >
                Tasks
              </a>
              <a
                href="#"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition duration-250"
              >
                Categories
              </a>
              <a
                href="#"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition duration-250"
              >
                Calendar
              </a>
              <a
                href="#"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition duration-250"
              >
                Reports
              </a>
              <a
                href="#"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition duration-250"
              >
                Settings
              </a>
            </nav>

            <h2 className="text-lg font-semibold mt-6 mb-4">Favorites</h2>
            <nav className="space-y-2">
              <a
                href="#"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition duration-250"
              >
                Important Tasks
              </a>
              <a
                href="#"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition duration-250"
              >
                Weekly Report
              </a>
              <a
                href="#"
                className="block px-4 py-2 rounded hover:bg-gray-200 transition duration-250"
              >
                Team Overview
              </a>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div className="container mx-auto">
            {/* Sidebar toggle for mobile */}
            <button
              className="md:hidden mb-4 p-2 rounded bg-white shadow-sm hover:shadow transition duration-250"
              onClick={toggleSidebar}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Dashboard content */}
            <div className="bg-white rounded-lg shadow-card p-6 mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <div className="flex space-x-2">
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

              {/* Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
