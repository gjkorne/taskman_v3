import { TaskApiDto, CreateTaskApiDto, UpdateTaskApiDto } from '../../types/api/taskDto';
import { TaskModel, NewTaskInput, TaskUpdateInput } from '../../types/models/TaskModel';
import { BaseDataTransformer } from './DataTransformer';

/**
 * Transforms task data between API DTOs and application models
 * Handles data type conversions, field name mappings, and format standardization
 */
export class TaskTransformer extends BaseDataTransformer<TaskApiDto, TaskModel> {
  /**
   * Convert API task data to application model
   */
  toModel(apiData: TaskApiDto): TaskModel {
    // Handle fields that might be null in the database but should never be null in the model
    const tags = apiData.tags || [];
    const isDeleted = apiData.is_deleted === null ? false : apiData.is_deleted;
    
    return {
      // Map basic fields
      id: apiData.id,
      title: apiData.title,
      description: apiData.description,
      status: apiData.status as any, // Using type assertion since we know the values match
      priority: apiData.priority as any,
      
      // Date conversions
      dueDate: apiData.due_date ? new Date(apiData.due_date) : null,
      createdAt: new Date(apiData.created_at),
      updatedAt: apiData.updated_at ? new Date(apiData.updated_at) : null,
      
      // Time conversions from Postgres interval to minutes
      estimatedTimeMinutes: this.parseIntervalToMinutes(apiData.estimated_time),
      actualTimeMinutes: this.parseIntervalToMinutes(apiData.actual_time),
      
      // Array and object fields
      tags,
      
      // Notes and checklist fields - required by TaskModel interface
      notes: apiData.notes || null,
      checklistItems: apiData.checklist_items || null,
      noteType: apiData.note_type || null,
      
      // Metadata fields
      createdBy: apiData.created_by,
      isDeleted,
      listId: apiData.list_id,
      categoryName: apiData.category_name,
      
      // NLP and AI fields
      nlpTokens: apiData.nlp_tokens,
      extractedEntities: apiData.extracted_entities,
      embeddingData: apiData.embedding_data,
      confidenceScore: apiData.confidence_score,
      processingMetadata: apiData.processing_metadata,
      
      // Offline sync fields - these are not in the API data, setting defaults
      isSynced: true,
      syncStatus: 'synced',
      conflictResolution: null,
      localUpdatedAt: null,
      syncError: null,
    };
  }
  
  /**
   * Convert application model to API format
   */
  toApi(model: TaskModel): TaskApiDto {
    return {
      // Map basic fields
      id: model.id,
      title: model.title,
      description: model.description,
      status: model.status,
      priority: model.priority,
      
      // Date conversions
      due_date: model.dueDate ? model.dueDate.toISOString() : null,
      created_at: model.createdAt.toISOString(),
      updated_at: model.updatedAt ? model.updatedAt.toISOString() : null,
      
      // Time conversions from minutes to Postgres interval
      estimated_time: this.minutesToIntervalString(model.estimatedTimeMinutes ?? null),
      actual_time: this.minutesToIntervalString(model.actualTimeMinutes ?? null),
      
      // Array and object fields
      tags: model.tags,
      
      // Notes and checklist fields
      notes: model.notes,
      checklist_items: model.checklistItems,
      note_type: model.noteType,
      
      // Metadata fields
      created_by: model.createdBy || null,
      is_deleted: model.isDeleted,
      list_id: model.listId || null,
      category_name: model.categoryName || null,
      
      // NLP and AI fields
      nlp_tokens: model.nlpTokens || null,
      extracted_entities: model.extractedEntities || null,
      embedding_data: model.embeddingData || null,
      confidence_score: model.confidenceScore || null,
      processing_metadata: model.processingMetadata || null,
    };
  }
  
  /**
   * Convert new task input to API create DTO
   */
  newTaskToApiDto(input: NewTaskInput, userId?: string): CreateTaskApiDto {
    return {
      title: input.title,
      description: input.description || null,
      status: input.status || 'pending',
      priority: input.priority || 'medium',
      due_date: input.dueDate ? input.dueDate.toISOString() : null,
      estimated_time: this.minutesToIntervalString(input.estimatedTimeMinutes || null),
      actual_time: null,
      tags: input.tags || [],
      created_by: userId || null,
      is_deleted: false,
      list_id: input.listId || null,
      category_name: input.categoryName || null,
      
      // NLP fields required by CreateTaskApiDto
      nlp_tokens: null,
      extracted_entities: null,
      embedding_data: null,
      confidence_score: null,
      processing_metadata: null,
      
      // Notes and checklist fields
      notes: null,
      checklist_items: null,
      note_type: null
    };
  }
  
  /**
   * Convert task update input to API update DTO
   */
  updateTaskToApiDto(input: TaskUpdateInput): UpdateTaskApiDto {
    const result: UpdateTaskApiDto = {};
    
    // Only include defined properties
    if (input.title !== undefined) result.title = input.title;
    if (input.description !== undefined) result.description = input.description;
    if (input.status !== undefined) result.status = input.status;
    if (input.priority !== undefined) result.priority = input.priority;
    if (input.dueDate !== undefined) {
      result.due_date = input.dueDate ? input.dueDate.toISOString() : null;
    }
    if (input.estimatedTimeMinutes !== undefined) {
      result.estimated_time = this.minutesToIntervalString(input.estimatedTimeMinutes);
    }
    if (input.actualTimeMinutes !== undefined) {
      result.actual_time = this.minutesToIntervalString(input.actualTimeMinutes);
    }
    if (input.tags !== undefined) result.tags = input.tags;
    if (input.isDeleted !== undefined) result.is_deleted = input.isDeleted;
    if (input.listId !== undefined) result.list_id = input.listId;
    if (input.categoryName !== undefined) result.category_name = input.categoryName;
    
    // Always include updated_at
    result.updated_at = new Date().toISOString();
    
    return result;
  }
  
