import { BarChart3, Calendar, Clock, List, Settings, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useEffect, useState } from 'react';
import { authService } from '../../services/api/authService';
import { User } from '@supabase/supabase-js';

// Types
export type ViewType = 'tasks' | 'timer' | 'reports' | 'settings' | 'admin' | 'time-sessions' | 'calendar';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 sm:gap-3 w-full px-3 sm:px-4 py-2 text-left rounded-lg transition-colors',
      active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50',
      collapsed && 'justify-center sm:px-2'
    )}
    title={collapsed ? label : undefined}
  >
    {icon}
    {!collapsed && <span className="font-medium text-sm sm:text-base">{label}</span>}
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
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { user, error } = await authService.getUser();
      if (user && !error) {
        setUser(user);
      }
    };
    fetchUser();
    
    // Check for saved collapse state
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsedState) {
      setIsCollapsed(savedCollapsedState === 'true');
    }
  }, []);
  
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

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
        "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 transform lg:translate-x-0 lg:static shadow-lg lg:shadow-none",
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        isCollapsed ? 'w-[70px]' : 'w-[240px] sm:w-64'
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 border-b border-gray-200">
            {!isCollapsed && <h1 className="text-lg sm:text-xl font-semibold text-gray-800">TaskMan</h1>}
            <div className="flex items-center ml-auto">
              {/* Collapse toggle button - only visible on desktop */}
              <button 
                onClick={toggleCollapsed} 
                className="p-1 sm:p-2 text-gray-500 rounded-md hover:bg-gray-100 hidden lg:block"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </button>
              
              {/* Close button - only visible on mobile */}
              <button 
                onClick={onToggleSidebar} 
                className="p-1 sm:p-2 text-gray-500 rounded-md lg:hidden hover:bg-gray-100"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1 sm:space-y-2">
            <NavItem 
              icon={<List className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Tasks" 
              active={activeView === 'tasks'}
              collapsed={isCollapsed}
              onClick={() => {
                onViewChange('tasks');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            <NavItem 
              icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Calendar" 
              active={activeView === 'calendar'}
              collapsed={isCollapsed}
              onClick={() => {
                onViewChange('calendar');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            <NavItem 
              icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Timer" 
              active={activeView === 'timer'}
              collapsed={isCollapsed}
              onClick={() => {
                onViewChange('timer');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            <NavItem 
              icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Time Sessions"
              active={activeView === 'time-sessions'}
              collapsed={isCollapsed}
              onClick={() => {
                onViewChange('time-sessions');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            <NavItem 
              icon={<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Reports" 
              active={activeView === 'reports'}
              collapsed={isCollapsed}
              onClick={() => {
                onViewChange('reports');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            <NavItem 
              icon={<Settings className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Settings" 
              active={activeView === 'settings'}
              collapsed={isCollapsed}
              onClick={() => {
                onViewChange('settings');
                if (window.innerWidth < 1024) onToggleSidebar();
              }}
            />
            
            {/* Admin Section - Only visible in development mode */}
            {import.meta.env.DEV && (
              <div className={cn("mt-6 pt-6 border-t border-gray-200", isCollapsed && "flex flex-col items-center")}>
                {!isCollapsed && <div className="mb-2 px-3 sm:px-4 text-xs font-medium uppercase text-gray-400">Admin</div>}
                {isCollapsed && <div className="mb-2 text-xs font-medium uppercase text-gray-400">A</div>}
                <NavItem 
                  icon={<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />} 
                  label="Admin Panel" 
                  active={activeView === 'admin'}
                  collapsed={isCollapsed}
                  onClick={() => {
                    onViewChange('admin');
                    if (window.innerWidth < 1024) onToggleSidebar();
                  }}
                />
              </div>
            )}
          </nav>
          
          {/* User Section */}
          {user && (
            <div className={cn("p-3 sm:p-4 border-t border-gray-200", 
              isCollapsed && "flex flex-col items-center justify-center")}>
              <div className={cn("flex items-center", 
                isCollapsed && "flex-col")}>
                <div className="flex-shrink-0 bg-blue-500 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white font-medium text-sm sm:text-base">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                {!isCollapsed && (
                  <div className="ml-3">
                    <p className="text-sm sm:text-base font-medium text-gray-700">
                      {user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">{user.email || ''}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
