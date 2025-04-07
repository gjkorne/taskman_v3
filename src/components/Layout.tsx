import React, { useState, useEffect } from 'react';
import { ActiveSession } from './Timer/ActiveSession';
import { Sidebar, ViewType } from './Navigation/Sidebar';
import { TaskFormModal } from './TaskForm/TaskFormModal';
import { Icon } from './UI/Icon';
import { MainHeader } from './UI/MainHeader';
import { AdminView } from './Admin/AdminView';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Align with Tailwind lg breakpoint
    };
    
    // Check immediately
    checkIfMobile();
    
    // Check on window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // If we switch to desktop, ensure sidebar is open
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(true); // Keep sidebar open on desktop
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
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Main Header Component */}
      <MainHeader 
        onToggleSidebar={toggleSidebar}
      />
      
      {/* Timer component at the top - spans full width */}
      <ActiveSession onTimerStateChange={onTimerStateChange} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar component */}
        <Sidebar 
          activeView={activeView}
          onViewChange={onViewChange}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        
        {/* Main Content */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-2">
            
            {/* Main content area */}
            <div className="px-4 sm:px-6 md:px-8">
              <div className="w-full flex-grow overflow-y-auto">
                {children}
              </div>
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
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">New Task</span>
      </button>
    </div>
  );
}