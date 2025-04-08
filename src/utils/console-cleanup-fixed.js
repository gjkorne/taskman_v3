// Copy and paste this entire script into your browser console

async function checkAndCleanupCategories() {
  console.log('Starting category check and cleanup process...');
  
  try {
    // First, we need to get access to the Supabase client
    // It's likely stored in a React context or a module
    // Let's try to find it
    
    // Method 1: Try to access it from the window.__SUPABASE_CLIENT__ (if you've exposed it)
    let supabase = window.__SUPABASE_CLIENT__;
    
    // Method 2: Try to find it in React's __REACT_DEVTOOLS_GLOBAL_HOOK__
    if (!supabase && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('Searching for Supabase client in React components...');
      // This is a complex approach and might not work in all cases
    }
    
    // Method 3: Import it directly from your lib/supabase.js file
    if (!supabase) {
      console.log('Using direct import method to get Supabase client');
      // We can't import directly in the console, so let's use a different approach
      
      // Create a temporary script element to load the Supabase client
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      document.head.appendChild(script);
      
      // Wait for the script to load
      await new Promise(resolve => {
        script.onload = resolve;
      });
      
      // Now create a new Supabase client
      // You'll need to provide your Supabase URL and anon key
      const supabaseUrl = prompt('Enter your Supabase URL (e.g., https://yourproject.supabase.co):');
      const supabaseKey = prompt('Enter your Supabase anon key:');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and key are required');
      }
      
      supabase = supabase.createClient(supabaseUrl, supabaseKey);
    }
    
    if (!supabase) {
      throw new Error('Could not find or create Supabase client');
    }
    
    console.log('Successfully obtained Supabase client');
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      return { success: false, message: 'Not authenticated' };
    }
    
    const userId = session.user.id;
    console.log('Authenticated as user:', userId);
    
    // Get all categories for this user
    const { data: categories, error: fetchError } = await supabase
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
