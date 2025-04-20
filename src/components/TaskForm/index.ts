/**
 * Task Form Component Exports
 *
 * This file serves as the public API for TaskForm components.
 * It allows us to change the implementation without breaking imports elsewhere.
 */

import { UnifiedTaskForm } from './UnifiedTaskForm';
import { TaskFormModal } from './TaskFormModal';
import { QuickTaskEntry } from './QuickTaskEntry';

// Re-export components for public use
export { UnifiedTaskForm as TaskForm, TaskFormModal, QuickTaskEntry };

// Export a consistent interface for backward compatibility
export type { UnifiedTaskFormProps } from './UnifiedTaskForm';
