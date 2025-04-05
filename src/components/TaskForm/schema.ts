import { z } from 'zod';

/**
 * Schema for initial task text input
 */
export const taskInputSchema = z.object({
  rawInput: z.string()
    .min(1, 'Task description is required')
    .max(1000, 'Task description must be less than 1000 characters'),
});

// Valid status values - aligned with database constraints
export const VALID_STATUSES = ['pending', 'active', 'in_progress', 'paused', 'completed', 'archived'] as const;
export type TaskStatus = typeof VALID_STATUSES[number];

// Valid priority values - aligned with database constraints
export const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = typeof VALID_PRIORITIES[number];

/**
 * Main task form schema - aligned with the actual Supabase database fields
 * Only includes fields that exist in the database or are needed for the UI
 */
export const taskFormSchema = z.object({
  // Core required fields
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  
  // NLP input fields
  rawInput: z.string().optional(),
  
  // Task metadata
  priority: z.enum(VALID_PRIORITIES),
  status: z.enum(VALID_STATUSES).default('pending'),
  
  // Category fields - aligned with database
  category_name: z.string().min(1, 'Category is required'), // Make category required
  
  // UI-specific fields (not directly in DB schema)
  subcategory: z.string().optional().default(''), // For UI management, stored in tags
  
  // Time fields - database uses interval type
  estimatedTime: z.string()
    .optional()
    .refine(
      (val) => !val || !isNaN(parseInt(val, 10)),
      { message: 'Estimated time must be a valid number of minutes' }
    ),
  
  // Date fields
  hasDueDate: z.boolean().default(false),
  due_date: z.string() // Matches exact DB field name
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(new Date(val).getTime()),
      { message: 'Due date must be a valid date' }
    ),
  
  // Tags
  tags: z.array(z.string()).default([]),
  
  // Flags
  is_deleted: z.boolean().default(false), // Matches exact DB field name
  
  // List integration - for project organization
  list_id: z.string().uuid().optional().nullable(), // Matches exact DB field name
}).refine(
  (data) => {
    // If hasDueDate is true, due_date must be provided
    if (data.hasDueDate && !data.due_date) {
      return false;
    }
    return true;
  },
  {
    message: "Due date is required when 'Has due date' is selected",
    path: ["due_date"]
  }
);

/**
 * Type representing the form data with database field names
 */
export type TaskFormData = z.infer<typeof taskFormSchema>;

/**
 * Type representing the form data submitted by users (UI field names)
 * This interface is used as a bridge between UI components and the database
 */
export interface TaskSubmitData {
  // Core fields
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  
  // Category related
  category?: string | null;          // UI field mapping to category_name
  categoryId?: string | null;        // For custom categories (not in DB schema)
  subcategory?: string;              // For UI organization
  
  // Time and date fields
  dueDate?: string | null;           // UI field mapping to due_date
  hasDueDate: boolean;
  estimatedTime?: string;
  
  // Organization
  tags: string[];
  listId?: string | null;            // UI field mapping to list_id
  
  // State
  isDeleted?: boolean;               // UI field mapping to is_deleted
  
  // User association
  created_by?: string | null;        // User ID of the task creator
  
  // NLP fields
  rawInput?: string;
}

/**
 * Type representing the actual database row with snake_case names
 * This matches the Supabase database structure exactly
 */
export interface TaskDatabaseRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_time: string | null;
  actual_time: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  is_deleted: boolean | null;
  list_id: string | null;
  nlp_tokens: any | null;
  extracted_entities: any | null;
  embedding_data: any | null;
  confidence_score: number | null;
  processing_metadata: any | null;
  category_name: string | null;
}

export type TaskInputData = z.infer<typeof taskInputSchema>;