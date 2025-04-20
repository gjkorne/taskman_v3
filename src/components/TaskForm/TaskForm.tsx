// This component is now a simple wrapper around UnifiedTaskForm
// Maintained for backward compatibility with existing code
import { UnifiedTaskForm } from './UnifiedTaskForm';

/**
 * TaskForm component
 *
 * A thin wrapper around the UnifiedTaskForm component for backward compatibility.
 */
export function TaskForm({ onTaskCreated }: { onTaskCreated?: () => void }) {
  return <UnifiedTaskForm mode="create" onSuccess={onTaskCreated} />;
}

export default TaskForm;
