import { categoryService } from '../services/api/categoryService';
import { Category } from '../services/interfaces/ICategoryService';
import { userPreferencesService } from '../services/userPreferencesService';

// Define our new recommended categories with consistent colors
export const RECOMMENDED_CATEGORIES = [
  {
    name: 'Personal',
    color: '#3B82F6', // Blue
    isDefault: true   // This will be our default category
  },
  {
    name: 'Family',
    color: '#10B981', // Green
    isDefault: false
  },
  {
    name: 'Work',
    color: '#F59E0B', // Amber
    isDefault: false
  }
];

/**
 * Initialize the recommended categories if they don't exist
 * Will also handle conflicts by merging legacy categories
 */
export async function initializeRecommendedCategories(): Promise<void> {
  try {
    // Get existing categories
    const { data: existingCategories } = await categoryService.getCategories();
    if (!existingCategories) return;

    // Get current settings to update hidden categories
    const preferences = await userPreferencesService.getUserPreferences();
    let hiddenCategories = [...(preferences.hiddenCategories || [])];

    // Track which recommended categories we need to create
    let categoriesToCreate = [...RECOMMENDED_CATEGORIES];
    
    // Check for name conflicts and handle legacy categories
    const conflictingCategories: Category[] = [];
    
    // Find conflicts (case-insensitive)
    existingCategories.forEach(category => {
      const matchIndex = categoriesToCreate.findIndex(
        rec => rec.name.toLowerCase() === category.name.toLowerCase()
      );
      
      if (matchIndex !== -1) {
        // We found a conflict
        conflictingCategories.push(category);
        
        // If the existing category has the same name but in a different case,
        // or if it's already a default category, we'll merge it
        if (category.name !== categoriesToCreate[matchIndex].name || category.is_default) {
          // Remove the need to create this one since it exists but will be merged
          categoriesToCreate = categoriesToCreate.filter(
            c => c.name.toLowerCase() !== category.name.toLowerCase()
          );
        }
      }
    });
    
    // Handle conflicting categories by merging them instead of renaming
    for (const category of conflictingCategories) {
      // Find the recommended category that conflicts with this one
      const recommendedMatch = RECOMMENDED_CATEGORIES.find(
        rec => rec.name.toLowerCase() === category.name.toLowerCase()
      );
      
      if (recommendedMatch) {
        console.log(`Merging conflicting category: ${category.name}`);
        
        // Update the existing category with the recommended color if needed
        if (!category.color || category.color === '#9CA3AF') {
          await categoryService.updateCategory(category.id, {
            color: recommendedMatch.color
          });
        }
        
        // Skip creating this recommended category since we're keeping the existing one
        categoriesToCreate = categoriesToCreate.filter(
          c => c.name.toLowerCase() !== category.name.toLowerCase()
        );
      }
    }
    
    // Remove any existing z_ categories from the hidden list
    const cleanedHiddenCategories = hiddenCategories.filter(id => {
      const category = existingCategories.find(c => c.id === id);
      return !(category && category.name.startsWith('z_'));
    });
    
    // Update settings with cleaned hidden categories
    if (cleanedHiddenCategories.length !== hiddenCategories.length) {
      await userPreferencesService.setPreference('hiddenCategories', cleanedHiddenCategories);
      hiddenCategories = cleanedHiddenCategories;
    }
    
    // Create the recommended categories that don't exist yet
    for (const category of categoriesToCreate) {
      // Use unique colors
      const { data: newCategory } = await categoryService.createCategory({
        name: category.name,
        color: category.color
      });
      
      // If this is our designated default and it was newly created, make it the default
      if (category.isDefault && newCategory) {
        await categoryService.setDefaultCategory(newCategory.id);
      }
    }
    
    // If Personal exists but isn't the default, make it the default
    if (!categoriesToCreate.some(c => c.name === 'Personal' && c.isDefault)) {
      const personalCategory = existingCategories.find(
        c => c.name === 'Personal'
      );
      
      if (personalCategory && !personalCategory.is_default) {
        await categoryService.setDefaultCategory(personalCategory.id);
      }
    }
    
  } catch (error) {
    console.error("Failed to initialize recommended categories:", error);
  }
}

/**
 * Get a unique color that isn't already used by existing categories
 */
export function getUniqueColor(existingCategories: Category[]): string {
  // Define a set of preset colors
  const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#A855F7', // Violet
    '#D946EF', // Fuchsia
    '#06B6D4'  // Cyan
  ];
  
  // Get currently used colors
  const usedColors = existingCategories
    .map(cat => cat.color || '') // Convert null to empty string
    .filter(color => color !== ''); // Filter out empty strings
  
  // Find unused colors
  const availableColors = presetColors.filter(
    color => !usedColors.includes(color)
  );
  
  if (availableColors.length > 0) {
    // Return a random available color
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  } else {
    // All colors are used, generate a random HSL color
    // This creates a color with good saturation and lightness
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
  }
}
