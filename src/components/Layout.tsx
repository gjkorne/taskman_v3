import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ActiveSession } from './Timer/ActiveSession';
import { SearchPanel } from './TaskList/SearchPanel';
import { Sidebar } from './Navigation/Sidebar';
import { TaskFormModal } from './TaskForm/TaskFormModal';
import { Icon } from './UI/Icon';
import { MainHeader } from './UI/MainHeader';
import { AdminView } from './Admin/AdminView';
import { createTaskEvent, timerStateChangeEvent } from '../App';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Get the current view based on the URL path
  const getCurrentView = () => {
    const path = location.pathname;

    if (path === '/') return 'home';
    if (path.startsWith('/tasks')) return 'tasks';
    if (path === '/reports') return 'reports';
    if (path === '/settings') return 'settings';
    if (path === '/admin') return 'admin';
    if (path === '/time-sessions') return 'time-sessions';
    if (path === '/calendar') return 'calendar';

    return 'home'; // default
  };

  const activeView = getCurrentView();

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check immediately
    checkIfMobile();

    // Check on window resize
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // If we switch to a non-mobile size, auto-close the sidebar
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // Close sidebar when view changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [activeView, isMobile]);

  // Handle new task creation using global events
  const handleTaskCreated = () => {
    window.dispatchEvent(createTaskEvent);
    setShowTaskForm(false);
  };

  // Handle timer state changes using global events
  const handleTimerStateChange = () => {
    window.dispatchEvent(timerStateChangeEvent);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Main Header Component */}
      <MainHeader
        onSearch={(query) => console.log('Searching for:', query)}
        onRefresh={() => {
          console.log('Refreshing data...');
          window.dispatchEvent(createTaskEvent);
        }}
        onToggleSidebar={toggleSidebar}
      />

      {/* Timer component at the top - spans full width */}
      <ActiveSession onTimerStateChange={handleTimerStateChange} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar component */}
        <Sidebar
          activeView={activeView}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-2">
            {/* Mobile header with menu button only */}
            <div className="md:hidden px-4 mb-3 flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
                aria-label="Open sidebar"
              >
                <Icon name="Menu" size={24} />
              </button>
            </div>

            {/* Search panel - only shown on tasks view */}
            {activeView === 'tasks' && <SearchPanel />}

            {/* Main content area */}
            <div className="px-4 sm:px-6 md:px-8">
              <div className="w-full flex-grow overflow-y-auto">{children}</div>
            </div>
          </div>
        </main>
      </div>

      {/* Task form modal */}
      {showTaskForm && (
        <TaskFormModal
          isOpen={showTaskForm}
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {/* Admin View Component */}
      <AdminView />

      {/* Floating action button */}
      <button
        className="fixed w-14 h-14 rounded-full shadow-xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 z-50 group hover:scale-110 bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white"
        aria-label="New Task"
        onClick={() => setShowTaskForm(true)}
      >
        <Icon name="Plus" size={24} />
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
          New Task
        </span>
      </button>
    </div>
  );
}
