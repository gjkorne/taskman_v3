import React, { useState, useEffect } from 'react';
import { Check, Trash2, PlusCircle, GripVertical } from 'lucide-react';
import { ListItem, ListNotes, createEmptyListNotes } from '../../types/list';

// Simple UUID generator function to avoid external dependency
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface ListEditorProps {
  value: ListNotes;
  onChange: (notes: ListNotes) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * ListEditor component
 * Provides an interface for managing checklist-style task notes
 */
export const ListEditor: React.FC<ListEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  className = '',
}) => {
  // Use the provided value or create an empty list if undefined
  const [listData, setListData] = useState<ListNotes>(value || createEmptyListNotes());
  const [newItemText, setNewItemText] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Update internal state when props change
  useEffect(() => {
    setListData(value || createEmptyListNotes());
  }, [value]);

  // Add a new item to the list
  const addItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem: ListItem = {
      id: generateUUID(),
      text: newItemText.trim(),
      completed: false,
      order: listData.items.length,
      createdAt: new Date().toISOString()
    };
    
    const updatedItems = [...listData.items, newItem];
    const updatedList = { ...listData, items: updatedItems };
    
    setListData(updatedList);
    onChange(updatedList);
    setNewItemText('');
  };

  // Remove an item from the list
  const removeItem = (id: string) => {
    const updatedItems = listData.items.filter(item => item.id !== id);
    
    // Update the order of remaining items
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    const updatedList = { ...listData, items: reorderedItems };
    setListData(updatedList);
    onChange(updatedList);
  };

  // Toggle the completion status of an item
  const toggleItemCompletion = (id: string) => {
    const updatedItems = listData.items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    
    const updatedList = { ...listData, items: updatedItems };
    setListData(updatedList);
    onChange(updatedList);
  };

  // Update the text of an item
  const updateItemText = (id: string, text: string) => {
    const updatedItems = listData.items.map(item => 
      item.id === id ? { ...item, text } : item
    );
    
    const updatedList = { ...listData, items: updatedItems };
    setListData(updatedList);
    onChange(updatedList);
  };

  // Handle item dragging (for reordering)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    // Required for Firefox
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedItem === id) return;
    
    // Find the indices of the dragged item and the target item
    const draggedIndex = listData.items.findIndex(item => item.id === draggedItem);
    const targetIndex = listData.items.findIndex(item => item.id === id);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reorder the items
    const items = [...listData.items];
    const [draggedItemObj] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItemObj);
    
    // Update order numbers
    const reorderedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));
    
    const updatedList = { ...listData, items: reorderedItems };
    setListData(updatedList);
    // Don't call onChange here to prevent too many updates during drag
  };

  const handleDragEnd = () => {
    if (draggedItem) {
      setDraggedItem(null);
      // Now update the parent with the final reordered list
      onChange(listData);
    }
  };

  // Sort items by order
  const sortedItems = [...listData.items].sort((a, b) => a.order - b.order);

  return (
    <div className={`list-editor ${className}`}>
      {/* List items */}
      <ul className="space-y-2 mb-4">
        {sortedItems.map(item => (
          <li 
            key={item.id}
            className={`flex items-center gap-2 p-2 rounded-md border ${
              item.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
            } ${draggedItem === item.id ? 'opacity-50' : 'opacity-100'}`}
            draggable={!readOnly}
            onDragStart={(e) => !readOnly && handleDragStart(e, item.id)}
            onDragOver={(e) => !readOnly && handleDragOver(e, item.id)}
            onDragEnd={() => !readOnly && handleDragEnd()}
          >
            {/* Drag handle */}
            {!readOnly && (
              <span className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical size={16} />
              </span>
            )}
            
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => !readOnly && toggleItemCompletion(item.id)}
              className={`flex-shrink-0 w-5 h-5 rounded border ${
                item.completed 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'border-gray-300 bg-white'
              } flex items-center justify-center transition-colors`}
              disabled={readOnly}
              aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
            >
              {item.completed && <Check size={12} />}
            </button>
            
            {/* Item text */}
            {readOnly ? (
              <span className={`flex-grow ${item.completed ? 'line-through text-gray-500' : ''}`}>
                {item.text}
              </span>
            ) : (
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
                className={`flex-grow bg-transparent border-none p-0 focus:ring-0 ${
                  item.completed ? 'line-through text-gray-500' : ''
                }`}
                placeholder="Item text"
                disabled={readOnly}
              />
            )}
            
            {/* Delete button (only shown in edit mode) */}
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Delete item"
              >
                <Trash2 size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>
      
      {/* Add new item (only shown in edit mode) */}
      {!readOnly && (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add new item..."
            className="flex-grow p-2 border border-gray-300 rounded-md"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={!newItemText.trim()}
            className="p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-400 transition-colors"
            aria-label="Add item"
          >
            <PlusCircle size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ListEditor;