  /**
   * Convert model to new task input format for API creation
   */
  toNewTaskInput(model: Partial<TaskModel>): CreateTaskApiDto {
    return {
      title: model.title || '',
      description: model.description || null,
      status: model.status || 'pending',
      priority: model.priority || 'medium',
      due_date: model.dueDate ? model.dueDate.toISOString() : null,
      estimated_time: this.minutesToIntervalString(model.estimatedTimeMinutes === null ? null : model.estimatedTimeMinutes),
      actual_time: this.minutesToIntervalString(model.actualTimeMinutes === null ? null : model.actualTimeMinutes),
      tags: model.tags || [],
      category_name: model.categoryName || null,
      created_by: model.createdBy || null,
      is_deleted: false,
      list_id: model.listId || null,
      
      // Include NLP fields with default values
      nlp_tokens: model.nlpTokens || null,
      extracted_entities: model.extractedEntities || null,
      embedding_data: model.embeddingData || null,
      confidence_score: model.confidenceScore || null,
      processing_metadata: model.processingMetadata || null,
      
      // Notes and checklist fields
      notes: model.notes || null,
      checklist_items: model.checklistItems || null,
      note_type: model.noteType || null
    };
  }
  
  /**
   * Convert application model to task update input for API update
   */
  toUpdateTaskInput(model: Partial<TaskModel>): UpdateTaskApiDto {
    const updateDto: UpdateTaskApiDto = {};
    
    // Only include properties that are present in the model
    if (model.title !== undefined) updateDto.title = model.title;
    if (model.description !== undefined) updateDto.description = model.description;
    if (model.status !== undefined) updateDto.status = model.status;
    if (model.priority !== undefined) updateDto.priority = model.priority;
    if (model.dueDate !== undefined) updateDto.due_date = model.dueDate ? model.dueDate.toISOString() : null;
    if (model.estimatedTimeMinutes !== undefined) updateDto.estimated_time = this.minutesToIntervalString(model.estimatedTimeMinutes === null ? null : model.estimatedTimeMinutes);
    if (model.actualTimeMinutes !== undefined) updateDto.actual_time = this.minutesToIntervalString(model.actualTimeMinutes === null ? null : model.actualTimeMinutes);
    if (model.tags !== undefined) updateDto.tags = model.tags;
    if (model.isDeleted !== undefined) updateDto.is_deleted = model.isDeleted;
    if (model.listId !== undefined) updateDto.list_id = model.listId;
    if (model.categoryName !== undefined) updateDto.category_name = model.categoryName;
    
    // Add NLP fields if they're present in the model
    if (model.confidenceScore !== undefined) updateDto.confidence_score = model.confidenceScore;
    if (model.processingMetadata !== undefined) updateDto.processing_metadata = model.processingMetadata;
    if (model.nlpTokens !== undefined) updateDto.nlp_tokens = model.nlpTokens;
    if (model.extractedEntities !== undefined) updateDto.extracted_entities = model.extractedEntities;
    if (model.embeddingData !== undefined) updateDto.embedding_data = model.embeddingData;
    if (model.notes !== undefined) updateDto.notes = model.notes;
    if (model.checklistItems !== undefined) updateDto.checklist_items = model.checklistItems;
    if (model.noteType !== undefined) updateDto.note_type = model.noteType;
    
    // Always update the updated_at field to track when changes occurred
    updateDto.updated_at = new Date().toISOString();
    
    return updateDto;
  }
  
  /**
   * Convert model to API format for creation
   * This is a shorthand for creating a new task in the API
   */
  toCreateDto(model: TaskModel): CreateTaskApiDto {
    return {
      title: model.title,
      description: model.description,
      status: model.status,
      priority: model.priority,
      due_date: model.dueDate ? model.dueDate.toISOString() : null,
      estimated_time: this.minutesToIntervalString(model.estimatedTimeMinutes ?? null),
      actual_time: this.minutesToIntervalString(model.actualTimeMinutes ?? null),
      tags: model.tags,
      created_by: model.createdBy || null,
      is_deleted: model.isDeleted,
      list_id: model.listId || null,
      category_name: model.categoryName || null,
      
      // NLP fields
      nlp_tokens: model.nlpTokens || null,
      extracted_entities: model.extractedEntities || null,
      embedding_data: model.embeddingData || null,
      confidence_score: model.confidenceScore || null,
      processing_metadata: model.processingMetadata || null,
      
      // Notes and checklist fields
      notes: model.notes,
      checklist_items: model.checklistItems,
      note_type: model.noteType
    };
  }
  
  /**
   * Convert minutes to Postgres interval format
   * @private
   */
  minutesToIntervalString(minutes: number | null): string | null {
    if (minutes === null || minutes === undefined) return null;
    return `${minutes * 60} seconds`;
  }
  
  /**
   * Parse Postgres interval string to minutes
   * @private
   */
  parseIntervalToMinutes(interval: string | null): number | null {
    if (!interval) return null;
    
    // Assuming intervals are in the format '10 minutes' or '600 seconds'
    const match = interval.match(/(\d+)\s+(seconds|minutes|hours)/i);
    if (!match) return null;
    
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'seconds':
        return Math.round(value / 60);
      case 'minutes':
        return value;
      case 'hours':
        return value * 60;
      default:
        return value;
    }
  }
}

// Create singleton instance
export const taskTransformer = new TaskTransformer();
