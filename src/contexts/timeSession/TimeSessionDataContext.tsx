import useTimeSessionDataHook, { TIME_SESSION_QUERY_KEYS } from './useTimeSessionDataHook';
import { createDataContext } from '../createDataContext';

export { TIME_SESSION_QUERY_KEYS };

export const { Provider: TimeSessionDataProvider, useDataContext: useTimeSessionData } =
  createDataContext(useTimeSessionDataHook, 'TimeSessionData');
