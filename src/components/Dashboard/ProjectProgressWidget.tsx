import { useOpenTasksByProject } from '../../hooks/dashboard/useTaskMetrics';
import { DashboardWidget } from './DashboardWidget';

/**
 * ProjectProgressWidget - Shows progress of tasks grouped by category/project
 * Uses the specialized useOpenTasksByProject hook from our optimized contexts
 */
export function ProjectProgressWidget() {
  const projects = useOpenTasksByProject();
  
  // Get top 5 projects by active task count
  const topProjects = projects.slice(0, 5);
  
  return (
    <DashboardWidget 
      title="Project Progress" 
      isLoading={projects.length === 0}
      className="col-span-1 md:col-span-2"
    >
      {topProjects.length > 0 ? (
        <div className="space-y-4">
          {topProjects.map(project => (
            <div key={project.name} className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{project.name}</span>
                <span className="text-xs text-gray-500">
                  {project.total - project.count}/{project.total} completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${Math.round(project.progress * 100)}%` }}
                ></div>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>{project.count} open tasks</span>
                <span>{Math.round(project.progress * 100)}% done</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-gray-500">No projects with tasks yet</p>
          <button className="mt-2 text-sm text-indigo-600 font-medium">
            Create your first project
          </button>
        </div>
      )}
      
      {projects.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-indigo-600 hover:text-indigo-800">
            View all projects ({projects.length})
          </button>
        </div>
      )}
    </DashboardWidget>
  );
}

export default ProjectProgressWidget;
