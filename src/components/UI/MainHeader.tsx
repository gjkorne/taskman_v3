import { useState, useRef, useEffect } from 'react';
import { SearchBar } from './SearchBar';
import { useAuth } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';

interface MainHeaderProps {
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
  onToggleSidebar?: () => void;
}

export function MainHeader({
  onSearch,
  onRefresh,
  onToggleSidebar,
}: MainHeaderProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const goToSettings = () => {
    navigate('/settings');
    setIsProfileMenuOpen(false);
  };

  return (
    <div className="bg-kw-navy border-b border-white/10 shadow-header">
      <div className="px-4 sm:px-6 py-0">
        <div className="flex items-center justify-between h-14">
          {/* Left: hamburger + wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded hover:bg-white/10 transition-colors text-white lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* K Windows wordmark */}
            <div className="flex items-center gap-2.5">
              <div className="leading-none text-center">
                <div
                  className="font-sans font-extrabold text-white"
                  style={{ fontSize: '13px', letterSpacing: '0.13em' }}
                >
                  K WINDOWS &amp; DOORS
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className="h-px w-3 bg-white/30" />
                  <span
                    className="font-sans font-semibold text-kw-subtle"
                    style={{ fontSize: '8px', letterSpacing: '0.26em' }}
                  >
                    EST. 1957
                  </span>
                  <span className="h-px w-3 bg-white/30" />
                </div>
              </div>
              <span className="h-6 w-px bg-white/20 hidden sm:block" />
              <span className="hidden sm:block font-sans text-kw-subtle text-xs font-medium tracking-wide">
                Task Manager
              </span>
            </div>
          </div>

          {/* Right: search + profile */}
          <div className="flex items-center gap-3">
            <SearchBar
              placeholder="Search tasks..."
              onSearch={onSearch}
              onRefresh={onRefresh}
            />

            {/* Profile */}
            <div className="relative" ref={profileMenuRef}>
              <button
                className="w-8 h-8 rounded bg-white/15 hover:bg-white/25 flex items-center justify-center text-white font-semibold text-sm transition-colors"
                aria-label="User profile"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded shadow-card py-1 z-[9999] border border-kw-border">
                  <div className="px-4 py-2.5 border-b border-kw-border">
                    <p className="text-sm font-semibold text-kw-text truncate">
                      {user?.email || 'User'}
                    </p>
                    <p className="text-xs text-kw-muted mt-0.5">K Windows &amp; Doors</p>
                  </div>

                  <button
                    onClick={goToSettings}
                    className="w-full text-left px-4 py-2 text-sm text-kw-body hover:bg-kw-cream flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-kw-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainHeader;
