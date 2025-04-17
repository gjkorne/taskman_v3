import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  categoriesExist: boolean;
  onShowAll: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ categoriesExist, onShowAll }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
    <div className="text-gray-500 mb-4">
      {categoriesExist ? "No categories with active tasks found." : "No categories found."}
    </div>
    {categoriesExist ? (
      <button
        onClick={onShowAll}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Show All Categories
      </button>
    ) : (
      <p className="text-gray-600">
        You can create categories in the{' '}
        <Link to="/settings" className="text-blue-500 hover:underline">
          Settings
        </Link>{' '}
        page.
      </p>
    )}
  </div>
);
