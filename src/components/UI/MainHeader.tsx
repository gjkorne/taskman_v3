import React from 'react';
import { SearchBar } from './SearchBar';

interface MainHeaderProps {
  onSearch?: (query: string) => void;
  onRefresh?: () => void;
  onToggleSidebar?: () => void;
}

export const MainHeader: React.FC<MainHeaderProps> = ({
  onSearch,
  onRefresh,
  onToggleSidebar
}) => {
  return (
    <div className="bg-taskman-blue-500 text-white shadow-header">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {/* Hamburger menu for mobile */}
            <button 
              onClick={onToggleSidebar}
              className="mr-4 p-1.5 rounded hover:bg-taskman-blue-600 transition duration-250 flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="text-3xl font-bold mr-8">TaskMan</div>
            <nav className="hidden md:flex space-x-4">
              <a href="#" className="py-1.5 px-3 bg-taskman-blue-600 rounded text-white hover:bg-taskman-blue-700 transition duration-250">Dashboard</a>
              <a href="#" className="py-1.5 px-3 hover:bg-taskman-blue-600 rounded transition duration-250">Tasks</a>
              <a href="#" className="py-1.5 px-3 hover:bg-taskman-blue-600 rounded transition duration-250">Calendar</a>
              <a href="#" className="py-1.5 px-3 hover:bg-taskman-blue-600 rounded transition duration-250">Reports</a>
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            <SearchBar 
              placeholder="Search tasks, contacts, deals..." 
              onSearch={onSearch}
              onRefresh={onRefresh}
            />
            <div className="flex gap-3">
              <button className="rounded-full bg-yellow-400 p-2.5 flex items-center justify-center shadow-sm hover:shadow-md transition duration-250" aria-label="Notifications">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button className="rounded-full bg-white p-2.5 flex items-center justify-center shadow-sm hover:shadow-md transition duration-250" aria-label="User profile">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainHeader;
