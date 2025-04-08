import { StrictMode } from 'react';
import { createRoot as createRootReactDOM } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Import the category debugger and cleanup utility in development mode
if (import.meta.env.DEV) {
  import('./debug/category-debugger')
    .then(() => console.log('Category debugger loaded for development'))
    .catch(err => console.error('Failed to load category debugger:', err));
    
  import('./utils/categoryCleanup')
    .then(() => console.log('Category cleanup utility loaded for development'))
    .catch(err => console.error('Failed to load category cleanup utility:', err));
    
  import('./debug/run-category-cleanup')
    .then(() => console.log('Enhanced category cleanup utility loaded for development'))
    .catch(err => console.error('Failed to load enhanced category cleanup utility:', err));
    
  import('./debug/expose-supabase')
    .then(() => console.log('Supabase client exposed for debugging'))
    .catch(err => console.error('Failed to expose Supabase client:', err));
    
  import('./debug/check-category-constraints')
    .then(() => console.log('Category constraint checker loaded for development'))
    .catch(err => console.error('Failed to load category constraint checker:', err));
    
  import('./debug/force-delete-duplicates')
    .then(() => console.log('Force delete utility loaded for development'))
    .catch(err => console.error('Failed to load force delete utility:', err));
}

createRootReactDOM(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
