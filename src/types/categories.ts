/**
 * Category and subcategory definitions
 * These are used for UI organization but only the main category is saved in the database
 */
export const CATEGORIES = {
  childcare: [
    'Core Care',
    'Play & Engagement',
    'Learning & Schoolwork',
    'Routines',
    'Outings & Activities',
    'Admin',
  ],
  work: [
    'Core Execution',
    'Planning & Strategy',
    'Communication & Meetings',
    'Learning & Research',
    'Maintenance/Admin',
    'Projects & Deliverables',
  ],
  personal: [
    'Health & Wellness',
    'Relationships & Social',
    'Home & Chores',
    'Finance & Admin',
    'Growth & Learning',
    'Fun & Recreation',
  ],
  other: [
    'Core',
    'Unexpected/Interruptions',
    'Unsorted',
    'Overflow',
    'External Requests',
    'Reflections & Journaling',
  ],
} as const;

/**
 * Type for valid category keys
 */
export type CategoryKey = keyof typeof CATEGORIES;

/**
 * Get all available subcategories for a given category
 */
export function getSubcategoriesForCategory(
  category: CategoryKey | string
): string[] {
  if (category in CATEGORIES) {
    return [...CATEGORIES[category as CategoryKey]];
  }
  return [];
}

/**
 * Extract subcategory from tags
 */
export function getSubcategoryFromTags(tags: string[] | null): string | null {
  if (!tags || tags.length === 0) return null;

  const subcategoryTag = tags.find((tag) => tag.startsWith('subcategory:'));
  if (subcategoryTag) {
    return subcategoryTag.replace('subcategory:', '');
  }

  return null;
}

/**
 * Add or update subcategory in tags array
 */
export function updateSubcategoryInTags(
  tags: string[] | null,
  subcategory: string | null
): string[] {
  // Start with existing tags or empty array
  const newTags = [...(tags || [])];

  // Remove any existing subcategory tags
  const filteredTags = newTags.filter((tag) => !tag.startsWith('subcategory:'));

  // Add new subcategory if provided
  if (subcategory) {
    filteredTags.push(`subcategory:${subcategory}`);
  }

  return filteredTags;
}
