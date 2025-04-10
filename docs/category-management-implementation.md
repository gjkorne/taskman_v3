# Category Management System: Implementation Guide

This document outlines the implementation approach for the Taskman category management system, focusing on the architecture, components, and data flow using the repository pattern.

## Implementation Phases

### Phase 1: Core Data Layer

#### Repository Interfaces

First, we define clear interfaces for our repositories:

```typescript
// src/repositories/interfaces/ICategoryRepository.ts
export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category | null>;
  create(category: CategoryInput): Promise<Category>;
  update(id: string, updates: Partial<CategoryInput>): Promise<Category>;
  delete(id: string): Promise<void>;
}

// src/repositories/interfaces/IUserPreferencesRepository.ts
export interface IUserPreferencesRepository {
  getUserPreferences(): Promise<UserPreferences>;
  updateUserPreferences(updates: Partial<UserPreferences>): Promise<UserPreferences>;
}
```

#### Repository Implementations

Then, we implement these interfaces with Supabase-specific implementations:

```typescript
// src/repositories/SupabaseCategoryRepository.ts
import { supabase } from '../lib/supabase';
import { ICategoryRepository } from './interfaces/ICategoryRepository';

export class SupabaseCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (error) throw new Error(`Error fetching categories: ${error.message}`);
    return data || [];
  }
  
  async getById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Error fetching category: ${error.message}`);
    }
    
    return data;
  }
  
  async create(category: CategoryInput): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();
      
    if (error) throw new Error(`Error creating category: ${error.message}`);
    return data;
  }
  
  async update(id: string, updates: Partial<CategoryInput>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw new Error(`Error updating category: ${error.message}`);
    return data;
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(`Error deleting category: ${error.message}`);
  }
}

// src/repositories/SupabaseUserPreferencesRepository.ts
import { supabase } from '../lib/supabase';
import { IUserPreferencesRepository } from './interfaces/IUserPreferencesRepository';

