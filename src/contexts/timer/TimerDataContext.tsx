import { useTimer as useTimerCompat } from '../TimerCompat';
import { createDataContext } from '../createDataContext';

export const { Provider: TimerDataProvider, useDataContext: useTimerData } =
  createDataContext(useTimerCompat, 'TimerData');
