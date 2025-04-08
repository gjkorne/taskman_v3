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
 * Will also handle conflicts by renaming legacy categories
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
    const categoriesToCreate = [...RECOMMENDED_CATEGORIES];
    
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
        // or if it's already a default category, we'll rename it
        if (category.name !== categoriesToCreate[matchIndex].name || category.is_default) {
          // Remove the need to create this one since it exists but will be renamed
          categoriesToCreate.splice(matchIndex, 1);
        }
      }
    });
    
    // Rename conflicting categories with z_$ prefix
    for (const category of conflictingCategories) {
      const updatedCategory = await categoryService.updateCategory(category.id, {
        name: `z_${category.name}`,
        color: category.color || '#9CA3AF' // Ensure there's always a color
      });
      
      // Hide this z_ prefixed category by default
      if (updatedCategory.data && updatedCategory.data.id) {
        if (!hiddenCategories.includes(updatedCategory.data.id)) {
          hiddenCategories.push(updatedCategory.data.id);
        }
      }
    }
    
    // Also hide any existing z_ categories
    existingCategories.forEach(category => {
      if (category.name.startsWith('z_') && !hiddenCategories.includes(category.id)) {
        hiddenCategories.push(category.id);
      }
    });
    
    // Update settings to hide z_ categories
    await userPreferencesService.setPreference('hiddenCategories', hiddenCategories);
    
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
