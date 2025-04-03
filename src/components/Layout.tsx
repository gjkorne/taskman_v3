import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { ActiveSession } from './Timer/ActiveSession';
import { SearchPanel } from './TaskList/SearchPanel';
import { Sidebar, ViewType } from './Navigation/Sidebar';
import { TaskFormModal } from './TaskForm/TaskFormModal';
import { Icon } from './UI/Icon';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onTaskCreated?: () => void;
  onTimerStateChange?: () => void;
}

export function Layout({ 
  children, 
  activeView, 
  onViewChange, 
  onTaskCreated,
  onTimerStateChange 
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
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
  
  // Handle new task creation
  const handleTaskCreated = () => {
    if (onTaskCreated) {
      onTaskCreated();
    }
    setShowTaskForm(false);
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Get view title based on active view
  const getViewTitle = () => {
    switch (activeView) {
      case 'tasks':
        return 'Tasks';
      case 'timer':
        return 'Timer';
      case 'reports':
        return 'Reports';
      case 'settings':
        return 'Settings';
      case 'admin':
        return 'Admin';
      case 'time-sessions':
        return 'Time Sessions';
      case 'calendar':
        return 'Calendar';
      default:
        return 'TaskManager';
    }
  };
  
  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Sidebar component */}
      <Sidebar 
        activeView={activeView}
        onViewChange={onViewChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      
      {/* Main container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation bar */}
        <header className="bg-white border-b border-gray-200 z-40 sticky top-0">
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6">
            {/* Title and menu button */}
            <div className="flex items-center">
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="mr-2 p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  <span className="sr-only">Open sidebar</span>
                  <Icon name="Menu" size={24} />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                {getViewTitle()}
              </h1>
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center space-x-2">
              {activeView === 'tasks' && (
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Icon name="Plus" size={16} className="mr-1" />
                  New Task
                </button>
              )}
              
              {/* Active timer session */}
              <ActiveSession
                onTimerStateChange={onTimerStateChange}
              />
            </div>
          </div>
        </header>
        
        {/* Header with search bar - Only show on tasks view */}
        {activeView === 'tasks' && (
          <div className="sticky top-14 sm:top-16 lg:top-0 z-30 bg-white border-b border-gray-200 shadow-sm px-3 sm:px-4 pt-2 sm:pt-3 pb-2 sm:pb-3">
            <div className="max-w-[1600px] mx-auto">
              <SearchPanel />
            </div>
          </div>
        )}
        
        {/* Main content */}
        <main 
          className={cn(
            "flex-1 overflow-auto transition-all duration-300",
            "bg-gray-50 bg-opacity-80 relative"
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23a4abbd' fillOpacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6 w-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* New task modal */}
      {showTaskForm && (
        <TaskFormModal 
          isOpen={showTaskForm}
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}