import type { FC } from 'react';
import { FilterPanel } from './FilterPanel';
import { TaskContainer } from './TaskContainer';
import { QuickTaskEntry } from '../TaskForm';
import type { TaskFilter } from './FilterPanel';
import type { Task } from '../../types/task';

interface TaskListViewProps {
  filteredTasks: Task[];
  isLoading: boolean;
  isRefreshing: boolean;
  filters: TaskFilter;
  setFilters: (filters: TaskFilter) => void;
  refreshTasks: () => void;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onTimerStateChange?: () => void;
  viewMode: string;
}

export const TaskListView: FC<TaskListViewProps> = ({
  filteredTasks,
  isLoading,
  isRefreshing,
  filters,
  setFilters,
  refreshTasks,
  onEdit,
  onDelete,
  onTimerStateChange,
  viewMode,
}) => (
  <div className="w-full mx-auto px-0 py-1 sm:px-6 sm:py-8 relative bg-gray-50 shadow-lg">
    <FilterPanel
      filters={filters}
      onChange={setFilters}
      filteredCount={filteredTasks.length}
    />
    <div className="my-4">
      <QuickTaskEntry onTaskCreated={refreshTasks} />
    </div>
    <TaskContainer
      tasks={filteredTasks}
      isLoading={isLoading}
      onEdit={onEdit}
      onDelete={onDelete}
      onTimerStateChange={onTimerStateChange}
    />
  </div>
);
