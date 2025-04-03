import { UnifiedTaskForm } from './UnifiedTaskForm';

/**
 * TaskFormWrapper component
 * A simple wrapper around UnifiedTaskForm for task creation
 */
export function TaskFormWrapper({ onTaskCreated }: { onTaskCreated?: () => void }) {
  return (
    <UnifiedTaskForm 
      mode="create"
      onSuccess={onTaskCreated}
    />
  );
}

export default TaskFormWrapper;
