import { ProjectApiDto, CreateProjectApiDto, UpdateProjectApiDto } from '../../types/api/projectDto';
import { ProjectModel, NewProjectInput, ProjectUpdateInput } from '../../types/models/ProjectModel';
import { BaseDataTransformer } from './DataTransformer';

/**
 * Transforms project data between API DTOs and application models
 * Handles data type conversions, field name mappings, and format standardization
 */
export class ProjectTransformer extends BaseDataTransformer<ProjectApiDto, ProjectModel> {
  /**
   * Convert API project data to application model
   */
  toModel(apiData: ProjectApiDto): ProjectModel {
    return {
      // Map basic fields
      id: apiData.id,
      name: apiData.name,
      description: apiData.description,
      color: apiData.color,
      icon: apiData.icon,
      
      // Date conversions
      createdAt: new Date(apiData.created_at),
      updatedAt: apiData.updated_at ? new Date(apiData.updated_at) : null,
      
      // Organization fields
      parentId: apiData.parent_id,
      sortOrder: apiData.sort_order,
      
      // Metadata fields
      createdBy: apiData.created_by,
      isDeleted: apiData.is_deleted === null ? false : apiData.is_deleted,
      
      // Settings
      defaultTaskStatus: apiData.default_task_status,
      defaultTaskPriority: apiData.default_task_priority,
      settings: apiData.settings,
      
      // Offline sync properties - not in API data
      pendingSync: false,
      lastUpdated: null,
      syncError: null
    };
  }
  
  /**
   * Convert application model to API DTO for creating/updating
   */
  toApi(model: ProjectModel): ProjectApiDto {
    return {
      id: model.id, // Include ID in the API format
      name: model.name,
      description: model.description,
      color: model.color,
      icon: model.icon,
      
      // Date field conversions (to ISO strings)
      created_at: model.createdAt.toISOString(),
      updated_at: model.updatedAt ? model.updatedAt.toISOString() : null,
      
      // Organization fields
      parent_id: model.parentId,
      sort_order: model.sortOrder,
      
      // Metadata fields
      created_by: model.createdBy,
      is_deleted: model.isDeleted,
      
      // Settings
      default_task_status: model.defaultTaskStatus,
      default_task_priority: model.defaultTaskPriority,
      settings: model.settings
    };
  }
  
  /**
   * Convert model to a create DTO format
   */
  toCreateDto(model: ProjectModel): CreateProjectApiDto {
    // Extract only the fields needed for creation (omitting id and timestamps)
    const apiDto = this.toApi(model);
    
    // Create a new object without the fields we want to omit
    const { id, created_at, updated_at, ...createDto } = apiDto;
    
    return createDto as CreateProjectApiDto;
  }
  
  /**
   * Convert new project input to API DTO for creation
   */
  createInputToApi(input: NewProjectInput): CreateProjectApiDto {
    return {
      name: input.name,
      description: input.description || null,
      color: input.color || null,
      icon: input.icon || null,
      parent_id: input.parentId || null,
      sort_order: input.sortOrder || null,
      default_task_status: input.defaultTaskStatus || null,
      default_task_priority: input.defaultTaskPriority || null,
      settings: input.settings || null,
      created_by: null, // Will be set by the server
      is_deleted: false
    };
  }
  
  /**
   * Convert update input to API DTO for updates
   */
  updateInputToApi(input: ProjectUpdateInput): UpdateProjectApiDto {
    const result: UpdateProjectApiDto = {};
    
    // Only include fields that are present in the input
    if (input.name !== undefined) result.name = input.name;
    if (input.description !== undefined) result.description = input.description;
    if (input.color !== undefined) result.color = input.color;
    if (input.icon !== undefined) result.icon = input.icon;
    if (input.parentId !== undefined) result.parent_id = input.parentId;
    if (input.sortOrder !== undefined) result.sort_order = input.sortOrder;
    if (input.defaultTaskStatus !== undefined) result.default_task_status = input.defaultTaskStatus;
    if (input.defaultTaskPriority !== undefined) result.default_task_priority = input.defaultTaskPriority;
    if (input.settings !== undefined) result.settings = input.settings;
    if (input.isDeleted !== undefined) result.is_deleted = input.isDeleted;
    
    // Always include updated_at
    result.updated_at = new Date().toISOString();
    
    return result;
  }
}

// Create singleton instance
export const projectTransformer = new ProjectTransformer();
