import React from 'react';
import { usePomodoroContext } from './PomodoroContext'; 
import { Button } from '../UI/Button'; 
import { Input } from '../UI/base/Input';   
import { Card } from '../UI/base/Card'; 
import { Clock, Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react';

// Helper to format time (MM:SS)
const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const PomodoroTimer: React.FC = () => {
  const {
    mode,
    workDuration,
    breakDuration,
    remainingTime,
    isRunning,
    workSessionsCompleted,
    breakSessionsCompleted,
    startTimer,
    pauseTimer,
    resetTimer,
    setWorkDuration,
    setBreakDuration,
  } = usePomodoroContext();

  const handleWorkDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setWorkDuration(value);
    }
  };

  const handleBreakDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setBreakDuration(value);
    }
  };

  const getModeDisplay = () => {
    switch (mode) {
      case 'work': return { text: 'Work Session', icon: <Briefcase className="h-5 w-5 mr-2" /> };
      case 'break': return { text: 'Break Time', icon: <Coffee className="h-5 w-5 mr-2" /> };
      default: return { text: 'Pomodoro Timer', icon: <Clock className="h-5 w-5 mr-2" /> };
    }
  };

  const { text: modeText, icon: modeIcon } = getModeDisplay();

  const cardTitle = (
    <div className="flex items-center text-lg">
      {modeIcon}
      {modeText}
    </div>
  );

  const cardFooter = (
    <div className="flex justify-between text-sm text-muted-foreground pt-4">
      <div>Work Sessions: {workSessionsCompleted}</div>
      <div>Break Sessions: {breakSessionsCompleted}</div>
    </div>
  );

  return (
    <Card 
      className="w-full max-w-md mx-auto" 
      title={cardTitle} 
      footer={cardFooter}
    >
      <div className="flex flex-col items-center space-y-6 pt-6 pb-6"> 
        <div className="text-7xl font-bold font-mono tracking-tight">
          {formatTime(remainingTime)}
        </div>

        <div className="flex space-x-4">
          {!isRunning ? (
            <Button onClick={startTimer} size="lg">
              <Play className="mr-2 h-5 w-5" /> Start
            </Button>
          ) : (
            <Button onClick={pauseTimer} size="lg" variant="secondary"> 
              <Pause className="mr-2 h-5 w-5" /> Pause
            </Button>
          )}
          <Button onClick={resetTimer} size="lg" variant="secondary">
            <RotateCcw className="mr-2 h-5 w-5" /> Reset
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="space-y-2">
            <label htmlFor="workDuration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Work (min)</label> 
            <Input
              id="workDuration"
              type="number"
              // min="1" 
              // max="60"
              value={workDuration}
              onChange={handleWorkDurationChange}
              disabled={isRunning && mode === 'work'}
              className="text-center"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="breakDuration" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Break (min)</label> 
            <Input
              id="breakDuration"
              type="number"
              // min="1" 
              // max="60"
              value={breakDuration}
              onChange={handleBreakDurationChange}
              disabled={isRunning && mode === 'break'}
              className="text-center"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
