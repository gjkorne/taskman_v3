import { supabase } from '../../lib/supabase';
import { BaseService, ServiceError } from '../BaseService';
import { ICategoryService, Category, CategoryInput, CategoryServiceEvents } from '../interfaces/ICategoryService';

// Implementation of the Category service using Supabase
export class CategoryService extends BaseService<CategoryServiceEvents> implements ICategoryService {
  constructor() {
    super();
    this.markReady();
  }

  /**
   * Mark the service as ready
   */
  protected markReady() {
    this.ready = true;
    this.emit('ready');
  }

  // Helper method to check if user is authenticated
  private async ensureAuthenticated(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('You must be logged in to perform this action');
    }
    return session.user.id;
  }

  /**
   * Get all categories for the current user
   */
  async getCategories(): Promise<{ data: Category[] | null; error: ServiceError | null }> {
    try {
      const userId = await this.ensureAuthenticated();
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      
      if (error) throw error;
      
      // Emit the categories-loaded event
      this.emit('categories-loaded', data as Category[]);
      
      return { data, error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'category.fetch_error');
      this.emit('error', serviceError);
      return { data: null, error: serviceError };
    }
  }

  /**
   * Get a specific category by ID
   */
  async getCategoryById(id: string): Promise<{ data: Category | null; error: ServiceError | null }> {
    try {
      await this.ensureAuthenticated();
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'category.fetch_by_id_error');
      this.emit('error', serviceError);
      return { data: null, error: serviceError };
    }
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: CategoryInput): Promise<{ data: Category | null; error: ServiceError | null }> {
    try {
      const userId = await this.ensureAuthenticated();
      
      // Format data for database
      const newCategory = {
        ...categoryData,
        user_id: userId,
        created_at: new Date().toISOString()
      };
      
      // Add retry logic for conflict errors
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const { data, error } = await supabase
            .from('categories')
            .insert(newCategory)
            .select()
            .single();
          
          if (error) {
            // If it's a conflict error, retry with a modified name
            if (error.code === '409' || error.message?.includes('Conflict')) {
              console.log(`Conflict detected on category creation, retrying...`);
              retryCount++;
              
              // Modify the name slightly to avoid the conflict
              if (newCategory.name) {
                newCategory.name = `${newCategory.name} (${retryCount})`;
              }
              
              // Wait a small random amount of time to reduce collision probability
              await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
              continue; // Try again with modified data
            }
            
            throw error;
          }
          
          // Success - emit event and return
          this.emit('category-created', data as Category);
          return { data, error: null };
        } catch (innerError: any) {
          // If it's not a conflict or we've exceeded retries, rethrow
          if (!(innerError.code === '409' || innerError.message?.includes('Conflict')) || retryCount >= maxRetries) {
            throw innerError;
          }
          retryCount++;
        }
      }
      
      // If we get here, we've exceeded retries
      throw new Error(`Failed to create category after ${maxRetries} retries due to conflicts`);
    } catch (error) {
      const serviceError = this.processError(error, 'category.create_error');
      this.emit('error', serviceError);
      return { data: null, error: serviceError };
    }
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, updates: Partial<CategoryInput>): Promise<{ data: Category | null; error: ServiceError | null }> {
    try {
      await this.ensureAuthenticated();
      
      // Add retry logic for conflict errors
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
          
          if (error) {
            // If it's a conflict error, retry with fresh data
            if (error.code === '409' || error.message?.includes('Conflict')) {
              console.log(`Conflict detected on category update (${id}), retrying...`);
              retryCount++;
              
              // Get the latest version before retrying
              const { data: latestData } = await supabase
                .from('categories')
                .select('*')
                .eq('id', id)
                .single();
                
              if (latestData) {
                // Wait a small random amount of time to reduce collision probability
                await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
                continue; // Try again with the latest data
              }
            }
            
            throw error;
          }
          
          // Success - emit event and return
          this.emit('category-updated', data as Category);
          return { data, error: null };
        } catch (innerError: any) {
          // If it's not a conflict or we've exceeded retries, rethrow
          if (!(innerError.code === '409' || innerError.message?.includes('Conflict')) || retryCount >= maxRetries) {
            throw innerError;
          }
          retryCount++;
        }
      }
      
      // If we get here, we've exceeded retries
      throw new Error(`Failed to update category after ${maxRetries} retries due to conflicts`);
    } catch (error) {
      const serviceError = this.processError(error, 'category.update_error');
      this.emit('error', serviceError);
      return { data: null, error: serviceError };
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<{ error: ServiceError | null }> {
    try {
      await this.ensureAuthenticated();
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Emit events
      this.emit('category-deleted', id);
      this.emit('categories-changed');
      
      return { error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'category.delete_error');
      this.emit('error', serviceError);
      return { error: serviceError };
    }
  }

  /**
   * Get all default categories for the current user
   */
  async getDefaultCategories(): Promise<{ data: Category[] | null; error: ServiceError | null }> {
    try {
      const userId = await this.ensureAuthenticated();
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .order('name');
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'category.fetch_defaults_error');
      this.emit('error', serviceError);
      return { data: null, error: serviceError };
    }
  }

  /**
   * Set a category as default
   */
  async setDefaultCategory(id: string): Promise<{ error: ServiceError | null }> {
    try {
      await this.ensureAuthenticated();
      
      // Update the category
      const { data, error } = await supabase
        .from('categories')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Emit events
      this.emit('category-updated', data as Category);
      this.emit('categories-changed');
      
      return { error: null };
    } catch (error) {
      const serviceError = this.processError(error, 'category.set_default_error');
      this.emit('error', serviceError);
      return { error: serviceError };
    }
  }
}

// Create and export singleton instance
export const categoryService = new CategoryService();
