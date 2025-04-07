import { Clock, List, Settings, AlertTriangle, X, ChevronLeft, ChevronRight, Home, Database } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useEffect, useState } from 'react';
import { authService } from '../../services/api/authService';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Types
export type ViewType = 'tasks' | 'timer' | 'reports' | 'settings' | 'admin' | 'time-sessions' | 'calendar' | 'home' | 'admin-data';

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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { user, error } = await authService.getUser();
      if (user && !error) {
        setUser(user);
        
        // Check admin status in the database
        const { data, error: roleError } = await supabase
          .from('user_role_assignments')
          .select('user_roles(name)')
          .eq('user_id', user.id)
          .single();
          
        if (!roleError && data?.user_roles?.name === 'admin') {
          setIsAdmin(true);
        }
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

  // Handle navigation with both the callback and direct URL navigation
  const handleNavigation = (view: ViewType, path: string) => {
    onViewChange(view); // Keep the callback for backward compatibility
    navigate(path); // Direct URL navigation
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      onToggleSidebar();
    }
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
        "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300",
        "lg:relative lg:shadow-none", // Always display on desktop as relative
        isSidebarOpen ? "translate-x-0 shadow-lg" : "-translate-x-full lg:translate-x-0", // Only hide on mobile when closed
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
              icon={<Home className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Home" 
              active={activeView === 'home'}
              collapsed={isCollapsed}
              onClick={() => handleNavigation('home', '/')}
            />
            
            <NavItem 
              icon={<List className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Tasks" 
              active={activeView === 'tasks'}
              collapsed={isCollapsed}
              onClick={() => handleNavigation('tasks', '/tasks')}
            />
            
            <NavItem 
              icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />} 
              label="Time Sessions" 
              active={activeView === 'time-sessions'}
              collapsed={isCollapsed}
              onClick={() => handleNavigation('time-sessions', '/time-sessions')}
            />
            
            {isAdmin && (
              <>
                <NavItem 
                  icon={<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />} 
                  label="Admin" 
                  active={activeView === 'admin'}
                  collapsed={isCollapsed}
                  onClick={() => handleNavigation('admin', '/admin')}
                />
                <NavItem 
                  icon={<Database className="w-4 h-4 sm:w-5 sm:h-5" />} 
                  label="Data Explorer" 
                  active={activeView === 'admin-data'}
                  collapsed={isCollapsed}
                  onClick={() => handleNavigation('admin-data', '/admin/data')}
                />
              </>
            )}

            <div className="mt-auto pt-2 sm:pt-4 border-t border-gray-200 mt-2 sm:mt-4">
              <NavItem 
                icon={<Settings className="w-4 h-4 sm:w-5 sm:h-5" />} 
                label="Settings" 
                active={activeView === 'settings'}
                collapsed={isCollapsed}
                onClick={() => handleNavigation('settings', '/settings')}
              />
            </div>
          </nav>
          
          {/* User Info (Mobile) */}
          {!isCollapsed && (
            <div className="p-3 sm:p-4 border-t border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                  {user?.email?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="ml-3 truncate">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.email || 'Anonymous User'}
                  </p>
                  <button 
                    onClick={async () => {
                      await authService.signOut();
                      window.location.href = '/login';
                    }}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
