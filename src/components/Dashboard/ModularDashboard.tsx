import { useState } from 'react';
import { 
  DashboardConfig, 
  WidgetConfig, 
  WidgetType, 
  getColumnSpanClass,
  DEFAULT_DASHBOARD_CONFIG
} from './DashboardConfig';
import { RecentTasksWidget } from './RecentTasksWidget';
import { TaskOverviewWidget } from './TaskOverviewWidget';
import { UpcomingTasksWidget } from './UpcomingTasksWidget';
import { QuickActionsWidget } from './QuickActionsWidget';
import { Settings, X } from 'lucide-react';
import { QuickTaskModal } from '../TaskForm/QuickTaskModal';

interface ModularDashboardProps {
  initialConfig?: DashboardConfig;
  editable?: boolean;
}

/**
 * ModularDashboard - A configurable dashboard that allows for customizable widget layouts
 */
export function ModularDashboard({ 
  initialConfig = DEFAULT_DASHBOARD_CONFIG,
  editable = false
}: ModularDashboardProps) {
  const [config, setConfig] = useState<DashboardConfig>(initialConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  
  // Sort widgets by row and column for rendering
  const sortedWidgets = [...config.widgets]
    .filter(widget => widget.visible)
    .sort((a, b) => {
      if (a.position.row !== b.position.row) {
        return a.position.row - b.position.row;
      }
      return a.position.column - b.position.column;
    });
  
  // Group widgets by row
  const widgetsByRow: Record<number, WidgetConfig[]> = {};
  sortedWidgets.forEach(widget => {
    if (!widgetsByRow[widget.position.row]) {
      widgetsByRow[widget.position.row] = [];
    }
    widgetsByRow[widget.position.row].push(widget);
  });
  
  // Render a widget based on its type
  const renderWidget = (widget: WidgetConfig) => {
    const columnSpanClass = getColumnSpanClass(widget.position.size, config.columns);
    
    switch (widget.type) {
      case WidgetType.RECENT_TASKS:
        return (
          <div key={widget.id} className={columnSpanClass}>
            <RecentTasksWidget 
              title={widget.title || "Recent Tasks"} 
              limit={widget.props?.limit || 5} 
            />
          </div>
        );
      case WidgetType.TASK_OVERVIEW:
        return (
          <div key={widget.id} className={columnSpanClass}>
            <TaskOverviewWidget />
          </div>
        );
      case WidgetType.UPCOMING_TASKS:
        return (
          <div key={widget.id} className={columnSpanClass}>
            <UpcomingTasksWidget />
          </div>
        );
      case WidgetType.QUICK_ACTIONS:
        return (
          <div key={widget.id} className={columnSpanClass}>
            <QuickActionsWidget 
              onCreateTask={() => setIsQuickTaskModalOpen(true)} 
            />
          </div>
        );
      default:
        return null;
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  // Toggle widget visibility
  const toggleWidgetVisibility = (widgetId: string) => {
    const newWidgets = config.widgets.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    );
    setConfig({ ...config, widgets: newWidgets });
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        
        {editable && (
          <button
            onClick={toggleEditMode}
            className="mt-4 md:mt-0 px-4 py-2 flex items-center rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Settings size={16} className="mr-2" />
            {isEditing ? 'Save Layout' : 'Customize Layout'}
          </button>
        )}
      </div>
      
      {isEditing ? (
        // Simple edit mode without drag-and-drop
        <>
          {Object.entries(widgetsByRow).map(([rowNum, rowWidgets]) => (
            <div 
              key={`row-${rowNum}`}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
            >
              {rowWidgets.map(widget => (
                <div key={widget.id} className="relative">
                  {renderWidget(widget)}
                  <button
                    className="absolute top-2 right-2 p-1 bg-red-100 rounded-full text-red-500 hover:bg-red-200"
                    onClick={() => toggleWidgetVisibility(widget.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ))}
          
          {/* Hidden widgets that can be re-added */}
          {config.widgets.filter(w => !w.visible).length > 0 && (
            <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Hidden Widgets</h3>
              <div className="flex flex-wrap gap-2">
                {config.widgets.filter(w => !w.visible).map(widget => (
                  <button
                    key={widget.id}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                    onClick={() => toggleWidgetVisibility(widget.id)}
                  >
                    + {widget.title || widget.type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        // Regular view mode
        <>
          {Object.entries(widgetsByRow).map(([rowNum, rowWidgets]) => (
            <div 
              key={`row-${rowNum}`}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
            >
              {rowWidgets.map(widget => renderWidget(widget))}
            </div>
          ))}
        </>
      )}
      
      {/* Quick Task Modal */}
      <QuickTaskModal 
        isOpen={isQuickTaskModalOpen} 
        onClose={() => setIsQuickTaskModalOpen(false)} 
        onTaskCreated={() => {
          setIsQuickTaskModalOpen(false);
          // Refresh data if needed
        }} 
      />
    </div>
  );
}

export default ModularDashboard;
