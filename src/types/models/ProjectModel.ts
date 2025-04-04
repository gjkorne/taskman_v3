/**
 * Project domain model used throughout the application
 * This is the core data structure for projects
 */
export interface ProjectModel {
  // Core fields
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  
  // Metadata fields (with proper date objects)
  createdAt: Date;
  updatedAt: Date | null;
  createdBy: string | null;
  isDeleted: boolean;
  
  // Organization fields
  parentId: string | null; // For hierarchical project structure
  sortOrder: number | null; // For custom ordering
  
  // Settings
  defaultTaskStatus: string | null;
  defaultTaskPriority: string | null;
  settings: Record<string, any> | null; // Typed settings object
  
  // Offline sync properties
  pendingSync?: boolean;
  lastUpdated?: Date | null;
  syncError?: string | null;
}

/**
 * Input for creating a new project
 */
export interface NewProjectInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
  defaultTaskStatus?: string;
  defaultTaskPriority?: string;
  settings?: Record<string, any>;
}

/**
 * Input for updating an existing project
 */
export interface ProjectUpdateInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  sortOrder?: number | null;
  defaultTaskStatus?: string | null;
  defaultTaskPriority?: string | null;
  settings?: Record<string, any> | null;
  isDeleted?: boolean;
}
