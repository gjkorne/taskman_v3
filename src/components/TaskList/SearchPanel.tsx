import { Search, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import { useTaskContext } from '../../contexts/TaskContext';

/**
 * SearchPanel component that includes search input and filters
 * This is positioned at the top of the screen for quick access
 */
export function SearchPanel() {
  const { 
    searchQuery, 
    setSearchQuery, 
    refreshTasks, 
    isRefreshing
  } = useTaskContext();

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Left side - Search with integrated refresh */}
      <div className="flex-grow flex items-center min-w-[260px] max-w-md">
        <div className="relative flex-grow">
          <div className="flex items-center px-3 py-2 bg-white border rounded-lg transition-all border-gray-300">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => refreshTasks()}
          className={`ml-2 p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
          disabled={isRefreshing}
          aria-label="Refresh tasks"
        >
          <RefreshCw className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      
      {/* Right side - Compact filter */}
      <div className="flex-shrink-0 flex items-center ml-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Filters</span>
            </div>
            <div className="flex space-x-2">
              <button className="text-gray-500 hover:text-gray-700">
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
