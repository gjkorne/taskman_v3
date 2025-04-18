import React from 'react';
import { CategoryMappingSettings } from '../components/Settings/CategoryMappingSettings';

const CategoryMappingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Category Mapping</h1>
      
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Map Categories</h2>
        <p className="text-gray-600 mb-6">
          Use this tool to move tasks from one category to another. This is useful for consolidating custom categories into standard ones.
        </p>
        <CategoryMappingSettings />
      </div>
    </div>
  );
};

export default CategoryMappingPage;
