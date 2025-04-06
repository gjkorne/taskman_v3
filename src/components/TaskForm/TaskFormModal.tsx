import { TaskForm } from './index';
import { Modal } from '../UI/ModalComponents';

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
      size="lg"
    >
      <TaskForm 
        mode="create"
        onSuccess={handleTaskCreated}
        onCancel={onClose}
        initialValues={initialDate ? { due_date: initialDate.toISOString().split('T')[0] } : undefined}
      />
    </Modal>
  );
}
