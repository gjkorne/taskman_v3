import React, { useState, useEffect } from 'react';
import { Menu, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { ActiveSession } from './Timer/ActiveSession';
import { SearchPanel } from './TaskList/SearchPanel';
import { Sidebar, ViewType } from './Navigation/Sidebar';
import { FloatingActionButton } from './Common/FloatingActionButton';
import { TaskFormModal } from './TaskForm/TaskFormModal';

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
    
    // Check on initial load
    checkIfMobile();
    
    // Listen for window resize events
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Close sidebar on view change in mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [activeView, isMobile]);
  
  // Toggle sidebar visibility (mobile)
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Handle task creation success
  const handleTaskCreated = () => {
    if (onTaskCreated) {
      onTaskCreated();
    }
    setShowTaskForm(false);
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
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden border-b border-gray-200 sticky top-0 z-50 bg-white shadow-sm">
          <div className="flex items-center h-14 sm:h-16 px-3 sm:px-4">
            <button
              onClick={toggleSidebar}
              className="p-2 -ml-1 text-gray-500 rounded-md hover:bg-gray-100 touch-manipulation"
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800 ml-2 flex-1 truncate">
              {getViewTitle()}
            </h1>
            
            {/* Add task button in header - only show when NOT on tasks view to avoid duplication */}
            {activeView !== 'tasks' && (
              <button
                onClick={() => setShowTaskForm(true)}
                className="p-2 text-blue-500 rounded-md hover:bg-blue-50 touch-manipulation ml-2"
                aria-label="Add new task"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>
        
        {/* Active Session Bar - Will appear when a task is being timed */}
        <div className="relative z-40">
          <ActiveSession onTimerStateChange={onTimerStateChange} />
        </div>
        
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
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a4abbd' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6 w-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskFormModal
          isOpen={showTaskForm}
          onClose={() => setShowTaskForm(false)}
          onTaskCreated={handleTaskCreated}
          title="Add Task"
        />
      )}
      
      {/* Floating Action Button - only show on tasks view */}
      {activeView === 'tasks' && (
        <FloatingActionButton 
          onClick={() => setShowTaskForm(true)}
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 lg:hidden"
          title="Add Task"
          aria-label="Add new task"
        />
      )}
    </div>
  );
}