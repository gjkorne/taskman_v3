import {
  BarChart3,
  Calendar,
  Clock,
  List,
  Settings,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  FolderClosed,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useEffect, useState } from 'react';
import { authService } from '../../services/api/authService';
import { User } from '@supabase/supabase-js';
import { Link, useNavigate } from 'react-router-dom';

export type ViewType =
  | 'tasks'
  | 'reports'
  | 'settings'
  | 'admin'
  | 'time-sessions'
  | 'calendar'
  | 'home'
  | 'categories';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  to,
  active,
  collapsed,
  onClick,
}) => (
  <Link
    to={to}
    className={cn(
      'flex items-center gap-3 w-full px-3 py-2 text-left rounded transition-colors text-sm font-medium',
      active
        ? 'bg-white/15 text-white'
        : 'text-kw-subtle hover:bg-white/10 hover:text-white',
      collapsed && 'justify-center px-2'
    )}
    title={collapsed ? label : undefined}
    onClick={onClick}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </Link>
);

interface SidebarProps {
  activeView: ViewType;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Sidebar({
  activeView,
  isSidebarOpen,
  onToggleSidebar,
}: SidebarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { user, error } = await authService.getUser();
      if (user && !error) {
        setUser(user);
      }
    };
    fetchUser();

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

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      onToggleSidebar();
    }
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleSidebar}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-kw-navy-dark border-r border-white/10 transition-all duration-300 transform lg:translate-x-0 lg:static shadow-lg lg:shadow-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-[70px]' : 'w-[240px] sm:w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div
            className={cn(
              'flex items-center h-14 sm:h-16 px-3 sm:px-4 border-b border-white/10',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <span
                  className="font-sans font-extrabold text-white tracking-widest text-xs"
                  style={{ letterSpacing: '0.13em' }}
                >
                  WINDOWS &amp; DOORS
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-px w-4 bg-white/30" />
                  <span
                    className="font-sans font-semibold text-kw-subtle"
                    style={{ fontSize: '8px', letterSpacing: '0.26em' }}
                  >
                    EST. 1957
                  </span>
                  <span className="h-px w-4 bg-white/30" />
                </div>
              </div>
            )}

            <div className={cn('flex items-center', isCollapsed ? '' : 'ml-auto')}>
              <button
                onClick={toggleCollapsed}
                className="p-1.5 text-kw-subtle rounded hover:bg-white/10 hidden lg:block"
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={onToggleSidebar}
                className="p-1.5 text-kw-subtle rounded lg:hidden hover:bg-white/10"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            <NavItem
              icon={<Home className="w-4 h-4 flex-shrink-0" />}
              label="Home"
              to="/"
              active={activeView === 'home'}
              collapsed={isCollapsed}
              onClick={handleNavClick}
            />
            <NavItem
              icon={<List className="w-4 h-4 flex-shrink-0" />}
              label="Tasks"
              to="/tasks"
              active={activeView === 'tasks'}
              collapsed={isCollapsed}
              onClick={handleNavClick}
            />
            <NavItem
              icon={<FolderClosed className="w-4 h-4 flex-shrink-0" />}
              label="Categories"
              to="/categories"
              active={activeView === 'categories'}
              collapsed={isCollapsed}
              onClick={handleNavClick}
            />
            <NavItem
              icon={<Calendar className="w-4 h-4 flex-shrink-0" />}
              label="Calendar"
              to="/calendar"
              active={activeView === 'calendar'}
              collapsed={isCollapsed}
              onClick={handleNavClick}
            />
            <NavItem
              icon={<Clock className="w-4 h-4 flex-shrink-0" />}
              label="Time Sessions"
              to="/time-sessions"
              active={activeView === 'time-sessions'}
              collapsed={isCollapsed}
              onClick={handleNavClick}
            />
            <NavItem
              icon={<BarChart3 className="w-4 h-4 flex-shrink-0" />}
              label="Reports"
              to="/reports"
              active={activeView === 'reports'}
              collapsed={isCollapsed}
              onClick={handleNavClick}
            />
            <NavItem
              icon={<Settings className="w-4 h-4 flex-shrink-0" />}
              label="Settings"
              to="/settings"
              active={activeView === 'settings'}
              collapsed={isCollapsed}
              onClick={handleNavClick}
            />

            {import.meta.env.DEV && (
              <div
                className={cn(
                  'mt-4 pt-4 border-t border-white/10',
                  isCollapsed && 'flex flex-col items-center'
                )}
              >
                {!isCollapsed && (
                  <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-kw-subtle/60">
                    Admin
                  </div>
                )}
                <NavItem
                  icon={<AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                  label="Admin Panel"
                  to="/admin"
                  active={activeView === 'admin'}
                  collapsed={isCollapsed}
                  onClick={handleNavClick}
                />
              </div>
            )}
          </nav>

          {/* User Section */}
          {user && !isCollapsed && (
            <div className="border-t border-white/10 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded bg-kw-navy flex items-center justify-center text-white font-semibold text-sm">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="ml-3 truncate">
                  <p className="text-xs font-medium text-kw-subtle truncate">
                    {user.email}
                  </p>
                  <button
                    onClick={() => {
                      authService.signOut();
                      navigate('/login');
                    }}
                    className="text-xs text-kw-subtle/60 hover:text-white mt-0.5"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}

          {user && isCollapsed && (
            <div className="border-t border-white/10 p-2 flex justify-center">
              <button
                className="w-8 h-8 rounded bg-kw-navy flex items-center justify-center text-white font-semibold text-sm"
                onClick={() => {
                  authService.signOut();
                  navigate('/login');
                }}
                title="Sign out"
              >
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
