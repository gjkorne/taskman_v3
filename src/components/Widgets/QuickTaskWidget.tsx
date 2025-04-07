import { QuickTaskEntry } from '../TaskForm/QuickTaskEntry'; // Adjust path if needed
import { useTaskData } from '../../contexts/task'; // Import useTaskData

/**
 * A widget component for quickly adding tasks.
 * Wraps the QuickTaskEntry component in a standard card format.
 */
export function QuickTaskWidget() {
  const { refreshTasks } = useTaskData(); // Get refreshTasks function

  // Callback function when a task is successfully created
  const handleTaskCreated = () => {
    console.log('Quick task created, refreshing list...');
    refreshTasks(); // Refresh the main task list
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Task Entry</h3>
      <QuickTaskEntry onTaskCreated={handleTaskCreated} />
    </div>
  );
}

// Optional: Define props if needed later
// interface QuickTaskWidgetProps {}
