import { BarChart3, Calendar, Clock, List, Settings, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

// Types
export type ViewType = 'tasks' | 'timer' | 'reports' | 'settings' | 'admin' | 'time-sessions' | 'calendar';

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
      'flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2 text-left rounded-lg transition-colors',
      active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
    )}
  >
    {icon}
    <span className="font-medium text-sm sm:text-base">{label}</span>
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
    <>
      {/* Mobile overlay when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggleSidebar}
          aria-hidden="true"
        />
      )}
      
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-[240px] sm:w-64 bg-white border-r border-gray-200 transition-transform duration-300 transform lg:translate-x-0 lg:static lg:w-64 shadow-lg lg:shadow-none",
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 border-b border-gray-200">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">TaskManager</h1>
            <button 
              onClick={onToggleSidebar} 
              className="p-1 sm:p-2 text-gray-500 rounded-md lg:hidden hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 sm:space-y-2">
            <NavItem 
              icon={<List className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Tasks" 
              active={activeView === 'tasks'}
              onClick={() => {
                onViewChange('tasks');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            <NavItem 
              icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Calendar" 
              active={activeView === 'calendar'}
              onClick={() => {
                onViewChange('calendar');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            <NavItem 
              icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Timer" 
              active={activeView === 'timer'}
              onClick={() => {
                onViewChange('timer');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            <NavItem 
              icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Time Sessions"
              active={activeView === 'time-sessions'}
              onClick={() => {
                onViewChange('time-sessions');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            <NavItem 
              icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Reports" 
              active={activeView === 'reports'}
              onClick={() => {
                onViewChange('reports');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            <NavItem 
              icon={<Settings className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Settings" 
              active={activeView === 'settings'}
              onClick={() => {
                onViewChange('settings');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            {/* Admin Section - Only visible in development mode */}
            {import.meta.env.DEV && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="mb-2 px-3 sm:px-4 text-xs font-medium uppercase text-gray-400">Admin</div>
                <NavItem 
                  icon={<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />} 
                  label="Admin Panel" 
                  active={activeView === 'admin'}
                  onClick={() => {
                    onViewChange('admin');
                    if (window.innerWidth < 1024) onToggleSidebar();
                  }}
                />
              </div>
            )}
          </nav>
          
          {/* User Section */}
          <div className="p-3 sm:p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white font-medium text-sm sm:text-base">
                U
              </div>
              <div className="ml-3">
                <p className="text-sm sm:text-base font-medium text-gray-700">User</p>
                <p className="text-xs text-gray-500">user@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
