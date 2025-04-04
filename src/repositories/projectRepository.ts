import { ProjectApiDto } from '../types/api/projectDto';
import { ProjectModel, NewProjectInput, ProjectUpdateInput } from '../types/models/ProjectModel';
import { SupabaseAdapter } from './storage/supabaseAdapter';
import { IndexedDBAdapter } from './storage/indexedDBAdapter';
import { NetworkStatusService } from '../services/networkStatusService';
import { BaseRepository, ISyncableEntity } from './baseRepository';
import { transformerFactory } from '../utils/transforms/TransformerFactory';

/**
 * Type definitions for project data transfer objects
 */
export type ProjectCreateDTO = NewProjectInput;
export type ProjectUpdateDTO = ProjectUpdateInput;

/**
 * Extended Project type with offline sync properties
 */
interface OfflineProject extends ProjectModel, ISyncableEntity {}

/**
 * ProjectRepository - provides unified access to project data across local and remote storage
 * 
 * This repository implements offline-second architecture:
 * - Remote storage (Supabase) is the primary data source
 * - Local storage is used as a fallback when offline
 * - Changes made while offline are synced when connectivity is restored
 * 
 * Note: This is a template ready for implementation when projects functionality is added
 */
export class ProjectRepository extends BaseRepository<OfflineProject, ProjectCreateDTO, ProjectUpdateDTO, ProjectApiDto> {
  private projectTransformer = transformerFactory.getProjectTransformer();
  
  constructor(networkStatus?: NetworkStatusService) {
    // Initialize network status service
    const networkStatusService = networkStatus || new NetworkStatusService();
    
    // Initialize storage adapters
    const remoteAdapter = new SupabaseAdapter<ProjectApiDto>('projects', {
      select: '*',
      orderBy: { column: 'updated_at', ascending: false },
    });
    
    // Initialize local adapter
    const localAdapter = new IndexedDBAdapter<OfflineProject>('projects', {
      dbName: 'taskman_offline_db',
      version: 1
    });
    
    // Call base constructor with adapters
    super(remoteAdapter, localAdapter, networkStatusService);
    
    // Initialize event listeners
    this.on('entity-created', (project: ProjectModel) => {
      console.log('Project created:', project.id, project.name);
    });
    
    this.on('entity-updated', (project: ProjectModel) => {
      console.log('Project updated:', project.id, project.name);
    });
    
    this.on('entity-deleted', (projectId: string) => {
      console.log('Project deleted:', projectId);
    });
  }
  
  /**
   * Transform API DTO to domain model
   */
  protected apiToDomain(dto: ProjectApiDto): OfflineProject {
    // Use the transformer to convert API DTO to model
    const projectModel = this.projectTransformer.toModel(dto);
    
    // Add offline sync properties
    return {
      ...projectModel,
      _pendingSync: false,
      _lastUpdated: new Date().toISOString(),
      _sync_error: undefined
    };
  }
  
  /**
   * Transform domain model to API DTO
   */
  protected domainToApi(model: OfflineProject): Omit<ProjectApiDto, 'id'> {
    // Use the transformer to convert model to API DTO
    const apiDto = this.projectTransformer.toApi(model);
    
    // Remove id to match BaseRepository interface
    const { id, ...apiData } = apiDto;
    return apiData;
  }
  
  /**
   * Transform creation DTO to domain model
   */
  protected createDtoToDomain(dto: ProjectCreateDTO): Omit<OfflineProject, 'id'> {
    // Convert creation input to project model
    return {
      name: dto.name,
      description: dto.description || null,
      color: dto.color || null,
      icon: dto.icon || null,
      
      // Dates and metadata
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null, // Will be set by server
      isDeleted: false,
      
      // Organization
      parentId: dto.parentId || null,
      sortOrder: dto.sortOrder || null,
      
      // Settings
      defaultTaskStatus: dto.defaultTaskStatus || null,
      defaultTaskPriority: dto.defaultTaskPriority || null,
      settings: dto.settings || null,
      
      // Offline sync properties
      pendingSync: false,
      lastUpdated: null,
      syncError: null
    } as Omit<OfflineProject, 'id'>;
  }
  
  /**
   * Apply update DTO to domain model
   */
  protected applyUpdateDto(model: OfflineProject, dto: ProjectUpdateDTO): OfflineProject {
    const updates: Partial<OfflineProject> = {
      ...model
    };
    
    // Apply each field if present in DTO
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.color !== undefined) updates.color = dto.color;
    if (dto.icon !== undefined) updates.icon = dto.icon;
    if (dto.parentId !== undefined) updates.parentId = dto.parentId;
    if (dto.sortOrder !== undefined) updates.sortOrder = dto.sortOrder;
    if (dto.defaultTaskStatus !== undefined) updates.defaultTaskStatus = dto.defaultTaskStatus;
    if (dto.defaultTaskPriority !== undefined) updates.defaultTaskPriority = dto.defaultTaskPriority;
    if (dto.settings !== undefined) updates.settings = dto.settings;
    if (dto.isDeleted !== undefined) updates.isDeleted = dto.isDeleted;
    
    // Always update the updated timestamp
    updates.updatedAt = new Date();
    
    return updates as OfflineProject;
  }
  
  /**
   * Get a project's tasks
   * This will be implemented when task-to-project relationships are added
   */
  async getProjectTasks(projectId: string): Promise<any[]> {
    // This is a placeholder for future implementation
    console.log(`Getting tasks for project: ${projectId}`);
    return [];
  }
  
  /**
   * Get projects by parent
   * For hierarchical project organization
   */
  async getChildProjects(parentId: string): Promise<OfflineProject[]> {
    const allProjects = await this.getAll();
    return allProjects.filter(project => project.parentId === parentId);
  }
  
  /**
   * Get top-level projects (those without a parent)
   */
  async getRootProjects(): Promise<OfflineProject[]> {
    const allProjects = await this.getAll();
    return allProjects.filter(project => !project.parentId);
  }
}

// Create singleton instance but commented out until projects functionality is implemented
// export const projectRepository = new ProjectRepository();
