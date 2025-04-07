/**
 * Core Task interface that represents the database schema
 * This should be used as the primary type definition across the application
 */
export enum TaskStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

// Make this consistent with TaskForm/schema.ts which includes 'in_progress'
export type TaskStatusType = 'pending' | 'active' | 'in_progress' | 'paused' | 'completed' | 'archived';

/**
 * Task status options as an object for component usage
 */
export const TaskStatusValues = {
  PENDING: TaskStatus.PENDING,
  ACTIVE: TaskStatus.ACTIVE,
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
 * 
 * IMPORTANT: Property names use snake_case to match database column names
 */
export interface Task {
  // Core fields
  id: string;
  title: string;
  description: string;
  status: TaskStatusType;
  priority: TaskPriorityType;
  due_date: string | null;
  estimated_time: string | null;
  actual_time: string | null;
  tags: string[] | null;
  
  // Metadata fields
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  is_deleted: boolean;
  list_id: string | null;
  category_name: string | null;
  category?: string; // Alias for category_name for backward compatibility
  last_active_at?: string | null; // When the task was last interacted with
  last_timer_stop?: string | null; // When the timer was last stopped for this task
  
  // Notes and checklist fields - these can co-exist now
  notes: any | null;              // JSONB in database - stores rich text notes
  checklist_items: any[] | null;  // JSONB array in database - stores checklist items
  note_type: 'text' | 'checklist' | 'both' | null; // Primary display type
  
  // NLP fields
  nlp_tokens?: any | null;
  extracted_entities?: any | null;
  embedding_data?: any | null;
  confidence_score?: number | null;
  processing_metadata?: any | null;
  
  // Non-database fields for client-side use
  rawInput?: string;
  
  // Sync fields
  _is_synced?: boolean;
  _sync_status?: 'pending' | 'synced' | 'failed';
  _conflict_resolution?: string | null;
  _local_updated_at?: string;
  _sync_error?: string;
}

/**
 * Represents the database columns as they appear in Supabase
 * Use this for reference when working with database queries
 */
export const TaskColumns = {
  ID: 'id',
  TITLE: 'title',
  DESCRIPTION: 'description',
  STATUS: 'status',
  PRIORITY: 'priority',
  DUE_DATE: 'due_date',
  ESTIMATED_TIME: 'estimated_time',
  ACTUAL_TIME: 'actual_time',
  TAGS: 'tags',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  IS_DELETED: 'is_deleted',
  LIST_ID: 'list_id',
  CATEGORY_NAME: 'category_name',
  NLP_TOKENS: 'nlp_tokens',
  EXTRACTED_ENTITIES: 'extracted_entities',
  EMBEDDING_DATA: 'embedding_data',
  CONFIDENCE_SCORE: 'confidence_score',
  PROCESSING_METADATA: 'processing_metadata',
  NOTES: 'notes',
  CHECKLIST_ITEMS: 'checklist_items',
  NOTE_TYPE: 'note_type'
} as const;

// Export for backward compatibility
export type { TaskFormData } from '../components/TaskForm/schema';
