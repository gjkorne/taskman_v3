// Category cleanup script
// Run with: node scripts/cleanup-categories.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Prompt for email and password
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

async function signIn() {
  return new Promise((resolve) => {
    readline.question('Enter your email: ', (email) => {
      readline.question('Enter your password: ', async (password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (error) {
            console.error('Authentication error:', error.message);
            process.exit(1);
          }
          
          console.log('Successfully signed in as', email);
          resolve(data.user.id);
        } catch (err) {
          console.error('Error during authentication:', err);
          process.exit(1);
        }
      });
    });
  });
}

async function checkDuplicateCategories(userId) {
  console.log('Checking for duplicate categories...');
  
  try {
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
      console.log('No z_ prefixed categories found, no duplicates detected');
      return { success: true, message: 'No duplicates found' };
    }
    
    console.log(`Found ${zPrefixedCategories.length} potential duplicate categories:`);
    
    // Check each z_ category
    for (const zCat of zPrefixedCategories) {
      // Find the corresponding non-z_ category
      const normalName = zCat.name.substring(2); // Remove the z_ prefix
      const normalCat = categories.find(cat => cat.name === normalName);
      
      if (!normalCat) {
        console.log(`- ${zCat.name} (no matching non-prefixed category found)`);
      } else {
        console.log(`- ${zCat.name} -> matches with -> ${normalCat.name}`);
        
        // Count tasks using this category
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id')
          .eq('category_id', zCat.id);
        
        if (tasksError) {
          console.error(`  Error counting tasks for ${zCat.name}:`, tasksError);
        } else {
          console.log(`  Tasks using ${zCat.name}: ${tasks?.length || 0}`);
        }
      }
    }
    
    return { 
      success: true, 
      duplicates: zPrefixedCategories,
      message: `Found ${zPrefixedCategories.length} potential duplicate categories` 
    };
  } catch (err) {
    console.error('Exception during category check:', err);
    return { success: false, message: 'Exception during check' };
  }
}

async function cleanupDuplicateCategories(userId) {
  console.log('Starting category cleanup process...');
  
  try {
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

async function main() {
  try {
    const userId = await signIn();
    
    // First check for duplicates
    await checkDuplicateCategories(userId);
    
    // Ask if the user wants to proceed with cleanup
    readline.question('Do you want to proceed with cleanup? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        const result = await cleanupDuplicateCategories(userId);
        console.log('Cleanup result:', result);
      } else {
        console.log('Cleanup cancelled');
      }
      
      readline.close();
      process.exit(0);
    });
  } catch (err) {
    console.error('Error:', err);
    readline.close();
    process.exit(1);
  }
}

main();
