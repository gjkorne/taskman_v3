import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useNavigate } from 'react-router-dom';
import { useRefresh } from '../../contexts/RefreshContext';

interface MainHeaderProps {
  onToggleSidebar?: () => void;
}

export function MainHeader({ onToggleSidebar }: MainHeaderProps) {   
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { refreshData } = useRefresh();

  // Handle click outside to close the profile menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuRef]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      // The auth state change will automatically redirect to login
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Navigate to settings
  const goToSettings = () => {
    navigate('/settings');
    setIsProfileMenuOpen(false);
  };

  return (
    <div className="bg-taskman-blue-500 text-white shadow-header">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Hamburger menu for mobile */}
            <button 
              onClick={onToggleSidebar}
              className="md:hidden mr-4 p-1.5 rounded hover:bg-taskman-blue-600 transition duration-250 flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="text-3xl font-bold mr-8">TaskMan</div>
            <nav className="hidden md:flex space-x-4">
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex gap-3">
            {/* Add a refresh button in the header next to other controls */}
            <button 
              onClick={refreshData}
              className="mr-4 p-1.5 rounded hover:bg-taskman-blue-600 transition duration-250 flex items-center justify-center"
              aria-label="Refresh data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>                         
              
              {/* User profile with dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button 
                  className="rounded-full bg-white p-2.5 flex items-center justify-center shadow-sm hover:shadow-md transition duration-250" 
                  aria-label="User profile"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                
                {/* Profile dropdown menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {/* User info */}
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-700">
                        {user?.email || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.id ? `ID: ${user.id.substring(0, 8)}...` : 'Not signed in'}
                      </p>
                    </div>
                    
                    {/* Settings option */}
                    <button
                      onClick={goToSettings}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>
                    
                    {/* Logout option */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainHeader;
