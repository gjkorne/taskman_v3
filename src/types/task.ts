/**
 * Core Task interface that represents the database schema
 * This should be used as the primary type definition across the application
 */
export enum TaskStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export type TaskStatusType = 'pending' | 'active' | 'in_progress' | 'paused' | 'completed' | 'archived';

/**
 * Task status options as an object for component usage
 */
export const TaskStatusValues = {
  PENDING: TaskStatus.PENDING,
  ACTIVE: TaskStatus.ACTIVE,
  IN_PROGRESS: TaskStatus.IN_PROGRESS,
  PAUSED: TaskStatus.PAUSED,
  COMPLETED: TaskStatus.COMPLETED,
  ARCHIVED: TaskStatus.ARCHIVED,
} as const;

/**
 * Task priority options
 */
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];

/**
 * Task category options
 */
export const TaskCategory = {
  WORK: 'work',
  PERSONAL: 'personal',
  CHILDCARE: 'childcare',
  OTHER: 'other',
} as const;

/**
 * Task interface aligned with database schema
 * Use this as the primary data structure for tasks throughout the app
 */
export interface Task {
  // Primary fields
  id: string;
  title: string;
  description: string | null;
  status: TaskStatusType;
  priority: TaskPriorityType;
  
  // Time tracking fields
  estimated_time: string | null; // PostgreSQL interval as string
  actual_time: string | null;    // PostgreSQL interval as string
  
  // Date fields
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
  
  // Ownership and state
  created_by: string | null;
  is_deleted: boolean | null;
  
  // Organization fields
  list_id: string | null;
  category_name: string | null;
  tags: string[] | null;
  
  // NLP-related fields
  nlp_tokens?: any | null;
  extracted_entities?: any | null;
  embedding_data?: any | null;
  confidence_score?: number | null;
  processing_metadata?: any | null;
  
  // UI-specific fields (not persisted to database)
  hasDueDate?: boolean;           // Derived from due_date for form handling
  estimatedTimeMinutes?: number;  // Derived from estimated_time for form handling
  category?: string;              // Alias for category_name for backward compatibility
}

/**
 * Represents the database columns as they appear in Supabase
 * Use this for reference when working with database queries
 */
export const TaskColumns = [
  'id',
  'title',
  'description',
  'status',
  'priority',
  'due_date',
  'estimated_time',
  'actual_time',
  'tags',
  'created_at',
  'updated_at',
  'created_by',
  'is_deleted',
  'list_id',
  'nlp_tokens',
  'extracted_entities',
  'embedding_data',
  'confidence_score',
  'processing_metadata',
  'category_name'
] as const;

// Export for backward compatibility
export type { TaskFormData } from '../components/TaskForm/schema';
