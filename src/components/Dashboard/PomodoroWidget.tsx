import { DashboardWidget } from './DashboardWidget';
import { usePomodoroContext } from '../Pomodoro/PomodoroContext';
import { Clock, Play, Pause, RotateCcw, Settings, Coffee, Briefcase } from 'lucide-react';
import { Button } from '../UI/Button';
import { useDensity } from '../../contexts/ui/DensityContext';
// Removing unused import
// import { densityClasses } from '../UI/DensityStyles';
import { DensityLevel } from '../../contexts/ui/DensityContext';
import { useState } from 'react';
import PomodoroModal from '../Pomodoro/PomodoroModal';

interface PomodoroWidgetProps {
  className?: string;
}

/**
 * Widget that displays a compact Pomodoro timer on the dashboard
 * Uses the shared Pomodoro context for state management
 * Respects the UI density preferences
 */
export function PomodoroWidget({ className = '' }: PomodoroWidgetProps) {
  const {
    remainingTime,
    isRunning,
    mode,
    startTimer,
    pauseTimer,
    resetTimer,
    workSessionsCompleted,
    breakSessionsCompleted,
    workDuration,
    breakDuration,
    formatTime // Use the formatTime function from the hook
  } = usePomodoroContext();
  
  const { density } = useDensity();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Determine icon and text to display based on current mode
  const getModeDisplay = () => {
    switch (mode) {
      case 'work':
        return {
          icon: <Briefcase className="w-4 h-4 mr-2" />,
          text: 'Work Session'
        };
      case 'break':
        return {
          icon: <Coffee className="w-4 h-4 mr-2" />,
          text: 'Break Time'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 mr-2" />,
          text: 'Pomodoro Timer'
        };
    }
  };

  const { text: modeText, icon: modeIcon } = getModeDisplay();
  
  // Handle opening the more detailed Pomodoro modal
  const handleOpenPomodoroModal = () => {
    setIsModalOpen(true);
  };
  
  // Adapt styles based on density
  const timerFontSize = density === DensityLevel.COMPACT 
    ? 'text-3xl' 
    : density === DensityLevel.COMFORTABLE 
      ? 'text-5xl' 
      : 'text-4xl';
  
  const widgetPadding = density === DensityLevel.COMPACT
    ? 'py-1'
    : density === DensityLevel.COMFORTABLE
      ? 'py-4'
      : 'py-2';
  
  const buttonSize = density === DensityLevel.COMPACT ? 'xs' : 'sm';
  
  // Actions for the widget header
  const widgetActions = (
    <Button 
      variant="secondary" 
      size={buttonSize}
      onClick={handleOpenPomodoroModal}
      icon={<Settings className={density === DensityLevel.COMPACT ? 'w-3 h-3' : 'w-4 h-4'} />}
    >
      Settings
    </Button>
  );
  
  // Widget footer with session counts
  const widgetFooter = (
    <div className="flex justify-between text-xs text-gray-500">
      <div>Work: {workDuration} min</div>
      <div>Break: {breakDuration} min</div>
      <div>Completed: {workSessionsCompleted} work / {breakSessionsCompleted} break</div>
    </div>
  );
  
  return (
    <>
      <DashboardWidget 
        title={
          <div className="flex items-center">
            {modeIcon}
            <span className="ml-1">{modeText}</span>
          </div>
        } 
        className={`${className} ${widgetPadding}`}
        actions={widgetActions}
        footer={widgetFooter}
        data-density={density}
      >
        <div className={`flex flex-col items-center justify-center ${widgetPadding}`}>
          {/* Timer Display */}
          <div className={`${timerFontSize} font-mono font-bold mb-4 text-center`} data-density={density}>
            {formatTime(remainingTime)}
          </div>
          
          {/* Timer Controls */}
          <div className="flex space-x-2 justify-center">
            {!isRunning ? (
              <Button onClick={startTimer} size={buttonSize}>
                <Play className="mr-1 h-4 w-4" /> Start
              </Button>
            ) : (
              <Button onClick={pauseTimer} size={buttonSize} variant="secondary">
                <Pause className="mr-1 h-4 w-4" /> Pause
              </Button>
            )}
            <Button onClick={resetTimer} size={buttonSize} variant="secondary">
              <RotateCcw className="mr-1 h-4 w-4" /> Reset
            </Button>
          </div>
        </div>
      </DashboardWidget>
      
      {/* Pomodoro Modal */}
      <PomodoroModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}

export default PomodoroWidget;
