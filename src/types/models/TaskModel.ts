import { TaskStatus, TaskStatusType, TaskPriorityType } from '../task';

/**
 * Task Model - Client-side representation of a task
 * Uses JavaScript conventions (camelCase) and appropriate data types
 * for use in the application code
 */
export interface TaskModel {
  // Core fields
  id: string;
  title: string;
  description: string | null;
  status: TaskStatusType;
  priority: TaskPriorityType;
  dueDate: Date | null;
  estimatedTimeMinutes: number | null; // Converted from interval to minutes
  actualTimeMinutes: number | null; // Converted from interval to minutes
  tags: string[];

  // Notes and Checklist fields
  notes: any | null; // JSONB in database - stores rich text content
  checklistItems: any[] | null; // JSONB array - stores checklist items
  noteType: 'text' | 'checklist' | 'both' | null; // Primary display type

  // Metadata fields
  createdAt: Date;
  updatedAt: Date | null;
  createdBy: string | null;
  isDeleted: boolean;
  listId: string | null;
  categoryName: string | null;

  // Additional fields for NLP and AI features
  nlpTokens?: any | null;
  extractedEntities?: any | null;
  embeddingData?: any | null;
  confidenceScore?: number | null;
  processingMetadata?: any | null;

  // UI helper fields (not stored in DB)
  rawInput?: string;

  // Offline sync fields
  isSynced: boolean;
  syncStatus: 'pending' | 'synced' | 'failed' | 'none';
  conflictResolution: string | null;
  localUpdatedAt: Date | null;
  syncError: string | null;
}

/**
 * New Task Input - Used when creating a new task in the application
 * Contains only the required fields for task creation
 */
export interface NewTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatusType;
  priority?: TaskPriorityType;
  dueDate?: Date | null;
  estimatedTimeMinutes?: number | null;
  tags?: string[];
  categoryName?: string | null;
  listId?: string | null;
}

/**
 * Task Update Input - Used when updating an existing task
 */
export type TaskUpdateInput = Partial<
  Omit<TaskModel, 'id' | 'createdAt' | 'createdBy'>
>;

/**
 * Create default values for new tasks
 */
export function createDefaultTask(): NewTaskInput {
  return {
    title: '',
    description: null,
    status: TaskStatus.PENDING,
    priority: 'medium',
    dueDate: null,
    estimatedTimeMinutes: null,
    tags: [],
    categoryName: null,
  };
}
