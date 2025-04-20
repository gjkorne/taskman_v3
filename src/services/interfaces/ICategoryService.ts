import { IService } from './IService';
import { ServiceError } from '../BaseService';

/**
 * Represents a category in the database
 */
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

/**
 * Input data for creating or updating a category
 */
export interface CategoryInput {
  name: string;
  color?: string;
  icon?: string;
  subcategories?: string[];
  is_default?: boolean;
}

/**
 * Events that can be emitted by the CategoryService
 */
export interface CategoryServiceEvents {
  'category-created': Category;
  'category-updated': Category;
  'category-deleted': string;
  'categories-changed': void;
  'categories-loaded': Category[];
  error: ServiceError;
}

/**
 * Interface for the CategoryService
 * Provides methods to manage task categories
 */
export interface ICategoryService extends IService<CategoryServiceEvents> {
  /**
   * Get all categories for the current user
   */
  getCategories(): Promise<{
    data: Category[] | null;
    error: ServiceError | null;
  }>;

  /**
   * Get a specific category by ID
   */
  getCategoryById(
    id: string
  ): Promise<{ data: Category | null; error: ServiceError | null }>;

  /**
   * Create a new category
   */
  createCategory(
    categoryData: CategoryInput
  ): Promise<{ data: Category | null; error: ServiceError | null }>;

  /**
   * Update an existing category
   */
  updateCategory(
    id: string,
    categoryData: Partial<CategoryInput>
  ): Promise<{ data: Category | null; error: ServiceError | null }>;

  /**
   * Delete a category
   */
  deleteCategory(id: string): Promise<{ error: ServiceError | null }>;

  /**
   * Get the default categories for the current user
   */
  getDefaultCategories(): Promise<{
    data: Category[] | null;
    error: ServiceError | null;
  }>;

  /**
   * Set a category as default
   */
  setDefaultCategory(id: string): Promise<{ error: ServiceError | null }>;
}
