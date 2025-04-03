import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useTaskContext } from '../../contexts/TaskContext';
import { TaskFormModal } from '../TaskForm/TaskFormModal';
import { Task } from '../../types/task';
import { DailyView } from './DailyView';

type CalendarViewMode = 'month' | 'day';

/**
 * CalendarPage component
 * Displays tasks in a calendar view with options for monthly or daily views
 */
export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  
  // Get tasks from context
  const { filteredTasks, refreshTasks } = useTaskContext();
  
  // Group tasks by due date for efficient lookup
  const tasksByDate = useMemo(() => {
    return filteredTasks.reduce((acc: Record<string, Task[]>, task: Task) => {
      if (task.due_date) {
        const dateKey = format(parseISO(task.due_date), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(task);
      }
      return acc;
    }, {});
  }, [filteredTasks]);
  
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
  const toggleViewMode = () => {
    setViewMode(viewMode === 'month' ? 'day' : 'month');
  };
  
  // Render header with month navigation
  const renderHeader = () => {
    return (
      <div className="flex flex-col space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {viewMode === 'month' 
              ? format(currentMonth, 'MMMM yyyy')
              : format(selectedDate, 'MMMM d, yyyy')}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => viewMode === 'month' ? setCurrentMonth(new Date()) : setSelectedDate(new Date())}
              className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-sm"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={toggleViewMode}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-md transition-colors ${
                viewMode === 'month' 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Month</span>
            </button>
            
            <button
              onClick={toggleViewMode}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-md transition-colors ${
                viewMode === 'day' 
                  ? 'bg-blue-500 text-white border-blue-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Day</span>
            </button>
          </div>
          
          <button
            onClick={() => openTaskModal(selectedDate)}
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
        <div key={i} className="font-semibold text-center text-gray-600 text-sm py-2">
          {format(addDays(start, i), 'EEE')}
        </div>
      );
    }
    
    return <div className="grid grid-cols-7">{days}</div>;
  };
  
  // Render calendar cells
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const rows = [];
    let days = [];
    let day = startDate;
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dateKey = format(day, 'yyyy-MM-dd');
        const tasksForDay = tasksByDate[dateKey] || [];
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        
        days.push(
          <div
            key={dateKey}
            onClick={() => handleDateClick(day)}
            className={`min-h-[100px] border border-gray-200 p-1 cursor-pointer hover:bg-blue-50 ${
              !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
            } ${isSameDay(day, new Date()) ? 'bg-blue-50 border-blue-200' : ''}
            ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openTaskModal(day);
                }}
                className="text-blue-600 hover:bg-blue-100 rounded-full p-1"
                title="Add task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
              {tasksForDay.map((task) => (
                <div
                  key={task.id}
                  className={`text-xs p-1 rounded truncate ${
                    getPriorityClass(task.priority)
                  }`}
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        );
        
        day = addDays(day, 1);
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
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        {renderHeader()}
        
        {viewMode === 'month' ? (
          <>
            {renderDays()}
            {renderCells()}
          </>
        ) : (
          <DailyView date={selectedDate} />
        )}
      </div>
      
      {isTaskModalOpen && (
        <TaskFormModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onTaskCreated={() => {
            setIsTaskModalOpen(false);
            refreshTasks();
          }}
          title="Add Task"
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}

export default CalendarPage;
