import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface CategoryFormProps {
  onAddCategory: (name: string) => Promise<void>;
}

export function CategoryForm({ onAddCategory }: CategoryFormProps) {
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    await onAddCategory(newCategoryName);
    setNewCategoryName('');
  };
  
  return (
    <form onSubmit={handleSubmit} className="mb-4 flex">
      <input
        type="text"
        value={newCategoryName}
        onChange={(e) => setNewCategoryName(e.target.value)}
        placeholder="New category name"
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
