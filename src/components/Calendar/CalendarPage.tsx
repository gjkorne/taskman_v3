import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  startOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  addMonths 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useTaskData } from '../../contexts/task';
import { TaskFormModal } from '../TaskForm/TaskFormModal';
import DailyView from './DailyView';
import { useCalendarData } from '../../hooks/useCalendarData';

/**
 * CalendarPage component
 * Displays tasks in a calendar view with options for monthly or daily views
 */
export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
  
  // Get tasks from context
  const { tasks } = useTaskData();
  
  // Group tasks by due date for efficient lookup
  const { tasksByDate } = useCalendarData(tasks);
  
  // Handle day selection
  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    
    // If in month view, switch to day view when clicking a date
    if (viewMode === 'month') {
      setViewMode('day');
    }
  };
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Open task creation modal with pre-selected date
  const openTaskModal = (date: Date) => {
    setSelectedDate(date);
    setIsTaskModalOpen(true);
  };
  
  // Toggle between month and day views
  const toggleViewMode = (mode: 'month' | 'day') => {
    setViewMode(mode);
  };
  
  // Render header with month navigation
  const renderHeader = () => {
    return (
      <div className="flex flex-col space-y-3 mb-3 sm:mb-4">
        {/* Month/Date and navigation */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
            {viewMode === 'month' 
              ? format(currentMonth, 'MMMM yyyy')
              : format(selectedDate, 'MMM d, yyyy')}
          </h2>
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => viewMode === 'month' ? prevMonth() : setSelectedDate(prev => new Date(prev.setDate(prev.getDate() - 1)))}
              className="p-1 sm:p-2 border border-gray-300 rounded-md hover:bg-gray-100 touch-manipulation"
              aria-label={viewMode === 'month' ? "Previous month" : "Previous day"}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button
              onClick={() => viewMode === 'month' ? setCurrentMonth(new Date()) : setSelectedDate(new Date())}
              className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-xs sm:text-sm whitespace-nowrap touch-manipulation"
            >
              Today
            </button>
            <button
              onClick={() => viewMode === 'month' ? nextMonth() : setSelectedDate(prev => new Date(prev.setDate(prev.getDate() + 1)))}
              className="p-1 sm:p-2 border border-gray-300 rounded-md hover:bg-gray-100 touch-manipulation"
              aria-label={viewMode === 'month' ? "Next month" : "Next day"}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* View mode toggle and new task button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex w-full sm:w-auto justify-between sm:justify-start">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => toggleViewMode('month')}
                className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-l-md border text-sm transition-colors ${
                  viewMode === 'month' 
                    ? 'bg-blue-500 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } touch-manipulation`}
                aria-label="Month view"
              >
                <CalendarIcon className="w-4 h-4" />
                <span>Month</span>
              </button>
              
              <button
                onClick={() => toggleViewMode('day')}
                className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-r-md border text-sm transition-colors ${
                  viewMode === 'day' 
                    ? 'bg-blue-500 text-white border-blue-600' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } touch-manipulation`}
                aria-label="Day view"
              >
                <Clock className="w-4 h-4" />
                <span>Day</span>
              </button>
            </div>
            
            <button
              onClick={() => openTaskModal(selectedDate)}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:hidden touch-manipulation"
              aria-label="Add new task"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => openTaskModal(selectedDate)}
            className="hidden sm:flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm touch-manipulation"
            aria-label="Add new task"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>
    );
  };
  
  // Render days of week header
  const renderDays = () => {
    const days = [];
    const start = startOfWeek(currentMonth);
    
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="font-medium text-center text-gray-600 text-xs py-2">
          {format(addDays(start, i), 'EEEEE')}
          <span className="hidden sm:inline">{format(addDays(start, i), 'EEE').slice(1)}</span>
        </div>
      );
    }
    
    return <div className="grid grid-cols-7">{days}</div>;
  };
  
  // Render calendar cells
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6);
    
    const rows = [];
    let days = [];
    let day = startDate;
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dateKey = format(day, 'yyyy-MM-dd');
        const tasksForDay = tasksByDate[dateKey] || [];
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDate = isSameDay(day, new Date());
        
        days.push(
          <div
            key={dateKey}
            onClick={() => handleDateClick(day)}
            className={`
              relative min-h-[55px] sm:min-h-[100px] border border-gray-200 p-1 cursor-pointer 
              hover:bg-blue-50 flex flex-col
              ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
              ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}
              ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
            `}
          >
            <div className="flex justify-between items-start">
              <span className={`
                inline-flex justify-center items-center 
                ${isTodayDate ? 'font-bold h-5 w-5 rounded-full bg-blue-500 text-white' : 'font-medium text-gray-700'}
                text-xs
              `}>
                {format(day, 'd')}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openTaskModal(day);
                }}
                className="text-blue-600 hover:bg-blue-100 rounded-full p-1 touch-manipulation"
                title="Add task"
                aria-label="Add task for this day"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
            
            <div className="mt-1 space-y-1 overflow-y-auto max-h-[30px] sm:max-h-[70px] flex-grow">
              {tasksForDay.length > 0 ? (
                tasksForDay.map((task, index) => (
                  // Only show first two tasks on mobile to avoid overflow
                  (index < 2 || window.innerWidth > 640) ? (
                    <div
                      key={task.id}
                      className={`text-xs p-1 rounded truncate ${
                        getPriorityClass(task.priority)
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ) : index === 2 ? (
                    // Show "more" indicator if there are additional tasks
                    <div key="more" className="text-xs p-1 text-gray-500 text-center">
                      +{tasksForDay.length - 2} more
                    </div>
                  ) : null
                ))
              ) : (
                <div className="hidden sm:block text-xs text-gray-400 italic p-1">No tasks</div>
              )}
            </div>
          </div>
        );
        
        day = new Date(day.setDate(day.getDate() + 1));
      }
      
      rows.push(
        <div key={format(day, 'yyyy-MM-dd')} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    
    return <div className="space-y-1">{rows}</div>;
  };
  
  // Helper to determine styling based on task priority
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="max-w-full sm:max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
      <div className="bg-white rounded-lg shadow-sm p-2 sm:p-4">
        {renderHeader()}
        
        {viewMode === 'month' ? (
          <div className="overflow-hidden rounded-md border border-gray-200">
            {renderDays()}
            {renderCells()}
          </div>
        ) : (
          <DailyView date={selectedDate} />
        )}
      </div>
      
      {isTaskModalOpen && (
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onTaskCreated={() => setIsTaskModalOpen(false)}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}

export default CalendarPage;
