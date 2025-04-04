import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * DashboardLayout component - serves as the container for dashboard widgets
 * This component manages the grid structure and responsive layout
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-slate-50 min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

export default DashboardLayout;
