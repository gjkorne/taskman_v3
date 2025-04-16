import { useState, useEffect, useMemo } from 'react';
import { useCategories } from '../contexts/category';
import { useTaskData } from '../contexts/task';
import { StatusBadge } from '../components/Common/StatusBadge';
import { ChevronDown, ChevronRight, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CategoriesPage() {
  const { categories } = useCategories();
  const { tasks } = useTaskData();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [showEmptyCategories, setShowEmptyCategories] = useState(false);
  
  // Load previously expanded state from localStorage
  useEffect(() => {
    const savedExpanded = localStorage.getItem('expandedCategories');
    if (savedExpanded) {
      try {
        setExpandedCategories(JSON.parse(savedExpanded));
      } catch (e) {
        console.error('Error parsing saved expanded categories state:', e);
      }
    }
    
    // Load filter preferences
    const savedShowCompleted = localStorage.getItem('showCompletedTasks');
    if (savedShowCompleted) {
      setShowCompletedTasks(savedShowCompleted === 'true');
    }
    
    const savedShowEmpty = localStorage.getItem('showEmptyCategories');
    if (savedShowEmpty) {
      setShowEmptyCategories(savedShowEmpty === 'true');
    }
  }, []);
  
  // Save expanded state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('expandedCategories', JSON.stringify(expandedCategories));
  }, [expandedCategories]);
  
  // Save filter preferences when they change
  useEffect(() => {
    localStorage.setItem('showCompletedTasks', String(showCompletedTasks));
  }, [showCompletedTasks]);
  
  useEffect(() => {
    localStorage.setItem('showEmptyCategories', String(showEmptyCategories));
  }, [showEmptyCategories]);
  
  // Create a list of all categories from both the categories list and tasks
  const allCategories = useMemo(() => {
    // Start with the official categories
    const result = [...categories];
    
    // Get all unique category names from tasks
    const uniqueCategoryNames = new Set<string>();
    tasks.forEach(task => {
      if (task.category_name && !task.is_deleted) {
        uniqueCategoryNames.add(task.category_name.toLowerCase());
      }
    });
    
    // Add any missing categories
    uniqueCategoryNames.forEach(categoryName => {
      // Check if this category name already exists in our list (case insensitive)
      const exists = result.some(cat => 
        cat.name.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (!exists) {
        // Create a virtual category for this category name
        result.push({
          id: `virtual-${categoryName}`,
          name: categoryName,
          user_id: null,
          is_default: false,
          created_at: null,
          color: null
        });
      }
    });
    
    return result;
  }, [categories, tasks]);
  
  // Toggle category expanded/collapsed state
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Filter tasks by category and completion status
  const getTasksByCategory = (categoryName: string) => {
    return tasks.filter(task => 
      task.category_name?.toLowerCase() === categoryName.toLowerCase() && 
      !task.is_deleted && 
      (showCompletedTasks || task.status !== 'completed')
    );
  };
  
  // Count active (non-completed) tasks
  const countActiveTasks = (categoryName: string) => {
    return tasks.filter(task => 
      task.category_name?.toLowerCase() === categoryName.toLowerCase() && 
      !task.is_deleted && 
      task.status !== 'completed'
    ).length;
  };
  
  // Filter categories with active tasks
  const filteredCategories = allCategories.filter(category => 
    showEmptyCategories || countActiveTasks(category.name) > 0
  );
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 
              ${showCompletedTasks 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            aria-label={showCompletedTasks ? "Hide completed tasks" : "Show completed tasks"}
          >
            {showCompletedTasks ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />} 
            {showCompletedTasks ? "Hide Completed" : "Show Completed"}
          </button>
          
          <button
            onClick={() => setShowEmptyCategories(!showEmptyCategories)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 
              ${showEmptyCategories 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            aria-label={showEmptyCategories ? "Hide empty categories" : "Show empty categories"}
          >
            {showEmptyCategories ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />} 
            {showEmptyCategories ? "Hide Empty Categories" : "Show Empty Categories"}
          </button>
        </div>
      </div>
      
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-500 mb-4">
            {categories.length === 0 
              ? "No categories found." 
              : "No categories with active tasks found."}
          </div>
          {categories.length === 0 ? (
            <p className="text-gray-600">
              You can create categories in the <Link to="/settings" className="text-blue-500 hover:underline">Settings</Link> page.
            </p>
          ) : (
            <button
              onClick={() => setShowEmptyCategories(true)}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Show All Categories
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredCategories.map(category => {
            const categoryTasks = getTasksByCategory(category.name);
            const activeTasks = countActiveTasks(category.name);
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
                        {activeTasks} active
                      </span>
                      <span className="text-gray-500 ml-2">
                        {tasks.filter(t => t.category_name?.toLowerCase() === category.name.toLowerCase() && !t.is_deleted).length} total
                      </span>
                    </div>
                  </div>
                </div>
                
                {isExpanded && categoryTasks.length > 0 && (
                  <div className="border-t border-gray-200">
                    <div className="divide-y divide-gray-100">
                      {categoryTasks.map(task => (
                        <div key={task.id} className="px-6 py-3 hover:bg-gray-50">
                          <Link 
                            to={`/tasks/${task.id}`} 
                            className="flex items-start justify-between"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{task.title}</div>
                              {task.description && (
                                <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                                  {task.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <StatusBadge status={task.status} size="sm" />
                              {task.priority && (
                                <div className={`
                                  text-xs px-2 py-0.5 rounded-full font-medium
                                  ${task.priority === 'high' ? 'bg-red-100 text-red-700' : 
                                    task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 
                                    'bg-green-100 text-green-700'}
                                `}>
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {isExpanded && categoryTasks.length === 0 && (
                  <div className="px-6 py-4 text-center text-gray-500 border-t border-gray-200">
                    {activeTasks === 0 ? (
                      <>
                        No active tasks in this category.
                        {!showCompletedTasks && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCompletedTasks(true);
                            }}
                            className="text-blue-500 ml-1 hover:underline"
                          >
                            Show completed?
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        No tasks match current filters.
                      </>
                    )}
                    <Link to="/tasks" className="text-blue-500 ml-1 hover:underline">
                      Create one?
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;
