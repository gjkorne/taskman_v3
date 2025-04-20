/**
 * Task Data Transfer Object - represents the exact shape of data from Supabase
 * This ensures we have a clear contract with the API and can handle any
 * schema mismatches or format conversions in a consistent way
 */
export interface TaskApiDto {
  // Core fields
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_time: string | null; // Database uses interval type
  actual_time: string | null; // Database uses interval type
  tags: string[] | null;

  // Notes and checklist fields
  notes: any | null; // JSONB in database - stores rich text content
  checklist_items: any[] | null; // JSONB array - stores checklist items
  note_type: 'text' | 'checklist' | 'both' | null; // Primary display type

  // Metadata fields
  created_at: string;
  updated_at: string | null;
  created_by: string | null; // This was mismatched with user_id before
  is_deleted: boolean | null;
  list_id: string | null;
  category_name: string | null;

  // Additional fields for NLP and AI features
  nlp_tokens: any | null;
  extracted_entities: any | null;
  embedding_data: any | null;
  confidence_score: number | null;
  processing_metadata: any | null;
}

/**
 * Create Task input DTO - used when creating a new task
 * Omits generated fields like id, created_at, etc.
 */
export type CreateTaskApiDto = Omit<
  TaskApiDto,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Update Task input DTO - represents the fields that can be updated
 */
export type UpdateTaskApiDto = Partial<
  Omit<TaskApiDto, 'id' | 'created_at' | 'created_by'>
>;

/**
 * Simplified Task DTO for list views
 * Contains only essential information for task listings
 */
export type TaskListItemApiDto = Pick<
  TaskApiDto,
  | 'id'
  | 'title'
  | 'description'
  | 'status'
  | 'priority'
  | 'due_date'
  | 'estimated_time'
  | 'tags'
  | 'category_name'
>;
