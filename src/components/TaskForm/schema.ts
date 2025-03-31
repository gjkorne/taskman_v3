import { z } from 'zod';

export const taskInputSchema = z.object({
  rawInput: z.string()
    .min(1, 'Task description is required')
    .max(1000, 'Task description must be less than 1000 characters'),
});

export const taskFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  rawInput: z.string().optional(),
  nlpExtracted: z.object({
    confidence: z.number().min(0).max(1).optional(),
    entities: z.record(z.unknown()).optional(),
    suggestedCategory: z.string().optional(),
    suggestedPriority: z.string().optional(),
    timeEstimate: z.number().optional(),
  }).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Subcategory is required'),
  estimatedHours: z.string().optional(),
  estimatedMinutes: z.string()
    .refine(val => /^\d{1,2}$/.test(val), 'Minutes must be a number between 0-59')
    .refine(val => parseInt(val) >= 0 && parseInt(val) <= 59, 'Minutes must be between 0-59'),
  hasDueDate: z.boolean().default(false),
  dueDate: z.string().optional(),
  isEvergreen: z.boolean().default(false),
  isBlocked: z.boolean().default(false),
  isWaiting: z.boolean().default(false),
  energyLevel: z.enum(['low', 'medium', 'high']),
  location: z.string().optional(),
  context: z.array(z.enum(['work', 'personal', 'home', 'errands'])),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;
export type TaskInputData = z.infer<typeof taskInputSchema>;