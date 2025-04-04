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
      estimated_time: this.minutesToIntervalString(input.estimatedTimeMinutes),
      actual_time: null,
      tags: input.tags || [],
      created_by: userId || null,
      is_deleted: false,
      list_id: input.listId || null,
      category_name: input.categoryName || null,
      confidence_score: null,
      processing_metadata: null,
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
      estimated_time: this.minutesToIntervalString(model.estimatedTimeMinutes ?? null),
      actual_time: this.minutesToIntervalString(model.actualTimeMinutes ?? null),
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
      processing_metadata: model.processingMetadata || null
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
    if (model.estimatedTimeMinutes !== undefined) updateDto.estimated_time = this.minutesToIntervalString(model.estimatedTimeMinutes ?? null);
    if (model.actualTimeMinutes !== undefined) updateDto.actual_time = this.minutesToIntervalString(model.actualTimeMinutes ?? null);
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
      processing_metadata: model.processingMetadata || null
    };
  }
  
  /**
   * Parse a Postgres interval string to minutes
   * Handles formats like '01:30:00' (1 hour 30 minutes) or '1 day 2 hours 30 minutes'
   */
  private parseIntervalToMinutes(interval: string | null): number | null {
    if (!interval) return null;
    
    // Common interval formats from Postgres
    
    // Format: HH:MM:SS
    const timeRegex = /^(\d{2}):(\d{2}):(\d{2})$/;
    if (timeRegex.test(interval)) {
      const matches = interval.match(timeRegex);
      if (matches) {
        const hours = parseInt(matches[1], 10);
        const minutes = parseInt(matches[2], 10);
        return hours * 60 + minutes;
      }
    }
    
    // Format: X days HH:MM:SS
    const dayTimeRegex = /^(\d+) days? (\d{2}):(\d{2}):(\d{2})$/;
    if (dayTimeRegex.test(interval)) {
      const matches = interval.match(dayTimeRegex);
      if (matches) {
        const days = parseInt(matches[1], 10);
        const hours = parseInt(matches[2], 10);
        const minutes = parseInt(matches[3], 10);
        return days * 24 * 60 + hours * 60 + minutes;
      }
    }
    
    // Format: X hours Y minutes Z seconds
    const verbalRegex = /(?:(\d+) hours?)?(?:[ ,]?(\d+) minutes?)?(?:[ ,]?(\d+) seconds?)?/;
    const verbalMatches = interval.match(verbalRegex);
    if (verbalMatches) {
      const hours = verbalMatches[1] ? parseInt(verbalMatches[1], 10) : 0;
      const minutes = verbalMatches[2] ? parseInt(verbalMatches[2], 10) : 0;
      return hours * 60 + minutes;
    }
    
    // If we can't parse it, log and return null
    console.warn(`Could not parse interval format: ${interval}`);
    return null;
  }
  
  /**
   * Convert minutes to a Postgres interval string
   */
  private minutesToIntervalString(minutes: number | null): string | null {
    if (minutes === null || minutes === undefined || isNaN(Number(minutes))) return null;
    
    const numericMinutes = Number(minutes);
    const hours = Math.floor(numericMinutes / 60);
    const mins = numericMinutes % 60;
    
    // Format as 'HH:MM:00' for Postgres
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
  }
}

// Create singleton instance
export const taskTransformer = new TaskTransformer();
