// Copy and paste this entire script into your browser console

async function checkAndCleanupCategories() {
  console.log('Starting category check and cleanup process...');
  
  try {
    // Get the current user's session
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      return { success: false, message: 'Not authenticated' };
    }
    
    const userId = session.user.id;
    console.log('Authenticated as user:', userId);
    
    // Get all categories for this user
    const { data: categories, error: fetchError } = await window.supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    
    if (fetchError) {
      console.error('Error fetching categories:', fetchError);
      return { success: false, message: 'Failed to fetch categories' };
    }
    
    console.log(`Found ${categories.length} total categories`);
    
    // Find categories with z_ prefix
    const zPrefixedCategories = categories.filter(cat => cat.name.startsWith('z_'));
    
    if (zPrefixedCategories.length === 0) {
      console.log('No z_ prefixed categories found, nothing to clean up');
      return { success: true, message: 'No cleanup needed' };
    }
    
    console.log(`Found ${zPrefixedCategories.length} categories with z_ prefix`);
    
    // Ask for confirmation
    const shouldProceed = confirm(`Found ${zPrefixedCategories.length} duplicate categories with z_ prefix. Do you want to clean them up?`);
    if (!shouldProceed) {
      console.log('Cleanup cancelled by user');
      return { success: false, message: 'Cleanup cancelled' };
    }
    
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
      const { data: tasks, error: tasksError } = await window.supabase
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
          const { error: updateError } = await window.supabase
            .from('tasks')
            .update({ category_id: normalCat.id })
            .eq('id', task.id);
          
          if (updateError) {
            console.error(`Error updating task ${task.id}:`, updateError);
          }
        }
      }
      
      // 3. Delete the z_ category
      const { error: deleteError } = await window.supabase
        .from('categories')
        .delete()
        .eq('id', zCat.id);
      
      if (deleteError) {
        console.error(`Error deleting category ${zCat.name}:`, deleteError);
      } else {
        console.log(`Successfully deleted category ${zCat.name}`);
      }
    }
    
    alert(`Successfully cleaned up ${zPrefixedCategories.length} duplicate categories!`);
    return { 
      success: true, 
      message: `Cleaned up ${zPrefixedCategories.length} duplicate categories` 
    };
  } catch (err) {
    console.error('Exception during category cleanup:', err);
    alert('Error during cleanup: ' + err.message);
    return { success: false, message: 'Exception during cleanup' };
  }
}

// Run the function immediately
checkAndCleanupCategories();
