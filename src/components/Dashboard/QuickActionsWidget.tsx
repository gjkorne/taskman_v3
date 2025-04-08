import { useState } from 'react';
import { DashboardWidget } from './DashboardWidget';
import { Plus, Timer, BarChart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isSameMonth, isSameDay } from 'date-fns';

interface QuickActionsWidgetProps {
  onCreateTask?: () => void;
}

/**
 * QuickActionsWidget - Provides quick access to common actions and a mini calendar
 */
export function QuickActionsWidget({ onCreateTask }: QuickActionsWidgetProps) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const today = new Date();
  
  // Generate calendar days for current month view
  const generateCalendarDays = () => {
    const daysInMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    ).getDate();
    
    const firstDayOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    ).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i - firstDayOfMonth + 1));
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i));
    }
    
    // Add empty cells for days after the last day of month
    for (let i = 0; i < 6 - (daysInMonth + firstDayOfMonth - 1) % 7; i++) {
      days.push(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), daysInMonth + i + 1));
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  // Handle clicking on a date
  const handleDateSelect = (day: Date) => {
    setSelectedDate(day);
    // Could navigate to tasks for this date or show tasks in a popover
  };
  
  // Navigate to previous month
  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };
  
  // Navigate to next month
  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };
  
  // Quick action handlers
  const handleCreateTask = () => {
    if (onCreateTask) {
      onCreateTask();
    }
  };
  
  const handleViewReports = () => {
    navigate('/reports');
  };
  
  const handleStartPomodoro = () => {
    // Implement pomodoro timer functionality
    console.log('Starting pomodoro timer');
  };
  
  return (
    <DashboardWidget
      title="Quick Actions"
      className="col-span-1 h-full flex flex-col"
    >
      <div className="space-y-4 flex-grow">
        {/* Quick action buttons */}
        <div className="space-y-2">
          <button 
            onClick={handleCreateTask}
            className="w-full py-2 px-3 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-800 rounded-md transition-colors"
          >
            <Plus size={18} className="mr-2" />
            <span>Create New Task</span>
          </button>
          
          <button 
            onClick={handleStartPomodoro}
            className="w-full py-2 px-3 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md transition-colors"
          >
            <Timer size={18} className="mr-2" />
            <span>Start Pomodoro</span>
          </button>
          
          <button 
            onClick={handleViewReports}
            className="w-full py-2 px-3 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
          >
            <BarChart size={18} className="mr-2" />
            <span>View Reports</span>
          </button>
        </div>
        
        {/* Calendar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={handlePrevMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>
            <h3 className="text-sm font-medium">
              {format(selectedDate, 'MMMM yyyy')}
            </h3>
            <button 
              onClick={handleNextMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const isCurrentMonth = isSameMonth(day, selectedDate);
              const isToday = isCurrentMonth && isSameDay(day, today);
              const isSelected = isCurrentMonth && isSameDay(day, selectedDate);
              
              return (
                <button
                  key={i}
                  onClick={() => handleDateSelect(day)}
                  className={`
                    h-8 w-8 text-xs rounded-full flex items-center justify-center
                    ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                    ${isToday ? 'border border-blue-500' : ''}
                    ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Selected date info */}
        {selectedDate && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
            <p className="font-medium">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              No tasks scheduled
            </p>
          </div>
        )}
      </div>
    </DashboardWidget>
  );
}

export default QuickActionsWidget;
