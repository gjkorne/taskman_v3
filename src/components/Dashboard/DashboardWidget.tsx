import { ReactNode } from 'react';

interface DashboardWidgetProps {
  title: string;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  footer?: ReactNode;
}

/**
 * Common dashboard widget component with consistent styling
 * Used as a container for various dashboard metrics and visualizations
 */
export function DashboardWidget({ 
  title, 
  children, 
  className = '', 
  isLoading = false,
  footer
}: DashboardWidgetProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      </div>
      
      <div className="relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : null}
        
        <div className={isLoading ? 'opacity-50' : ''}>
          {children}
        </div>
      </div>
      
      {footer && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
          {footer}
        </div>
      )}
    </div>
  );
}

export default DashboardWidget;
