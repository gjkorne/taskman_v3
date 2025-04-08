import { TaskForm } from './index';
import { Modal } from '../UI/ModalComponents';
import { useSettings } from '../../contexts/SettingsCompat';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  initialDate?: Date;
}

/**
 * Modal wrapper for the task form
 * Manages the display and positioning of the task creation/edit form
 */
export function TaskFormModal({
  isOpen,
  onClose,
  onTaskCreated,
  initialDate
}: TaskFormModalProps) {
  // Get user settings for visible categories
  const { settings } = useSettings();
  const visibleCategories = settings.quickTaskCategories || [];

  // Handle successful task creation
  const handleTaskCreated = () => {
    onTaskCreated();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Create Task"
      size="2xl"
      className="min-w-2xl !rounded-lg"
    >
      <TaskForm 
        mode="create"
        onSuccess={handleTaskCreated}
        onCancel={onClose}
        initialValues={initialDate ? { due_date: initialDate.toISOString().split('T')[0] } : undefined}
        visibleCategories={visibleCategories}
      />
    </Modal>
  );
}
