import useTaskDataHook from './useTaskDataHook';
import { createDataContext } from '../createDataContext';

export const { Provider: TaskDataProvider, useDataContext: useTaskData } =
  createDataContext(useTaskDataHook, 'TaskData');

export { TASK_QUERY_KEYS } from './useTaskDataHook';
