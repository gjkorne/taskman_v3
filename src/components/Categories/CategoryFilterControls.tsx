import type { FC } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

interface CategoryFilterControlsProps {
  showCompleted: boolean;
  toggleCompleted: () => void;
  showEmpty: boolean;
  toggleEmpty: () => void;
}

export const CategoryFilterControls: FC<CategoryFilterControlsProps> = ({
  showCompleted,
  toggleCompleted,
  showEmpty,
  toggleEmpty,
}) => (
  <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
    <button
      onClick={toggleCompleted}
      className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 \
        ${
          showCompleted
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      aria-label={
        showCompleted ? 'Hide completed tasks' : 'Show completed tasks'
      }
    >
      {showCompleted ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
      {showCompleted ? 'Hide Completed' : 'Show Completed'}
    </button>
    <button
      onClick={toggleEmpty}
      className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 \
        ${
          showEmpty
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      aria-label={showEmpty ? 'Hide empty categories' : 'Show empty categories'}
    >
      {showEmpty ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
      {showEmpty ? 'Hide Empty Categories' : 'Show Empty Categories'}
    </button>
  </div>
);
