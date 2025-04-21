import { useMemo } from 'react';
import { useCategories } from '../contexts/category';
import { useTaskApp } from '../contexts/task';
import { TaskTransformer } from '../utils/transforms/TaskTransformer';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { useCategoriesPageData } from '../hooks/useCategoriesPageData';
import { CategoryFilterControls } from '../components/Categories/CategoryFilterControls';
import { CategoryList } from '../components/Categories/CategoryList';
import { EmptyState } from '../components/Categories/EmptyState';

export function CategoriesPage() {
  const { categories } = useCategories();
  const { tasks } = useTaskApp();
  const transformer = useMemo(() => new TaskTransformer(), []);
  const taskModels = useMemo(
    () => tasks.map((task) => transformer.toModel(task as any)),
    [tasks, transformer]
  );
  const [expandedCategories, setExpandedCategories] = useLocalStorageState<
    Record<string, boolean>
  >('expandedCategories', {});
  const [showCompletedTasks, setShowCompletedTasks] =
    useLocalStorageState<boolean>('showCompletedTasks', false);
  const [showEmptyCategories, setShowEmptyCategories] =
    useLocalStorageState<boolean>('showEmptyCategories', false);

  const {
    allCategories,
    filteredCategories,
    getTasksByCategory,
    countActiveTasks,
  } = useCategoriesPageData(
    categories,
    taskModels,
    showCompletedTasks,
    showEmptyCategories
  );

  const toggleCategory = (id: string) =>
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  if (filteredCategories.length === 0) {
    return (
      <EmptyState
        categoriesExist={allCategories.length > 0}
        onShowAll={() => setShowEmptyCategories(true)}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        <CategoryFilterControls
          showCompleted={showCompletedTasks}
          toggleCompleted={() => setShowCompletedTasks((prev) => !prev)}
          showEmpty={showEmptyCategories}
          toggleEmpty={() => setShowEmptyCategories((prev) => !prev)}
        />
      </div>
      <CategoryList
        categories={filteredCategories}
        expandedCategories={expandedCategories}
        toggleCategory={toggleCategory}
        getTasksByCategory={getTasksByCategory}
        countActiveTasks={countActiveTasks}
      />
    </div>
  );
}

export default CategoriesPage;
