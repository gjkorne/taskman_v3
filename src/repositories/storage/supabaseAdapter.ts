import { supabase } from '../../lib/supabase';
import { IStorageAdapter } from '../types';

/**
 * Check if the current user has an admin role
 */
async function isUserAdmin(): Promise<boolean> {
  try {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session?.user) return false;

    const { data, error } = await supabase
      .from('user_role_assignments')
      .select('user_roles(name)')
      .eq('user_id', authData.session.user.id)
      .single();

    if (error || !data) return false;

    return data.user_roles?.name === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * A generic Supabase storage adapter that can be used with any table
 */
export class SupabaseAdapter<T extends { id: string }>
  implements IStorageAdapter<T>
{
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
      // Check authentication status
      const { data: authData } = await supabase.auth.getSession();

      // If not authenticated and this table requires auth, return empty results
      if (!authData.session) {
        // Log at debug level instead of warning to avoid console noise
        if (isDevelopment()) {
          console.debug(
            `SupabaseAdapter: No authenticated session for ${this.tableName} access, returning empty results`
          );
        }
        return [];
      }

      let query = supabase
        .from(this.tableName)
        .select(this.options.select || '*');

      // Apply user filter for tasks table to ensure users only see their own tasks
      // Skip filtering for admin users who should see all tasks
      if (this.tableName === 'tasks' && authData.session?.user) {
        // Check if user is admin
        const isAdmin = await isUserAdmin();

        // Only filter by user if not an admin
        if (!isAdmin) {
          query = query.eq('created_by', authData.session.user.id);
        }
      }

      // Apply default ordering if specified
      if (this.options.orderBy) {
        query = query.order(this.options.orderBy.column, {
          ascending: this.options.orderBy.ascending,
        });
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          `SupabaseAdapter.getAll: Query error for ${this.tableName}:`,
          error
        );
        throw error;
      }

      if (isDevelopment()) {
        console.debug(
          `SupabaseAdapter.getAll: Successfully fetched from ${this.tableName}:`,
          data ? data.length : 0,
          'items'
        );
      }

      // Transform rows if transformer is provided
      if (this.options.transformRow && data) {
        return data.map(this.options.transformRow);
      }

      return data as T[];
    } catch (error) {
      console.error(
        `SupabaseAdapter.getAll: Error fetching all from ${this.tableName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      // Check authentication status
      const { data: authData } = await supabase.auth.getSession();

      // If not authenticated and this table requires auth, return null
      if (!authData.session) {
        if (isDevelopment()) {
          console.debug(
            `SupabaseAdapter: No authenticated session for ${this.tableName} access, returning null for ID ${id}`
          );
        }
        return null;
      }

      let query = supabase
        .from(this.tableName)
        .select(this.options.select || '*')
        .eq('id', id);

      // Apply user filter for tasks table to ensure users only see their own tasks
      // Skip filtering for admin users who should see all tasks
      if (this.tableName === 'tasks' && authData.session?.user) {
        // Check if user is admin
        const isAdmin = await isUserAdmin();

        // Only filter by user if not an admin
        if (!isAdmin) {
          query = query.eq('created_by', authData.session.user.id);
        }
      }

      const { data, error } = await query.single();

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
   * Create a new item
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      // Check authentication status
      const { data: authData } = await supabase.auth.getSession();

      // If not authenticated, throw error as creation requires auth
      if (!authData.session) {
        throw new Error('Authentication required to create data');
      }

      // Prepare data for insertion if a transformer is provided
      const preparedData = this.options.prepareData
        ? this.options.prepareData(data)
        : data;

      const { data: created, error } = await supabase
        .from(this.tableName)
        .insert(preparedData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Transform row if transformer is provided
      if (this.options.transformRow) {
        return this.options.transformRow(created);
      }

      return created as T;
    } catch (error) {
      console.error(
        `SupabaseAdapter.create: Error creating in ${this.tableName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Update an existing item
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      // Check authentication status
      const { data: authData } = await supabase.auth.getSession();

      // If not authenticated, throw error as updates require auth
      if (!authData.session) {
        throw new Error('Authentication required to update data');
      }

      // Prepare data for update if a transformer is provided
      const preparedData = this.options.prepareData
        ? this.options.prepareData(data)
        : data;

      let query = supabase
        .from(this.tableName)
        .update(preparedData)
        .eq('id', id);

      // For tasks, ensure users can only update their own tasks unless they are admins
      if (this.tableName === 'tasks' && authData.session?.user) {
        // Check if user is admin
        const isAdmin = await isUserAdmin();

        // Only filter by user if not an admin
        if (!isAdmin) {
          query = query.eq('created_by', authData.session.user.id);
        }
      }

      const { data: updated, error } = await query.select().single();

      if (error) {
        throw error;
      }

      if (!updated) {
        throw new Error(
          `Record with ID ${id} not found or you don't have permission to update it`
        );
      }

      // Transform row if transformer is provided
      if (this.options.transformRow) {
        return this.options.transformRow(updated);
      }

      return updated as T;
    } catch (error) {
      console.error(
        `SupabaseAdapter.update: Error updating in ${this.tableName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete an item
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Check authentication status
      const { data: authData } = await supabase.auth.getSession();

      // If not authenticated, throw error as deletion requires auth
      if (!authData.session) {
        throw new Error('Authentication required to delete data');
      }

      let query = supabase.from(this.tableName).delete();

      // Apply id filter
      query = query.eq('id', id);

      // For tasks, ensure users can only delete their own tasks unless they are admins
      if (this.tableName === 'tasks' && authData.session?.user) {
        // Check if user is admin
        const isAdmin = await isUserAdmin();

        // Only filter by user if not an admin
        if (!isAdmin) {
          query = query.eq('created_by', authData.session.user.id);
        }
      }

      const { error } = await query;

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

// Helper function to check if running in development mode
function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}
