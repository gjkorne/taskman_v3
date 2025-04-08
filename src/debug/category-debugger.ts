import { supabase } from '../lib/supabase';

/**
 * Utility to debug category conflicts in Supabase
 * This will look up categories by ID and print their details
 */
export async function debugCategoryById(categoryId: string) {
  console.log(`Debugging category with ID: ${categoryId}`);
  
  try {
    // Get the category from Supabase
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();
    
    if (error) {
      console.error('Error fetching category:', error);
      return null;
    }
    
    if (!data) {
      console.log(`No category found with ID: ${categoryId}`);
      return null;
    }
    
    console.log('Category details:');
    console.table(data);
    return data;
  } catch (err) {
    console.error('Exception while debugging category:', err);
    return null;
  }
}

/**
 * Utility to debug all categories for the current user
 */
export async function debugAllCategories() {
  console.log('Fetching all categories for debugging...');
  
  try {
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('No active session found');
      return null;
    }
    
    const userId = session.user.id;
    
    // Get all categories for this user
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching categories:', error);
      return null;
    }
    
    console.log(`Found ${data.length} categories for user ${userId}`);
    console.table(data);
    
    // Specifically check for the problematic IDs
    const problemIds = [
      'ae7dfdd0-a58c-44ca-b46b-858d6b36eae4',
      '72cd8626-b3a2-47a0-a6f4-8204d1522027',
      '04dc54bd-d2fc-4fb7-9c08-10f92686e55b'
    ];
    
    console.log('Checking for specific problem categories:');
    for (const id of problemIds) {
      const category = data.find(c => c.id === id);
      if (category) {
        console.log(`Problem category found: ${id} - ${category.name}`);
      } else {
        console.log(`Problem category not found in user data: ${id}`);
      }
    }
    
    return data;
  } catch (err) {
    console.error('Exception while debugging categories:', err);
    return null;
  }
}

// Export a simple function to run from the console
(window as any).debugCategories = {
  byId: debugCategoryById,
  all: debugAllCategories
};

console.log('Category debugger loaded. Use window.debugCategories.byId("id") or window.debugCategories.all() in the console.');
