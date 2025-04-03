import React, { useState } from 'react';
import { Menu } from 'lucide-react';
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
  
  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Sidebar component */}
      <Sidebar 
        activeView={activeView}
        onViewChange={onViewChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />
      
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <h1 className="text-xl font-semibold text-gray-800">TaskManager</h1>
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-500 rounded-md hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
        
        {/* Active Session Bar - Will appear when a task is being timed */}
        <div className="relative z-40">
          <ActiveSession onTimerStateChange={onTimerStateChange} />
        </div>
        
        {/* Header with search bar - Only show on tasks view */}
        {activeView === 'tasks' && (
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm px-4 pt-3 pb-3">
            <div className="max-w-[1600px] mx-auto">
              <SearchPanel />
            </div>
          </div>
        )}
        
        {/* Main content */}
        <main 
          className={cn(
            "flex-1 overflow-auto py-6 transition-all duration-300",
            "bg-gray-50 bg-opacity-80 relative"
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a4abbd' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div className="px-4 sm:px-6 lg:px-8 w-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Action Button component */}
      <FloatingActionButton 
        onClick={() => setShowTaskForm(true)}
        label="New Task"
      />

      {/* Task Form Modal component */}
      <TaskFormModal
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}