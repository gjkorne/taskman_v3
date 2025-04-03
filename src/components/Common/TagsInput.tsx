import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  error?: string;
  className?: string;
  placeholder?: string;
}

/**
 * TagsInput component
 * Provides a consistent UI for managing tags across the application
 */
export const TagsInput: React.FC<TagsInputProps> = ({
  value = [],
  onChange,
  disabled = false,
  error,
  className = '',
  placeholder = 'Add a tag'
}) => {
  const [tagInput, setTagInput] = useState('');
  
  // Add a new tag
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    // Don't add duplicate tags
    if (!value.includes(tagInput.trim())) {
      onChange([...value, tagInput.trim()]);
    }
    
    // Clear the input
    setTagInput('');
  };
  
  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className={className}>
      <label htmlFor="tag-input" className="block text-sm font-medium text-gray-700 mb-1">
        Tags
      </label>
      
      {/* Tag input */}
      <div className="flex items-center gap-2 mb-2">
        <input
          id="tag-input"
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            "flex-1 px-3 py-2 border rounded-md",
            error ? "border-red-500" : "border-gray-300",
            disabled ? "bg-gray-100 cursor-not-allowed" : "focus:outline-none focus:ring-2 focus:ring-indigo-500"
          )}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={disabled || !tagInput.trim()}
          className={cn(
            "inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md",
            disabled || !tagInput.trim()
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          )}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </button>
      </div>
      
      {/* Display existing tags */}
      <div className="flex flex-wrap gap-2 mt-2">
        {value.map((tag) => (
          <div 
            key={tag} 
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
          >
            {tag}
            {!disabled && (
              <button 
                type="button" 
                onClick={() => removeTag(tag)} 
                className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {value.length === 0 && (
          <p className="text-sm text-gray-500">No tags added yet</p>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default TagsInput;
