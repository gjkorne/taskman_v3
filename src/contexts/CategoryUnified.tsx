import { ReactNode } from 'react';
import { CategoryProvider as LegacyProvider } from './CategoryContext';
import { CategoryProvider as NewProvider } from './category';

/**
 * UnifiedCategoryProvider
 * 
 * This is a wrapper component that provides both the legacy CategoryProvider
 * and the new CategoryProvider to ensure full compatibility across the application.
 * 
 * This solves the "useCategories must be used within a CategoryProvider" error
 * by ensuring all variants of the hook have their required providers.
 */
export function UnifiedCategoryProvider({ children }: { children: ReactNode }) {
  return (
    <LegacyProvider>
      <NewProvider>
        {children}
      </NewProvider>
    </LegacyProvider>
  );
}

export default UnifiedCategoryProvider;
