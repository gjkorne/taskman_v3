import React from 'react';
import { Modal } from '../UI/Modal';
import { usePomodoroContext } from './PomodoroContext';
import { useSettings } from '../../contexts/SettingsCompat';
import { Button } from '../UI/Button';
import { useDensity, DensityLevel } from '../../contexts/ui/DensityContext';
import { Clock, Play, Pause, RotateCcw, Settings, Coffee, Briefcase, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A modal component that provides a detailed view of the Pomodoro timer
 * Includes timer display, controls, and a link to settings
 */
export const PomodoroModal: React.FC<PomodoroModalProps> = ({ isOpen, onClose }) => {
  const {
    remainingTime,
    isRunning,
    mode,
    startTimer,
    pauseTimer,
    resetTimer,
    workSessionsCompleted,
    breakSessionsCompleted,
    formatTime
  } = usePomodoroContext();
  
  const { settings } = useSettings();
  const { density } = useDensity();
  
  // Get mode display information
  const getModeDisplay = () => {
    switch (mode) {
      case 'work':
        return {
          icon: <Briefcase className="w-5 h-5" />,
          text: 'Work Session',
          color: 'text-blue-600'
        };
      case 'break':
        return {
          icon: <Coffee className="w-5 h-5" />,
          text: 'Break Time',
          color: 'text-green-600'
        };
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          text: 'Pomodoro Timer',
          color: 'text-gray-600'
        };
    }
  };

  const { text: modeText, icon: modeIcon, color: modeColor } = getModeDisplay();
  
  // Adapt styles based on density
  const timerFontSize = density === DensityLevel.COMPACT 
    ? 'text-5xl' 
    : density === DensityLevel.COMFORTABLE 
      ? 'text-7xl' 
      : 'text-6xl';
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Pomodoro Timer"
      size="md"
    >
      <div className="flex flex-col items-center">
        {/* Mode indicator */}
        <div className={`flex items-center ${modeColor} font-medium mb-4`}>
          {modeIcon}
          <span className="ml-2">{modeText}</span>
        </div>
        
        {/* Timer display */}
        <div className={`${timerFontSize} font-mono font-bold text-center my-6`}>
          {formatTime(remainingTime)}
        </div>
        
        {/* Session counts */}
        <div className="flex justify-center space-x-8 mb-6">
          <div className="text-center">
            <div className="text-sm text-gray-500">Work Sessions</div>
            <div className="text-2xl font-bold text-blue-600">{workSessionsCompleted}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Break Sessions</div>
            <div className="text-2xl font-bold text-green-600">{breakSessionsCompleted}</div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          {isRunning ? (
            <Button 
              onClick={pauseTimer} 
              variant="primary" 
              size="lg"
              icon={<Pause className="w-5 h-5 mr-2" />}
            >
              Pause
            </Button>
          ) : (
            <Button 
              onClick={startTimer} 
              variant="primary" 
              size="lg"
              icon={<Play className="w-5 h-5 mr-2" />}
            >
              Start
            </Button>
          )}
          <Button 
            onClick={resetTimer} 
            variant="secondary" 
            size="lg"
            icon={<RotateCcw className="w-5 h-5 mr-2" />}
          >
            Reset
          </Button>
        </div>
        
        {/* Settings information */}
        <div className="w-full bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="text-lg font-medium text-gray-700 mb-2">Timer Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Work Duration</div>
              <div className="font-medium">{settings.pomodoroWorkDuration} minutes</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Break Duration</div>
              <div className="font-medium">{settings.pomodoroBreakDuration} minutes</div>
            </div>
          </div>
          
          <div className="mt-4">
            <Link 
              to="/settings" 
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
              onClick={onClose}
            >
              <Settings className="w-4 h-4 mr-1" />
              Adjust timer settings
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="text-sm text-gray-500 text-center">
          <p>The Pomodoro Technique helps you focus by working in dedicated time blocks.</p>
          <p>Complete a work session, then take a short break before starting the next one.</p>
        </div>
      </div>
    </Modal>
  );
};

export default PomodoroModal;
