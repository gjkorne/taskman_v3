import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  initialValue?: string; // Keep for backward compatibility
  onSearch?: (value: string) => void; // Keep for backward compatibility
  className?: string; // Add className prop for styling flexibility
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search tasks...',
  initialValue = '',
  onSearch,
  className = '',
}: SearchBarProps) {
  // Use controlled input if value/onChange are provided, otherwise use local state
  const isControlled = value !== undefined && onChange !== undefined;
  const [localSearchValue, setLocalSearchValue] = useState(initialValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute the actual value to display
  const searchValue = isControlled ? value : localSearchValue;

  // Handle direct prop changes (for controlled component)
  useEffect(() => {
    if (isControlled && value !== localSearchValue) {
      setLocalSearchValue(value || '');
    }
  }, [value, isControlled]);

  // Handle initialValue changes (for uncontrolled component)
  useEffect(() => {
    if (!isControlled && initialValue !== localSearchValue) {
      setLocalSearchValue(initialValue);
    }
  }, [initialValue, isControlled]);

  // Handle input change with debouncing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Always update local state for immediate UI feedback
    setLocalSearchValue(newValue);

    // For controlled components, call onChange immediately
    if (isControlled) {
      onChange(newValue);
      return;
    }

    // For uncontrolled components, use debouncing with onSearch
    if (onSearch) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout for debounced search
      timeoutRef.current = setTimeout(() => {
        onSearch(newValue);
      }, 300);
    }
  };

  // Clear search
  const handleClear = () => {
    setLocalSearchValue('');
    if (isControlled) {
      onChange('');
    } else if (onSearch) {
      onSearch('');
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
        flex items-center px-3 py-2 bg-white border rounded-lg transition-all
        ${
          isFocused
            ? 'border-blue-500 shadow-sm ring-1 ring-blue-500'
            : 'border-gray-300'
        }
      `}
      >
        <Search className="w-5 h-5 text-gray-400 mr-2" />

        <input
          type="text"
          value={searchValue}
          onChange={handleChange}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400"
        />

        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
