import { supabase } from '../lib/supabase';

/**
 * Force delete the z_ prefixed categories that are causing conflicts
 */
export async function forceDeleteZPrefixedCategories() {
  console.log('Starting force deletion of z_ prefixed categories...');
  
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
      console.log('No z_ prefixed categories found, nothing to delete');
      return { success: true, message: 'No categories to delete' };
    }
    
    console.log(`Found ${zPrefixedCategories.length} categories with z_ prefix to delete`);
    
    // First, update any tasks using these categories to use a default category
    // Find a non-z_ category to use as default
    const defaultCategory = categories.find(cat => !cat.name.startsWith('z_'));
    
    if (!defaultCategory) {
      console.error('No non-z_ category found to use as default');
      return { success: false, message: 'No default category available' };
    }
    
    console.log(`Using "${defaultCategory.name}" (${defaultCategory.id}) as default category for orphaned tasks`);
    
    // Process each z_ category
    for (const zCat of zPrefixedCategories) {
      console.log(`Processing category: ${zCat.name} (${zCat.id})`);
      
      // 1. Find tasks using the z_ category
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, category_id')
        .eq('category_id', zCat.id);
      
      if (tasksError) {
        console.error(`Error fetching tasks for category ${zCat.name}:`, tasksError);
        continue;
      }
      
      // 2. Update tasks to use the default category
      if (tasks && tasks.length > 0) {
        console.log(`Updating ${tasks.length} tasks from ${zCat.name} to ${defaultCategory.name}`);
        
        for (const task of tasks) {
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ category_id: defaultCategory.id })
            .eq('id', task.id);
          
          if (updateError) {
            console.error(`Error updating task ${task.id}:`, updateError);
          }
        }
      }
      
      // 3. Delete the z_ category using a direct DELETE query
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', zCat.id);
      
      if (deleteError) {
        console.error(`Error deleting category ${zCat.name}:`, deleteError);
        console.log('Trying alternative deletion approach...');
        
        // Try an alternative approach - update the name first to avoid conflicts
        const tempName = `to_delete_${Math.random().toString(36).substring(2, 10)}`;
        
        const { error: renameError } = await supabase
          .from('categories')
          .update({ name: tempName })
          .eq('id', zCat.id);
        
        if (renameError) {
          console.error(`Error renaming category ${zCat.id}:`, renameError);
        } else {
          console.log(`Successfully renamed category to ${tempName}, now trying to delete`);
          
          // Try deleting again
          const { error: secondDeleteError } = await supabase
            .from('categories')
            .delete()
            .eq('id', zCat.id);
          
          if (secondDeleteError) {
            console.error(`Error in second attempt to delete category ${zCat.id}:`, secondDeleteError);
          } else {
            console.log(`Successfully deleted category ${zCat.id} on second attempt`);
          }
        }
      } else {
        console.log(`Successfully deleted category ${zCat.name}`);
      }
    }
    
    return { 
      success: true, 
      message: `Processed ${zPrefixedCategories.length} z_ prefixed categories` 
    };
  } catch (err) {
    console.error('Exception during category deletion:', err);
    return { success: false, message: 'Exception during deletion' };
  }
}

// Make the function available globally
(window as any).forceDeleteZPrefixedCategories = forceDeleteZPrefixedCategories;

console.log('Force delete utility loaded. Use window.forceDeleteZPrefixedCategories() to delete z_ prefixed categories.');
