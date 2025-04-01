import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';

interface SubcategoryItemProps {
  name: string;
  onEdit: (oldName: string, newName: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}

export function SubcategoryItem({ name, onEdit, onDelete }: SubcategoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  
  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedName(name);
  };
  
  const handleSave = async () => {
    if (!editedName.trim()) return;
    
    await onEdit(name, editedName);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  return (
    <div className="border rounded p-3">
      {isEditing ? (
        <div className="flex items-center">
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
        <div className="flex justify-between items-center">
          <span>{name}</span>
          <div className="flex items-center">
            <button 
              onClick={handleStartEdit}
              className="text-gray-600 hover:text-blue-600 p-1"
              title="Edit subcategory"
            >
              <Pencil size={16} />
            </button>
            <button 
              onClick={() => onDelete(name)}
              className="text-gray-600 hover:text-red-600 p-1"
              title="Delete subcategory"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
