import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  initialValue?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ initialValue = '', onSearch, placeholder = 'Search tasks...' }: SearchBarProps) {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update search value when initialValue changes (e.g., on reset)
  useEffect(() => {
    if (initialValue !== searchValue) {
      setSearchValue(initialValue);
    }
  }, [initialValue]);

  // Handle input change with debouncing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Apply debounce to avoid excessive filtering
    timeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Clear search
  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  return (
    <div 
      className={`flex items-center w-full px-3 py-2 bg-white border rounded-md transition-all ${
        isFocused ? 'border-indigo-500 shadow-sm' : 'border-gray-300'
      }`}
    >
      <Search className="w-4 h-4 text-gray-400 mr-2" />
      
      <input
        type="text"
        value={searchValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-grow outline-none text-gray-700 text-sm"
        aria-label="Search tasks by title, description, status, priority, or category"
      />
      
      {searchValue && (
        <button 
          onClick={handleClear}
          className="p-1 rounded-full hover:bg-gray-100"
          type="button"
          aria-label="Clear search"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}
