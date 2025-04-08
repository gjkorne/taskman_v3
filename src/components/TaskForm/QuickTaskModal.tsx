import { Modal } from '../UI/ModalComponents';
import { UnifiedTaskForm } from './UnifiedTaskForm';
import { useSettings } from '../../contexts/SettingsCompat';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

/**
 * A simplified modal for quick task creation
 * Shows a minimal version of the task form with collapsed sections
 */
export function QuickTaskModal({
  isOpen,
  onClose,
  onTaskCreated
}: QuickTaskModalProps) {
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
      title="Quick Create Task"
      size="lg"
      className="min-w-lg !rounded-lg"
    >
      <UnifiedTaskForm 
        mode="create"
        onSuccess={handleTaskCreated}
        onCancel={onClose}
        visibleCategories={visibleCategories}
        defaultExpandedNotes={false}
        defaultExpandedPriorityTiming={false}
        defaultExpandedMetadata={false}
        defaultExpandedFlags={false}
        isQuickTask={true}
      />
    </Modal>
  );
}

export default QuickTaskModal;
