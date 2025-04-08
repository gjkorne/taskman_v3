import { useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { initializeRecommendedCategories } from '../utils/categoryInitializer';

/**
 * Component that handles one-time initialization tasks after login
 */
export function AppInitializer() {
  const auth = useAuth();
  
  useEffect(() => {
    const initializeApp = async () => {
      // Only run initializations when authenticated
      if (auth.user) {
        try {
          // Initialize our recommended categories
          await initializeRecommendedCategories();
          console.log('Category initialization complete');
        } catch (error) {
          console.error('Error during app initialization:', error);
        }
      }
    };
    
    initializeApp();
  }, [auth.user]);
  
  // This is a non-visual component
  return null;
}
