import { BarChart3, Clock, List, Menu, Settings, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Types
export type ViewType = 'tasks' | 'timer' | 'reports' | 'settings' | 'admin' | 'time-sessions';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
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

interface SidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Sidebar({ 
  activeView, 
  onViewChange, 
  isSidebarOpen, 
  onToggleSidebar
}: SidebarProps) {
  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:w-64",
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
    )}>
      <div className="flex h-full flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">TaskManager</h1>
          <button 
            onClick={onToggleSidebar} 
            className="p-2 text-gray-500 rounded-md lg:hidden hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem
            icon={<List size={20} />}
            label="Tasks"
            active={activeView === 'tasks'}
            onClick={() => onViewChange('tasks')}
          />
          
          <NavItem
            icon={<Clock size={20} />}
            label="Timer"
            active={activeView === 'timer'}
            onClick={() => onViewChange('timer')}
          />
          
          <NavItem
            icon={<Clock size={20} />}
            label="Time Sessions"
            active={activeView === 'time-sessions'}
            onClick={() => onViewChange('time-sessions')}
          />
          
          <NavItem
            icon={<BarChart3 size={20} />}
            label="Reports"
            active={activeView === 'reports'}
            onClick={() => onViewChange('reports')}
          />
          
          <NavItem
            icon={<Settings size={20} />}
            label="Settings"
            active={activeView === 'settings'}
            onClick={() => onViewChange('settings')}
          />
          
          {/* Admin Section - Only visible in development mode */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
                Development
              </h3>
              <NavItem
                icon={<AlertTriangle size={20} />}
                label="Admin"
                active={activeView === 'admin'}
                onClick={() => onViewChange('admin')}
              />
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
