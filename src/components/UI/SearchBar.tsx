import React, { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  onRefresh?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search tasks...',
  onRefresh,
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center relative">
      <button
        className="absolute right-0 top-0 p-2 rounded-md bg-taskman-blue-500 hover:bg-taskman-blue-600 transition duration-250 md:hidden z-10"
        aria-label="Refresh tasks"
        onClick={onRefresh}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-refresh-cw h-4 w-4 text-white"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
          <path d="M21 3v5h-5"></path>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
          <path d="M8 16H3v5"></path>
        </svg>
      </button>

      <div className="flex-grow flex items-center min-w-[260px] max-w-md">
        <div className="relative flex-grow">
          <div className="flex items-center px-3 py-2 bg-white border rounded-lg transition-all border-gray-300 shadow-sm hover:shadow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-search w-5 h-5 text-gray-400 mr-2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
            <input
              type="text"
              placeholder={placeholder}
              className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400"
              value={query}
              onChange={handleSearch}
            />
          </div>
        </div>
        <button
          className="ml-2 p-2 rounded-md bg-taskman-blue-500 hover:bg-taskman-blue-600 transition duration-250 hidden md:block shadow-sm"
          aria-label="Refresh tasks"
          onClick={onRefresh}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-refresh-cw h-4 w-4 text-white"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M8 16H3v5"></path>
          </svg>
        </button>
      </div>

      <div className="flex-shrink-0 flex items-center ml-auto">
        <div className="bg-taskman-blue-500 border border-taskman-blue-600 rounded-lg p-4 shadow-dropdown space-y-4">
          <div className="flex items-center justify-between">
            <div></div>
            <div className="flex space-x-2">
              <button className="text-white hover:text-blue-100 transition duration-250">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-chevron-down h-5 w-5"
                >
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
