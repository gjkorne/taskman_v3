import React from 'react';
import { BarChart3, Clock, Layout as LayoutIcon, List, Menu } from 'lucide-react';
import { cn } from '../lib/utils';

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
}

export function Layout({ children, activeView, onViewChange }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

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
    </div>
  );
}