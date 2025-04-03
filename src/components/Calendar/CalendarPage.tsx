import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTaskContext } from '../../contexts/TaskContext';
import { TaskFormModal } from '../TaskForm/TaskFormModal';
import { Task } from '../../types/task';

/**
 * CalendarPage component
 * Displays tasks in a monthly calendar view based on their due dates
 */
export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
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
  
  // Render header with month navigation
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
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
        
        days.push(
          <div
            key={dateKey}
            className={`min-h-[100px] border border-gray-200 p-1 ${
              !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'
            } ${isSameDay(day, new Date()) ? 'bg-blue-50 border-blue-200' : ''}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              <button
                onClick={() => openTaskModal(day)}
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
        {renderDays()}
        {renderCells()}
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
