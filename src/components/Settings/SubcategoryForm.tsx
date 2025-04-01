import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface SubcategoryFormProps {
  onAddSubcategory: (name: string) => Promise<void>;
}

export function SubcategoryForm({ onAddSubcategory }: SubcategoryFormProps) {
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategoryName.trim()) return;
    
    await onAddSubcategory(newSubcategoryName);
    setNewSubcategoryName('');
  };
  
  return (
    <form onSubmit={handleSubmit} className="mb-4 flex">
      <input
        type="text"
        value={newSubcategoryName}
        onChange={(e) => setNewSubcategoryName(e.target.value)}
        placeholder="New subcategory name"
        className="border rounded-l px-3 py-2 w-full"
      />
      <button 
        type="submit"
        className="bg-blue-500 text-white px-3 py-2 rounded-r flex items-center"
      >
        <Plus size={18} className="mr-1" />
        Add
      </button>
    </form>
  );
}
