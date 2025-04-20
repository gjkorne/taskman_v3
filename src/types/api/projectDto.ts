/**
 * Project Data Transfer Object - represents the exact shape of data from Supabase
 * This ensures we have a clear contract with the API and can handle any
 * schema mismatches or format conversions in a consistently
 */
export interface ProjectApiDto {
  // Core fields
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;

  // Metadata fields
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  is_deleted: boolean | null;

  // Organization fields
  parent_id: string | null; // For hierarchical project structure
  sort_order: number | null; // For custom ordering

  // Settings
  default_task_status: string | null;
  default_task_priority: string | null;
  settings: any | null; // JSON field for any project-specific settings
}

/**
 * Create Project input DTO - used when creating a new project
 * Omits generated fields like id, created_at, etc.
 */
export type CreateProjectApiDto = Omit<
  ProjectApiDto,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Update Project input DTO - represents the fields that can be updated
 */
export type UpdateProjectApiDto = Partial<
  Omit<ProjectApiDto, 'id' | 'created_at' | 'created_by'>
>;

/**
 * Simplified Project DTO for list views
 * Contains only essential information for project listings
 */
export interface ProjectListItemDto {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  taskCount?: number; // Optional field that can be included in API responses
}
