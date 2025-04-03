import { supabase } from '../../lib/supabase';
import { IStorageAdapter } from '../types';

/**
 * A generic Supabase storage adapter that can be used with any table
 */
export class SupabaseAdapter<T extends { id: string }> implements IStorageAdapter<T> {
  constructor(
    private tableName: string,
    private options: {
      /**
       * Optional select query to specify columns to return
       */
      select?: string;
      
      /**
       * Optional default sort order
       */
      orderBy?: { column: string; ascending: boolean };
      
      /**
       * Optional transformer to convert database rows to domain model
       */
      transformRow?: (row: any) => T;
      
      /**
       * Optional transformer to prepare data for insertion/update
       */
      prepareData?: (data: Partial<T>) => Record<string, any>;
    } = {}
  ) {}

  /**
   * Get all items from the table
   */
  async getAll(): Promise<T[]> {
    try {
      console.log(`SupabaseAdapter.getAll: Fetching from ${this.tableName} table`);
      
      // Check authentication status
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('SupabaseAdapter: Authentication error:', authError);
        throw authError;
      }
      
      if (!authData.session) {
        console.warn('SupabaseAdapter: No authenticated session found');
      } else {
        console.log('SupabaseAdapter: Authenticated as user:', authData.session.user.id);
      }
      
      let query = supabase.from(this.tableName).select(this.options.select || '*');
      
      // Apply default ordering if specified
      if (this.options.orderBy) {
        query = query.order(this.options.orderBy.column, { 
          ascending: this.options.orderBy.ascending 
        });
      }
      
      console.log(`SupabaseAdapter.getAll: Executing query on ${this.tableName}`);
      const { data, error } = await query;
      
      if (error) {
        console.error(`SupabaseAdapter.getAll: Query error for ${this.tableName}:`, error);
        throw error;
      }
      
      console.log(`SupabaseAdapter.getAll: Successfully fetched from ${this.tableName}:`, data ? data.length : 0, 'items');
      
      // Transform rows if transformer is provided
      if (this.options.transformRow && data) {
        return data.map(this.options.transformRow);
      }
      
      return data as T[];
    } catch (error) {
      console.error(`SupabaseAdapter.getAll: Error fetching all from ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(this.options.select || '*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found
          return null;
        }
        throw error;
      }
      
      // Transform row if transformer is provided
      if (this.options.transformRow && data) {
        return this.options.transformRow(data);
      }
      
      return data as T;
    } catch (error) {
      console.error(`Error fetching ${this.tableName} by ID:`, error);
      throw error;
    }
  }

  /**
   * Create new item
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      // Prepare data for insertion if prepareData is provided
      const preparedData = this.options.prepareData 
        ? this.options.prepareData(data) 
        : data;
      
      const { data: created, error } = await supabase
        .from(this.tableName)
        .insert(preparedData)
        .select(this.options.select || '*')
        .single();
      
      if (error) throw error;
      
      // Transform row if transformer is provided
      if (this.options.transformRow && created) {
        return this.options.transformRow(created);
      }
      
      return created as T;
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update existing item
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      // Prepare data for update if prepareData is provided
      const preparedData = this.options.prepareData 
        ? this.options.prepareData(data) 
        : data;
      
      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update(preparedData)
        .eq('id', id)
        .select(this.options.select || '*')
        .single();
      
      if (error) throw error;
      
      // Transform row if transformer is provided
      if (this.options.transformRow && updated) {
        return this.options.transformRow(updated);
      }
      
      return updated as T;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete item by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Query items with a filter function
   * Note: This performs client-side filtering after fetching all data
   * For more efficient filtering, extend this class with custom methods
   * that use Supabase filters directly
   */
  async query(filter: (item: T) => boolean): Promise<T[]> {
    try {
      const items = await this.getAll();
      return items.filter(filter);
    } catch (error) {
      console.error(`Error querying ${this.tableName}:`, error);
      throw error;
    }
  }
}
