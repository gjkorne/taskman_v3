import { UnifiedTaskForm } from '../TaskForm/UnifiedTaskForm';

interface TaskEditFormProps {
  taskId?: string | null;
  onSaved?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  onTaskUpdated?: () => void;
  onSuccess?: () => void;
}

export function TaskEditForm({
  taskId = null,
  onSaved,
  onCancel,
  onClose,
  onTaskUpdated,
  onSuccess,
}: TaskEditFormProps) {
  // Merge callbacks to ensure compatibility with different components
  const handleSuccess = () => {
    if (onTaskUpdated) onTaskUpdated();
    if (onSaved) onSaved();
    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  return (
    <UnifiedTaskForm
      taskId={taskId}
      mode="edit"
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      onClose={onClose}
    />
  );
}
