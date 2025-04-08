import { supabase } from '../lib/supabase';

// Define interfaces for our data structures
interface Category {
  id: string;
  name: string;
  user_id: string;
  color?: string;
  [key: string]: any;
}

interface DuplicateCategory {
  name: string;
  id: string;
  otherCategoryId: string;
  otherCategoryName: string;
}

interface ConstraintCheckResult {
  success: boolean;
  message?: string;
  categories?: Category[];
  duplicateNames?: DuplicateCategory[];
  categoriesWithoutNames?: Category[];
}

/**
 * Utility to check for unique constraints on the categories table
 * This will help identify what might be causing 409 Conflict errors
 */
export async function checkCategoryConstraints(): Promise<ConstraintCheckResult> {
  console.log('Checking category table constraints...');
  
  try {
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
    
    // Check for duplicate names (case insensitive)
    const nameMap = new Map<string, Category>();
    const duplicateNames: DuplicateCategory[] = [];
    
    categories.forEach((cat: Category) => {
      const lowerName = cat.name.toLowerCase();
      if (nameMap.has(lowerName)) {
        duplicateNames.push({
          name: cat.name,
          id: cat.id,
          otherCategoryId: nameMap.get(lowerName)!.id,
          otherCategoryName: nameMap.get(lowerName)!.name
        });
      } else {
        nameMap.set(lowerName, cat);
      }
    });
    
    if (duplicateNames.length > 0) {
      console.log('Found duplicate category names (case insensitive):');
      duplicateNames.forEach(dup => {
        console.log(`- "${dup.name}" (${dup.id}) conflicts with "${dup.otherCategoryName}" (${dup.otherCategoryId})`);
      });
    } else {
      console.log('No duplicate category names found');
    }
    
    // Check for any other potential issues
    const categoriesWithoutNames = categories.filter((cat: Category) => !cat.name || cat.name.trim() === '');
    if (categoriesWithoutNames.length > 0) {
      console.log('Found categories without names:');
      categoriesWithoutNames.forEach(cat => {
        console.log(`- Category ID: ${cat.id}`);
      });
    }
    
    return {
      success: true,
      categories,
      duplicateNames,
      categoriesWithoutNames
    };
  } catch (err) {
    console.error('Exception during category constraint check:', err);
    return { success: false, message: 'Exception during check' };
  }
}

/**
 * Fix duplicate categories by renaming or merging them
 */
export async function fixDuplicateCategories(): Promise<{success: boolean, message: string}> {
  console.log('Starting duplicate category fix process...');
  
  try {
    const checkResult = await checkCategoryConstraints();
    if (!checkResult.success) {
      return checkResult;
    }
    
    const { duplicateNames } = checkResult;
    
    if (!duplicateNames || duplicateNames.length === 0) {
      console.log('No duplicate categories to fix');
      return { success: true, message: 'No duplicates to fix' };
    }
    
    console.log(`Found ${duplicateNames.length} duplicate categories to fix`);
    
    // Process each duplicate
    for (const dup of duplicateNames) {
      console.log(`Processing duplicate: "${dup.name}" (${dup.id}) conflicts with "${dup.otherCategoryName}" (${dup.otherCategoryId})`);
      
      // Option 1: Rename the duplicate
      const newName = `${dup.name}_${dup.id.substring(0, 4)}`;
      console.log(`Renaming "${dup.name}" to "${newName}"`);
      
      const { error: updateError } = await supabase
        .from('categories')
        .update({ name: newName })
        .eq('id', dup.id);
      
      if (updateError) {
        console.error(`Error renaming category ${dup.id}:`, updateError);
      } else {
        console.log(`Successfully renamed category ${dup.id} to "${newName}"`);
      }
    }
    
    return { 
      success: true, 
      message: `Fixed ${duplicateNames.length} duplicate categories` 
    };
  } catch (err) {
    console.error('Exception during category fix:', err);
    return { success: false, message: 'Exception during fix' };
  }
}

// Make the functions available globally
(window as any).checkCategoryConstraints = checkCategoryConstraints;
(window as any).fixDuplicateCategories = fixDuplicateCategories;

console.log('Category constraint checker loaded. Use window.checkCategoryConstraints() to check for issues or window.fixDuplicateCategories() to fix duplicates.');
