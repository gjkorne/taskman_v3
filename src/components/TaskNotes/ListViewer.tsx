import React from 'react';
import { ListNotes } from '../../types/list';
import { Check, Circle } from 'lucide-react';

interface ListViewerProps {
  notes: ListNotes;
  className?: string;
  maxItems?: number;
  showCollapsed?: boolean;
}

/**
 * ListViewer component
 * Displays task list items in read-only mode, with optional collapsing
 */
export const ListViewer: React.FC<ListViewerProps> = ({
  notes,
  className = '',
  maxItems = 5,
  showCollapsed = true,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // Sort items by order
  const sortedItems = [...notes.items].sort((a, b) => a.order - b.order);
  
  // Get display items based on expansion state
  const displayItems = isExpanded 
    ? sortedItems 
    : sortedItems.slice(0, maxItems);
  
  // Calculate stats
  const totalItems = sortedItems.length;
  const completedItems = sortedItems.filter(item => item.completed).length;
  const progress = totalItems > 0 
    ? Math.round((completedItems / totalItems) * 100) 
    : 0;
  
  // Need to show toggle button?
  const needsToggle = showCollapsed && totalItems > maxItems;
  
  if (totalItems === 0) {
    return <div className={`text-gray-500 italic ${className}`}>No items in list</div>;
  }

  return (
    <div className={`list-viewer ${className}`}>
      {/* Progress bar for lists with items */}
      {totalItems > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{completedItems} of {totalItems} completed</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* List items */}
      <ul className="space-y-1">
        {displayItems.map(item => (
          <li 
            key={item.id}
            className="flex items-center gap-2 py-1"
          >
            {/* Checkbox indicator (read-only) */}
            <span className="flex-shrink-0 text-gray-400">
              {item.completed ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </span>
            
            {/* Item text */}
            <span className={`flex-grow ${item.completed ? 'line-through text-gray-500' : ''}`}>
              {item.text}
            </span>
          </li>
        ))}
      </ul>
      
      {/* Show more/less toggle */}
      {needsToggle && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Show less' : `Show ${totalItems - maxItems} more items`}
        </button>
      )}
    </div>
  );
};

export default ListViewer;
