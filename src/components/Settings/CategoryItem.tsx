import { useState } from 'react';
import { Pencil, Trash2, Star, Check, X } from 'lucide-react';
import { Category } from '../../services/api/categoryService';

interface CategoryItemProps {
  category: Category;
  selectedCategoryId: string | null;
  onSelect: (id: string) => void;
  onEdit: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMakeDefault: (id: string) => Promise<void>;
}

export function CategoryItem({
  category,
  selectedCategoryId,
  onSelect,
  onEdit,
  onDelete,
  onMakeDefault
}: CategoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedName(category.name);
  };
  
  const handleSave = async () => {
    if (!editedName.trim()) return;
    
    await onEdit(category.id, editedName);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  return (
    <div 
      className={`border rounded p-3 ${selectedCategoryId === category.id ? 'border-blue-500 bg-blue-50' : ''}`}
    >
      <div className="flex justify-between items-center">
        {isEditing ? (
          <div className="flex items-center flex-grow">
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="border rounded px-2 py-1 w-full mr-2"
              autoFocus
            />
            <button 
              onClick={handleSave}
              className="text-green-600 ml-1 p-1"
            >
              <Check size={18} />
            </button>
            <button 
              onClick={handleCancel}
              className="text-red-600 ml-1 p-1"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <div 
              className="flex-grow cursor-pointer"
              onClick={() => onSelect(category.id)}
            >
              <span className="font-medium">{category.name}</span>
              {category.is_default && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Default</span>
              )}
            </div>
            <div className="flex items-center">
              <button 
                onClick={handleStartEdit}
                className="text-gray-600 hover:text-blue-600 p-1"
                title="Edit category"
              >
                <Pencil size={16} />
              </button>
              <button 
                onClick={() => onMakeDefault(category.id)}
                className={`p-1 ${category.is_default ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-600'}`}
                title={category.is_default ? 'Default category' : 'Make default'}
                disabled={category.is_default}
              >
                <Star size={16} />
              </button>
              <button 
                onClick={() => onDelete(category.id)}
                className="text-gray-600 hover:text-red-600 p-1"
                title="Delete category"
                disabled={category.is_default}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
