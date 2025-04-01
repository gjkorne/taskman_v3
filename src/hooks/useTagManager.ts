import { useState, useCallback } from 'react';

const SUBCATEGORY_PREFIX = 'subcategory:';

export interface TagManagerOptions {
  initialTags?: string[];
  onChange?: (tags: string[]) => void;
}

export function useTagManager({ initialTags = [], onChange }: TagManagerOptions = {}) {
  const [tags, setTags] = useState<string[]>(initialTags);

  /**
   * Get the subcategory value from an array of tags
   */
  const getSubcategoryFromTags = useCallback((tagList: string[]): string | null => {
    const subcategoryTag = tagList.find(tag => tag.startsWith(SUBCATEGORY_PREFIX));
    return subcategoryTag ? subcategoryTag.replace(SUBCATEGORY_PREFIX, '') : null;
  }, []);

  /**
   * Update or add a subcategory tag in a tag array
   */
  const updateSubcategoryInTags = useCallback((tagList: string[], subcategory: string): string[] => {
    // Remove any existing subcategory tags
    const filteredTags = tagList.filter(tag => !tag.startsWith(SUBCATEGORY_PREFIX));
    
    // Only add a new subcategory tag if one is provided
    if (subcategory && subcategory.trim()) {
      return [...filteredTags, `${SUBCATEGORY_PREFIX}${subcategory.trim()}`];
    }
    
    return filteredTags;
  }, []);

  /**
   * Add a new tag to the collection
   */
  const addTag = useCallback((tag: string) => {
    if (!tag || tag.trim() === '') return;
    
    const normalizedTag = tag.trim().toLowerCase();
    
    setTags(prevTags => {
      // Avoid duplicates
      if (prevTags.includes(normalizedTag)) return prevTags;
      
      const newTags = [...prevTags, normalizedTag];
      onChange?.(newTags);
      return newTags;
    });
  }, [onChange]);

  /**
   * Remove a tag from the collection
   */
  const removeTag = useCallback((tagToRemove: string) => {
    setTags(prevTags => {
      const newTags = prevTags.filter(tag => tag !== tagToRemove);
      onChange?.(newTags);
      return newTags;
    });
  }, [onChange]);

  /**
   * Check if a tag exists in the collection
   */
  const hasTag = useCallback((tag: string): boolean => {
    return tags.includes(tag.trim().toLowerCase());
  }, [tags]);

  /**
   * Set subcategory, handling the tag formatting automatically
   */
  const setSubcategory = useCallback((subcategory: string) => {
    setTags(prevTags => {
      const newTags = updateSubcategoryInTags(prevTags, subcategory);
      onChange?.(newTags);
      return newTags;
    });
  }, [updateSubcategoryInTags, onChange]);

  /**
   * Get the current subcategory
   */
  const getSubcategory = useCallback((): string => {
    return getSubcategoryFromTags(tags) || '';
  }, [tags, getSubcategoryFromTags]);

  /**
   * Reset all tags
   */
  const resetTags = useCallback((newTags: string[] = []) => {
    setTags(newTags);
    onChange?.(newTags);
  }, [onChange]);

  return {
    // State
    tags,
    
    // Basic tag operations
    addTag,
    removeTag,
    hasTag,
    resetTags,
    
    // Subcategory operations
    getSubcategory,
    setSubcategory,
    
    // Utility functions that can be used independently 
    getSubcategoryFromTags,
    updateSubcategoryInTags
  };
}
