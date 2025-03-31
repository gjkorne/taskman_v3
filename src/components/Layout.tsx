import React from 'react';
import { BarChart3, Clock, Layout as LayoutIcon, List, Menu, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { TaskForm } from './TaskForm/TaskForm';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-3 w-full px-4 py-2 text-left rounded-lg transition-colors',
      active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
    )}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeView: 'tasks' | 'timer' | 'reports';
  onViewChange: (view: 'tasks' | 'timer' | 'reports') => void;
  onTaskCreated?: () => void;
}

export function Layout({ children, activeView, onViewChange, onTaskCreated }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [showTaskForm, setShowTaskForm] = React.useState(false);

  // Function to handle task creation
  const handleTaskCreated = () => {
    setShowTaskForm(false);
    if (onTaskCreated) {
      onTaskCreated();
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-sm border-r border-white/20 p-4 transition-transform lg:transform-none shadow-2xl lg:shadow-xl',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-2 px-4 mb-8">
          <LayoutIcon className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Bolt</h1>
        </div>

        <nav className="space-y-1">
          <NavItem
            icon={<List className="w-5 h-5" />}
            label="Tasks"
            active={activeView === 'tasks'}
            onClick={() => onViewChange('tasks')}
          />
          <NavItem
            icon={<Clock className="w-5 h-5" />}
            label="Timer"
            active={activeView === 'timer'}
            onClick={() => onViewChange('timer')}
          />
          <NavItem
            icon={<BarChart3 className="w-5 h-5" />}
            label="Reports"
            active={activeView === 'reports'}
            onClick={() => onViewChange('reports')}
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <main className="p-8">
          {children}
        </main>
      </div>

      {/* Floating Action Button - New Task */}
      <button
        onClick={() => setShowTaskForm(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 z-40 group"
        aria-label="Create new task"
      >
        <Plus className="h-6 w-6" />
        <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
          New Task
        </span>
      </button>

      {/* Modal Task Form */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">New Task</h2>
              <button 
                onClick={() => setShowTaskForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <TaskForm onTaskCreated={handleTaskCreated} />
          </div>
        </div>
      )}
    </div>
  );
}