import { supabase } from '../../lib/supabase';

// Define a Category type for database interactions
export interface Category {
  id: string;
  name: string;
  user_id: string;
  color: string | null;
  icon: string | null;
  subcategories: string[] | null;
  is_default: boolean;
  created_at: string;
  updated_at: string | null;
}

// Define a CategoryInput type for creating/updating categories
export interface CategoryInput {
  name: string;
  color?: string;
  icon?: string;
  subcategories?: string[];
  is_default?: boolean;
}

// Interface for the Category service
export interface ICategoryService {
  // Category CRUD operations
  getCategories(): Promise<{ data: Category[] | null; error: Error | null }>;
  getCategoryById(id: string): Promise<{ data: Category | null; error: Error | null }>;
  createCategory(categoryData: CategoryInput): Promise<{ data: Category | null; error: Error | null }>;
  updateCategory(id: string, categoryData: Partial<CategoryInput>): Promise<{ data: Category | null; error: Error | null }>;
  deleteCategory(id: string): Promise<{ error: Error | null }>;
  
  // Special operations
  getDefaultCategories(): Promise<{ data: Category[] | null; error: Error | null }>;
  setDefaultCategory(id: string): Promise<{ error: Error | null }>;
}

// Implementation of the Category service using Supabase
export class CategoryService implements ICategoryService {
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
  async getCategories(): Promise<{ data: Category[] | null; error: Error | null }> {
    try {
      const userId = await this.ensureAuthenticated();
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get a specific category by ID
   */
  async getCategoryById(id: string): Promise<{ data: Category | null; error: Error | null }> {
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
      console.error('Error fetching category:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: CategoryInput): Promise<{ data: Category | null; error: Error | null }> {
    try {
      const userId = await this.ensureAuthenticated();
      
      // Format data for database
      const formattedData = {
        name: categoryData.name,
        user_id: userId,
        color: categoryData.color || null,
        icon: categoryData.icon || null,
        subcategories: categoryData.subcategories || [],
        is_default: categoryData.is_default || false
      };
      
      // If this is the default category, unset any existing defaults
      if (formattedData.is_default) {
        await this.clearDefaultCategories();
      }
      
      const { data, error } = await supabase
        .from('categories')
        .insert([formattedData])
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating category:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, categoryData: Partial<CategoryInput>): Promise<{ data: Category | null; error: Error | null }> {
    try {
      await this.ensureAuthenticated();
      
      // If making this the default category, unset any existing defaults
      if (categoryData.is_default) {
        await this.clearDefaultCategories();
      }
      
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating category:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<{ error: Error | null }> {
    try {
      await this.ensureAuthenticated();
      
      // First check if this is a default category - can't delete default
      const { data: category } = await this.getCategoryById(id);
      if (category?.is_default) {
        throw new Error('Cannot delete a default category');
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { error: error as Error };
    }
  }

  /**
   * Clear all default categories for the current user
   * Used internally before setting a new default
   */
  private async clearDefaultCategories(): Promise<void> {
    try {
      const userId = await this.ensureAuthenticated();
      
      await supabase
        .from('categories')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
        
    } catch (error) {
      console.error('Error clearing default categories:', error);
      throw error;
    }
  }

  /**
   * Get the user's default categories
   */
  async getDefaultCategories(): Promise<{ data: Category[] | null; error: Error | null }> {
    try {
      const userId = await this.ensureAuthenticated();
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching default categories:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Set a category as the default
   */
  async setDefaultCategory(id: string): Promise<{ error: Error | null }> {
    try {
      await this.ensureAuthenticated();
      
      // First clear any existing default categories
      await this.clearDefaultCategories();
      
      // Then set this category as default
      const { error } = await supabase
        .from('categories')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error setting default category:', error);
      return { error: error as Error };
    }
  }
}

// Create and export singleton instance
export const categoryService = new CategoryService();
