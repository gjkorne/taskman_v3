/**
 * Constants for task section styling
 * This centralizes all section styles to maintain consistency across components
 */

export const TASK_SECTION_STYLES = {
  activeNow: {
    title: 'Active Now',
    bgColor: 'bg-blue-50',
    icon: 'play-circle',
  },
  paused: {
    title: 'Paused',
    bgColor: 'bg-amber-50',
    icon: 'pause-circle',
  },
  inProgress: {
    title: 'In Progress',
    bgColor: 'bg-indigo-50',
    icon: 'loader',
  },
  doNext: {
    title: 'Do Next',
    bgColor: 'bg-yellow-50',
    icon: 'star',
  },
  todo: {
    title: 'Todo',
    bgColor: 'bg-white',
    icon: 'list',
  },
  completed: {
    title: 'Completed',
    bgColor: 'bg-green-50',
    icon: 'check-circle',
  },
  archived: {
    title: 'Archived',
    bgColor: 'bg-gray-50',
    icon: 'archive',
  },
};

// Type for section keys to ensure type safety
export type TaskSectionKey = keyof typeof TASK_SECTION_STYLES;
