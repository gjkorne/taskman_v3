/**
 * Core Task interface that represents the database schema
 * This should be used as the primary type definition across the application
 */
export type TaskStatus = 'pending' | 'active' | 'paused' | 'completed' | 'archived';

/**
 * Task status options as an object for component usage
 */
export const TaskStatusValues = {
  PENDING: 'pending' as TaskStatus,
  ACTIVE: 'active' as TaskStatus,
  PAUSED: 'paused' as TaskStatus,
  COMPLETED: 'completed' as TaskStatus,
  ARCHIVED: 'archived' as TaskStatus,
} as const;

export interface Task {
  // Primary fields
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  status: TaskStatus;
  priority: string;
  estimated_time: number | null;
  actual_time: number | null;
  due_date: string | null;
  completed_date: string | null;
  
  // Metadata fields
  updated_at: string | null;
  is_deleted: boolean | null;
  
  // Foreign keys
  list_id: string | null;
  
  // Categories
  category_name: string | null;
  category_id: string | null;
  
  // Tags array for subcategories and other metadata
  tags: string[] | null;
  
  // Optional UI-specific fields that may not be in the database
  category?: string; // Used for form handling
  
  // NLP-related fields
  nlp_tokens?: any;
  extracted_entities?: any;
  embedding_data?: any;
  confidence_score?: number;
  processing_metadata?: any;
  
  // Subtasks placeholder - to be implemented
  subtasks?: Task[];
}

/**
 * TaskFormData represents the shape of data in the task creation form
 * This differs from the database schema to accommodate UI-specific needs
 */
export interface TaskFormData {
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  estimatedTime?: string;
  hasDueDate: boolean;
  dueDate?: string;
  tags: string[];
  isDeleted: boolean;
  rawInput?: string;
  nlpExtracted?: {
    confidence: number;
    entities: Record<string, any>;
  };
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
  'category_name',
  'category_id'
] as const;

/**
 * Task priority options
 */
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

/**
 * Task category options
 */
export const TaskCategory = {
  WORK: 'work',
  PERSONAL: 'personal',
  CHILDCARE: 'childcare',
  OTHER: 'other',
} as const;
