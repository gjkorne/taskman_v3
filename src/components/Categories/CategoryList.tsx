import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../Common/StatusBadge';
import type { Category } from '../../services/interfaces/ICategoryService';
import { TaskModel } from '../../types/models/TaskModel';

interface CategoryListProps {
  categories: Category[];
  expandedCategories: Record<string, boolean>;
  toggleCategory: (id: string) => void;
  getTasksByCategory: (categoryName: string) => TaskModel[];
  countActiveTasks: (categoryName: string) => number;
}

export const CategoryList: FC<CategoryListProps> = ({
  categories,
  expandedCategories,
  toggleCategory,
  getTasksByCategory,
  countActiveTasks,
}) => (
  <div className="grid grid-cols-1 gap-6">
    {categories.map((category) => {
      const tasks = getTasksByCategory(category.name);
      const activeCount = countActiveTasks(category.name);
      const isExpanded = !!expandedCategories[category.id];

      return (
        <div
          key={category.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          <div
            className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => toggleCategory(category.id)}
          >
            <div className="flex items-center space-x-3">
              {isExpanded ? (
                <ChevronDown className="text-gray-500 w-5 h-5" />
              ) : (
                <ChevronRight className="text-gray-500 w-5 h-5" />
              )}
              <h3 className="font-semibold text-lg">{category.name}</h3>
              <div className="flex items-center text-sm">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {activeCount} active
                </span>
                <span className="text-gray-500 ml-2">{tasks.length} total</span>
              </div>
            </div>
          </div>
          {isExpanded && tasks.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <div key={task.id} className="px-6 py-3 hover:bg-gray-50">
                    <Link
                      to={`/tasks/${task.id}`}
                      className="flex items-start justify-between"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <StatusBadge status={task.status} size="sm" />
                        {task.priority && (
                          <div
                            className={`text-xs px-2 py-0.5 rounded-full font-medium
                              ${
                                task.priority === 'high'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                          >
                            {task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)}
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          {isExpanded && tasks.length === 0 && (
            <div className="px-6 py-4 text-center text-gray-500 border-t border-gray-200">
              No tasks match current filters.
            </div>
          )}
        </div>
      );
    })}
  </div>
);