export class SupabaseUserPreferencesRepository implements IUserPreferencesRepository {
  async getUserPreferences(): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .single();
      
    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Error fetching user preferences: ${error.message}`);
    }
    
    // Return default preferences if none exist
    return data || {
      hidden_categories: [],
      quick_task_categories: [],
      default_quick_task_category: null
    };
  }
  
  async updateUserPreferences(updates: Partial<UserPreferences>): Promise<UserPreferences> {
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('*')
      .single();
      
    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .select()
        .single();
        
      if (error) throw new Error(`Error updating user preferences: ${error.message}`);
      return data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .insert(updates)
        .select()
        .single();
        
      if (error) throw new Error(`Error creating user preferences: ${error.message}`);
      return data;
    }
  }
}
```

#### Repository Provider

To make repositories available throughout the application, we create a provider:

```typescript
// src/providers/RepositoryProvider.tsx
import React, { createContext, useContext } from 'react';
import { ICategoryRepository } from '../repositories/interfaces/ICategoryRepository';
import { SupabaseCategoryRepository } from '../repositories/SupabaseCategoryRepository';
import { IUserPreferencesRepository } from '../repositories/interfaces/IUserPreferencesRepository';
import { SupabaseUserPreferencesRepository } from '../repositories/SupabaseUserPreferencesRepository';

interface RepositoryContextType {
  categoryRepository: ICategoryRepository;
  userPreferencesRepository: IUserPreferencesRepository;
}

const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Create repository instances
  const categoryRepository = new SupabaseCategoryRepository();
  const userPreferencesRepository = new SupabaseUserPreferencesRepository();
  
  return (
    <RepositoryContext.Provider value={{ categoryRepository, userPreferencesRepository }}>
      {children}
    </RepositoryContext.Provider>
  );
};

export const useRepositories = () => {
  const context = useContext(RepositoryContext);
  if (context === undefined) {
    throw new Error('useRepositories must be used within a RepositoryProvider');
  }
  return context;
};
```

### Phase 2: State Management

#### SimplifiedCategoryContext

A single, focused context that uses repositories for data operations:

```typescript
// src/contexts/SimplifiedCategoryContext.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../providers/RepositoryProvider';
import { useAuth } from '../lib/auth';

// Define context type
interface CategoryContextType {
  // Data
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
  
  // User preferences
  hiddenCategories: string[];
  quickTaskCategories: string[];
  defaultCategory: string | null;
  
  // CRUD operations
  createCategory: (category: CategoryInput) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<CategoryInput>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Preference operations
  toggleCategoryVisibility: (categoryId: string) => Promise<void>;
  toggleQuickTaskCategory: (categoryId: string) => Promise<void>;
  setDefaultCategory: (categoryId: string) => Promise<void>;
  
  // UI state
  isCategoryModalOpen: boolean;
  categoryToEdit: Category | null;
  openCategoryModal: (category?: Category) => void;
  closeCategoryModal: () => void;
}

// Create context
const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

// Provider component
export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { categoryRepository, userPreferencesRepository } = useRepositories();
  
  // UI state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  
  // Fetch categories
  const { 
    data: categories = [], 
    isLoading: isCategoriesLoading,
    error: categoriesError
  } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => categoryRepository.getAll(),
    enabled: !!user
  });
  
  // Fetch user preferences
  const {
    data: preferences = { hidden_categories: [], quick_task_categories: [], default_quick_task_category: null },
    isLoading: isPreferencesLoading,
    error: preferencesError
  } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: () => userPreferencesRepository.getUserPreferences(),
    enabled: !!user
  });
  
  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (category: CategoryInput) => categoryRepository.create(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
  
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CategoryInput> }) => 
      categoryRepository.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
  
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });
  
  const updatePreferencesMutation = useMutation({
    mutationFn: (updates: Partial<UserPreferences>) => 
      userPreferencesRepository.updateUserPreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    }
  });
  
  // Helper functions
  const toggleCategoryVisibility = useCallback(async (categoryId: string) => {
    const hiddenCategories = [...preferences.hidden_categories];
    const index = hiddenCategories.indexOf(categoryId);
    
    if (index >= 0) {
      hiddenCategories.splice(index, 1);
    } else {
      hiddenCategories.push(categoryId);
    }
    
    await updatePreferencesMutation.mutateAsync({ hidden_categories: hiddenCategories });
  }, [preferences.hidden_categories, updatePreferencesMutation]);
  
  const toggleQuickTaskCategory = useCallback(async (categoryId: string) => {
    const quickTaskCategories = [...preferences.quick_task_categories];
    const index = quickTaskCategories.indexOf(categoryId);
    
    if (index >= 0) {
      quickTaskCategories.splice(index, 1);
    } else {
      quickTaskCategories.push(categoryId);
    }
    
    await updatePreferencesMutation.mutateAsync({ quick_task_categories: quickTaskCategories });
  }, [preferences.quick_task_categories, updatePreferencesMutation]);
  
  const setDefaultCategory = useCallback(async (categoryId: string) => {
    await updatePreferencesMutation.mutateAsync({ default_quick_task_category: categoryId });
  }, [updatePreferencesMutation]);
  
  // Modal functions
  const openCategoryModal = useCallback((category?: Category) => {
    setCategoryToEdit(category || null);
    setIsCategoryModalOpen(true);
  }, []);
  
  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false);
    setCategoryToEdit(null);
  }, []);
  
  // Combine loading and error states
  const isLoading = isCategoriesLoading || isPreferencesLoading;
  const error = categoriesError || preferencesError;
  
  // Context value
  const value: CategoryContextType = {
    categories,
    isLoading,
    error,
    
    hiddenCategories: preferences.hidden_categories,
    quickTaskCategories: preferences.quick_task_categories,
    defaultCategory: preferences.default_quick_task_category,
    
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: (id, updates) => updateCategoryMutation.mutateAsync({ id, updates }),
    deleteCategory: deleteCategoryMutation.mutateAsync,
    
    toggleCategoryVisibility,
    toggleQuickTaskCategory,
    setDefaultCategory,
    
    isCategoryModalOpen,
    categoryToEdit,
    openCategoryModal,
    closeCategoryModal
  };
  
  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

// Custom hook
export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
```

### Phase 3: UI Components

The UI components remain largely the same as in the previous implementation, but now they interact with the repositories through the context:

#### CategoryModal

```typescript
// src/components/Categories/CategoryModal.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCategories } from '../../contexts/SimplifiedCategoryContext';

// Validation schema
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  color: z.string().default('#3B82F6')
});

type CategoryFormData = z.infer<typeof categorySchema>;

const CategoryModal: React.FC = () => {
  const { 
    isCategoryModalOpen, 
    closeCategoryModal, 
    categoryToEdit,
    createCategory,
    updateCategory
  } = useCategories();
  
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: categoryToEdit || { name: '', color: '#3B82F6' }
  });
  
  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isCategoryModalOpen) {
      reset(categoryToEdit || { name: '', color: '#3B82F6' });
    }
  }, [isCategoryModalOpen, categoryToEdit, reset]);
  
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, data);
      } else {
        await createCategory(data);
      }
      closeCategoryModal();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };
  
  if (!isCategoryModalOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {categoryToEdit ? 'Edit Category' : 'Create Category'}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter category name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              {...register('color')}
              className="w-full h-10 p-1 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeCategoryModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
```

#### SimplifiedCategorySelector and SimplifiedCategorySettings

These components remain the same as in the previous implementation, as they interact with the repositories through the context.

## Integration Strategy

### 1. Update App.tsx

Add the RepositoryProvider to the provider chain:

```tsx
// src/App.tsx
import { RepositoryProvider } from './providers/RepositoryProvider';
import { CategoryProvider } from './contexts/SimplifiedCategoryContext';

function App() {
  return (
    <AuthProvider>
      <RepositoryProvider>
        <QueryProvider>
          <SettingsProvider>
            <CategoryProvider>
              {/* Rest of the application */}
            </CategoryProvider>
          </SettingsProvider>
        </QueryProvider>
      </RepositoryProvider>
    </AuthProvider>
  );
}
```

### 2. Database Migration

Create a migration script to update the database schema:

```sql
-- 1. Create new categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 2. Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hidden_categories JSONB DEFAULT '[]',
  quick_task_categories JSONB DEFAULT '[]',
  default_quick_task_category UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Migrate existing categories
INSERT INTO categories (user_id, name, color)
SELECT 
  user_id,
  CASE 
    WHEN name LIKE 'z_%' THEN SUBSTRING(name FROM 3)
    ELSE name
  END,
  '#3B82F6'
FROM (
  SELECT DISTINCT user_id, category_name as name
  FROM tasks
  WHERE category_name IS NOT NULL AND category_name != ''
) AS distinct_categories;

-- 4. Update tasks table to use category_id
ALTER TABLE tasks ADD COLUMN category_id UUID;

-- 5. Set category_id for existing tasks
UPDATE tasks t
SET category_id = c.id
FROM categories c
WHERE 
  t.user_id = c.user_id AND 
  (t.category_name = c.name OR t.category_name = 'z_' || c.name);

-- 6. Add foreign key constraint
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_category 
FOREIGN KEY (category_id) REFERENCES categories(id) 
ON DELETE SET NULL;
```

## Testing Strategy

### 1. Unit Tests for Repositories

```typescript
// src/repositories/__tests__/SupabaseCategoryRepository.test.ts
import { SupabaseCategoryRepository } from '../SupabaseCategoryRepository';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}));

describe('SupabaseCategoryRepository', () => {
  let repository: SupabaseCategoryRepository;
  
  beforeEach(() => {
    repository = new SupabaseCategoryRepository();
    jest.clearAllMocks();
  });
  
  test('getAll should return categories', async () => {
    const mockCategories = [
      { id: '1', name: 'Work', color: '#ff0000' },
      { id: '2', name: 'Personal', color: '#00ff00' }
    ];
    
    (supabase.from as jest.Mock).mockReturnThis();
    (supabase.select as jest.Mock).mockReturnThis();
    (supabase.order as jest.Mock).mockResolvedValue({ data: mockCategories, error: null });
    
    const result = await repository.getAll();
    
    expect(supabase.from).toHaveBeenCalledWith('categories');
    expect(supabase.select).toHaveBeenCalledWith('*');
    expect(supabase.order).toHaveBeenCalledWith('name');
    expect(result).toEqual(mockCategories);
  });
  
  // Additional tests for other repository methods...
});
```

### 2. Integration Tests

```typescript
// src/contexts/__tests__/SimplifiedCategoryContext.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryProvider, useCategories } from '../SimplifiedCategoryContext';
import { RepositoryProvider } from '../../providers/RepositoryProvider';
import { QueryProvider } from '../../contexts/query/QueryProvider';

// Mock repositories
jest.mock('../../repositories/SupabaseCategoryRepository');
jest.mock('../../repositories/SupabaseUserPreferencesRepository');

// Test component that uses the context
const TestComponent = () => {
  const { categories, isLoading, createCategory } = useCategories();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <ul>
        {categories.map(category => (
          <li key={category.id}>{category.name}</li>
        ))}
      </ul>
      <button onClick={() => createCategory({ name: 'New Category', color: '#ff0000' })}>
        Add Category
      </button>
    </div>
  );
};

describe('SimplifiedCategoryContext', () => {
  test('should render categories and allow adding new ones', async () => {
    // Setup mocks
    const mockCategories = [
      { id: '1', name: 'Work', color: '#ff0000' },
      { id: '2', name: 'Personal', color: '#00ff00' }
    ];
    
    // Mock implementation of repository methods
    // ...
    
    render(
      <QueryProvider>
        <RepositoryProvider>
          <CategoryProvider>
            <TestComponent />
          </CategoryProvider>
        </RepositoryProvider>
      </QueryProvider>
    );
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });
    
    // Add a new category
    await userEvent.click(screen.getByText('Add Category'));
    
    // Verify the repository method was called
    // ...
  });
});
```

## Benefits of the Repository Pattern

1. **Separation of Concerns**: The repository pattern separates data access logic from business logic, making the codebase more maintainable.

2. **Testability**: Repositories can be easily mocked for testing, allowing for more comprehensive unit tests.

3. **Flexibility**: If we need to change the data source (e.g., from Supabase to another provider), we only need to create a new repository implementation without changing the rest of the application.

4. **Consistency**: The repository pattern enforces a consistent way of accessing data throughout the application.

5. **Caching**: We can implement caching strategies at the repository level without affecting the rest of the application.

## Conclusion

Using the repository pattern provides a more maintainable and testable architecture for the category management system. By clearly separating data access from business logic, we create a system that is easier to extend and modify as requirements change.

The implementation approach outlined in this document provides a solid foundation for building a robust category management system that addresses the core issues identified in the previous implementation while also providing a more flexible and maintainable architecture.
