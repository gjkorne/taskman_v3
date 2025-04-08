import { supabase } from '../lib/supabase';

// Expose the Supabase client to the window object for debugging purposes
(window as any).__SUPABASE_CLIENT__ = supabase;

console.log('Supabase client exposed to window.__SUPABASE_CLIENT__ for debugging');

/**
 * Utility to clean up duplicate categories that are causing conflicts
 */
export async function cleanupDuplicateCategories() {
  console.log('Starting category cleanup process...');
  
  try {
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      return { success: false, message: 'Not authenticated' };
    }
    
    const userId = session.user.id;
    
    // Get all categories for this user
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    
    if (fetchError) {
      console.error('Error fetching categories:', fetchError);
      return { success: false, message: 'Failed to fetch categories' };
    }
    
    // Find categories with z_ prefix
    const zPrefixedCategories = categories.filter(cat => cat.name.startsWith('z_'));
    
    if (zPrefixedCategories.length === 0) {
      console.log('No z_ prefixed categories found, nothing to clean up');
      return { success: true, message: 'No cleanup needed' };
    }
    
    console.log(`Found ${zPrefixedCategories.length} categories with z_ prefix`);
    
    // Process each z_ category
    for (const zCat of zPrefixedCategories) {
      // Find the corresponding non-z_ category
      const normalName = zCat.name.substring(2); // Remove the z_ prefix
      const normalCat = categories.find(cat => cat.name === normalName);
      
      if (!normalCat) {
        console.log(`No matching category found for ${zCat.name}, skipping`);
        continue;
      }
      
      console.log(`Processing duplicate: ${zCat.name} -> ${normalCat.name}`);
      
      // 1. Find tasks using the z_ category
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, category_id')
        .eq('category_id', zCat.id);
      
      if (tasksError) {
        console.error(`Error fetching tasks for category ${zCat.name}:`, tasksError);
        continue;
      }
      
      // 2. Update tasks to use the non-z_ category
      if (tasks && tasks.length > 0) {
        console.log(`Updating ${tasks.length} tasks from ${zCat.name} to ${normalCat.name}`);
        
        for (const task of tasks) {
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ category_id: normalCat.id })
            .eq('id', task.id);
          
          if (updateError) {
            console.error(`Error updating task ${task.id}:`, updateError);
          }
        }
      }
      
      // 3. Delete the z_ category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', zCat.id);
      
      if (deleteError) {
        console.error(`Error deleting category ${zCat.name}:`, deleteError);
      } else {
        console.log(`Successfully deleted category ${zCat.name}`);
      }
    }
    
    return { 
      success: true, 
      message: `Cleaned up ${zPrefixedCategories.length} duplicate categories` 
    };
  } catch (err) {
    console.error('Exception during category cleanup:', err);
    return { success: false, message: 'Exception during cleanup' };
  }
}

// Make the cleanup function available globally
(window as any).cleanupDuplicateCategories = cleanupDuplicateCategories;
