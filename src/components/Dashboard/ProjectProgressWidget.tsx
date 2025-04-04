import { DashboardWidget } from './DashboardWidget';

/**
 * ProjectProgressWidget - Displays active projects
 */
export function ProjectProgressWidget() {
  // Using static data for the UI mockup
  return (
    <DashboardWidget 
      title="Active Projects" 
      isLoading={false}
      className="col-span-1"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-blue-600">
          3
        </div>
        <div className="text-gray-500 text-sm mt-2">
          in progress
        </div>
      </div>
    </DashboardWidget>
  );
}

export default ProjectProgressWidget;
