import { } from 'react';

// Define widget types
export enum WidgetType {
  RECENT_TASKS = 'recentTasks',
  TASK_OVERVIEW = 'taskOverview',
  UPCOMING_TASKS = 'upcomingTasks',
  QUICK_ACTIONS = 'quickActions',
  CALENDAR = 'calendar',
  POMODORO = 'pomodoro',
  NOTES = 'notes',
  CUSTOM = 'custom'
}

// Define widget size options
export enum WidgetSize {
  SMALL = 'small',    // 1/4 width (col-span-1)
  MEDIUM = 'medium',  // 1/2 width (col-span-2)
  LARGE = 'large',    // 3/4 width (col-span-3)
  FULL = 'full'       // Full width (col-span-4)
}

// Define widget position in grid
export interface WidgetPosition {
  row: number;
  column: number;
  size: WidgetSize;
}

// Define widget configuration
export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title?: string;
  position: WidgetPosition;
  props?: Record<string, any>;
  visible: boolean;
}

// Define dashboard layout configuration
export interface DashboardConfig {
  widgets: WidgetConfig[];
  columns: number;
}

// Default dashboard configuration
export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  columns: 4,
  widgets: [
    {
      id: 'task-overview',
      type: WidgetType.TASK_OVERVIEW,
      position: {
        row: 1,
        column: 1,
        size: WidgetSize.LARGE
      },
      visible: true
    },
    {
      id: 'quick-actions',
      type: WidgetType.QUICK_ACTIONS,
      position: {
        row: 1,
        column: 4,
        size: WidgetSize.SMALL
      },
      visible: true
    },
    {
      id: 'recent-tasks',
      type: WidgetType.RECENT_TASKS,
      title: 'Recent Tasks',
      position: {
        row: 2,
        column: 1,
        size: WidgetSize.LARGE
      },
      props: {
        limit: 9
      },
      visible: true
    },
    {
      id: 'upcoming-tasks',
      type: WidgetType.UPCOMING_TASKS,
      position: {
        row: 2,
        column: 4,
        size: WidgetSize.SMALL
      },
      visible: true
    }
  ]
};

// Helper function to get column span based on widget size
export function getColumnSpan(size: WidgetSize, totalColumns: number = 4): number {
  switch (size) {
    case WidgetSize.SMALL:
      return 1;
    case WidgetSize.MEDIUM:
      return Math.floor(totalColumns / 2);
    case WidgetSize.LARGE:
      return Math.floor(totalColumns * 0.75);
    case WidgetSize.FULL:
      return totalColumns;
    default:
      return 1;
  }
}

// Helper to get CSS class for column span
export function getColumnSpanClass(size: WidgetSize, totalColumns: number = 4): string {
  const span = getColumnSpan(size, totalColumns);
  return `col-span-1 md:col-span-${span > 2 ? 2 : span} lg:col-span-${span}`;
}

// Context and hook for dashboard configuration
export const useDashboardConfig = () => {
  // This would be expanded to include state management for dashboard configuration
  return {
    config: DEFAULT_DASHBOARD_CONFIG,
    updateWidgetPosition: (widgetId: string, position: WidgetPosition) => {
      // Implementation would update widget position
      console.log('Update widget position', widgetId, position);
    },
    toggleWidgetVisibility: (widgetId: string) => {
      // Implementation would toggle widget visibility
      console.log('Toggle widget visibility', widgetId);
    },
    addWidget: (widget: Omit<WidgetConfig, 'id'>) => {
      // Implementation would add a new widget
      console.log('Add widget', widget);
    },
    removeWidget: (widgetId: string) => {
      // Implementation would remove a widget
      console.log('Remove widget', widgetId);
    }
  };
};

export default useDashboardConfig;
