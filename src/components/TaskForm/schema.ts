import { z } from 'zod';

/**
 * Schema for initial task text input
 */
export const taskInputSchema = z.object({
  rawInput: z.string()
    .min(1, 'Task description is required')
    .max(1000, 'Task description must be less than 1000 characters'),
});

// Valid status values
const VALID_STATUSES = ['pending', 'active', 'in_progress', 'completed', 'archived'] as const;

/**
 * Main task form schema - aligned with the actual Supabase database fields
 * Only includes fields that exist in the database
 */
export const taskFormSchema = z.object({
  // Core required fields
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  
  // NLP input fields
  rawInput: z.string().optional(),
  nlpExtracted: z.object({
    confidence: z.number().min(0).max(1).optional(),
    entities: z.record(z.unknown()).optional(),
    suggestedCategory: z.string().optional(),
    suggestedPriority: z.string().optional(),
    timeEstimate: z.number().optional(),
  }).optional(),
  
  // Task metadata
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().optional().default(''), // Maps to category_name in DB, actually nullable
  categoryId: z.string().optional(), // For custom user-defined categories
  subcategory: z.string().optional().default(''), // For UI management, stored in tags
  status: z.enum(VALID_STATUSES).default('pending'),
  
  // Time fields - database uses interval type
  estimatedTime: z.string()
    .optional()
    .refine(
      (val) => !val || !isNaN(parseInt(val, 10)),
      { message: 'Estimated time must be a valid number of minutes' }
    ),
  
  // Date fields
  hasDueDate: z.boolean().default(false),
  dueDate: z.string()
    .optional()
    .refine(
      (val) => !val || !isNaN(new Date(val).getTime()),
      { message: 'Due date must be a valid date' }
    ),
  
  // Tags
  tags: z.array(z.string()).default([]),
  
  // Flags
  isDeleted: z.boolean().default(false),
  
  // List integration - for project organization
  listId: z.string().uuid().optional(),
  
  // These fields will be handled automatically in submission
  // created_at, updated_at, created_by
}).refine(
  (data) => {
    // If hasDueDate is true, dueDate must be provided
    if (data.hasDueDate && !data.dueDate) {
      return false;
    }
    return true;
  },
  {
    message: "Due date is required when 'Has due date' is selected",
    path: ["dueDate"]
  }
);

export type TaskFormData = z.infer<typeof taskFormSchema>;
export type TaskInputData = z.infer<typeof taskInputSchema>;