import React, { useState } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Button from '../ui/Button';
import { ExerciseProgram } from '@/lib/v2/types';

interface CalendarViewProps {
  program: ExerciseProgram;
  onComplete: (startDate: string) => void;
  onBack: () => void;
  loading?: boolean;
}

interface ProgramSession {
  id: string;
  type: string;
  day: number;
  color: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  program,
  onComplete,
  onBack,
  loading = false
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days for the current month view
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(year, month, day);
    setStartDate(selected.toISOString().split('T')[0]);
  };

  const isDateSelected = (day: number) => {
    if (!startDate) return false;
    const dateObj = new Date(startDate);
    return dateObj.getFullYear() === year && 
           dateObj.getMonth() === month && 
           dateObj.getDate() === day;
  };

  const handleComplete = () => {
    if (startDate) {
      onComplete(startDate);
    }
  };

  // Generate mock program sessions based on the program structure
  const generateProgramSessions = (): ProgramSession[] => {
    const sessions: ProgramSession[] = [];
    const colors = ['blue', 'green', 'purple', 'orange'];
    
    if (program.weeks && program.weeks.length > 0) {
      const firstWeek = program.weeks[0];
      firstWeek.sessions.forEach((session, index) => {
        // Schedule sessions every 3-4 days starting from day 3
        const sessionDays = [3, 6, 10, 13, 17, 20, 24, 27];
        sessionDays.forEach((day, dayIndex) => {
          if (dayIndex % firstWeek.sessions.length === index) {
            sessions.push({
              id: `${session.id}-${dayIndex}`,
              type: session.name,
              day: day,
              color: colors[index % colors.length]
            });
          }
        });
      });
    }
    
    return sessions;
  };

  const programSessions = generateProgramSessions();

  const getSessionForDay = (day: number) => {
    return programSessions.find(session => session.day === day);
  };

  const getColorClass = (color: string, type: 'bg' | 'text') => {
    const colorMap = {
      blue: type === 'bg' ? 'bg-blue-50' : 'text-blue-600',
      green: type === 'bg' ? 'bg-green-50' : 'text-green-600',
      purple: type === 'bg' ? 'bg-purple-50' : 'text-purple-600',
      orange: type === 'bg' ? 'bg-orange-50' : 'text-orange-600',
    };
    return colorMap[color as keyof typeof colorMap] || '';
  };

  const getSessionColor = (color: string) => {
    const colorMap = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f97316',
    };
    return colorMap[color as keyof typeof colorMap] || '#3b82f6';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Schedule Your Program
      </h2>

      <div className="mb-6">
        <label className="block text-gray-700 mb-2">
          Select a start date for your program:
        </label>
        <div className="flex items-center">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--brand-puce)] focus:border-[var(--brand-puce)]"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded-full hover:bg-gray-200"
            disabled={loading}
          >
            <ChevronLeftIcon size={20} />
          </button>
          <h3 className="font-medium">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded-full hover:bg-gray-200"
            disabled={loading}
          >
            <ChevronRightIcon size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center border-b border-gray-200">
          {daysOfWeek.map((day, index) => (
            <div key={index} className="py-2 text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 text-center">
          {/* Empty cells for days before the first of the month */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="py-3"></div>
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const session = getSessionForDay(day);
            const isSelected = isDateSelected(day);
            const isPastDate = new Date(year, month, day) < new Date(new Date().setHours(0, 0, 0, 0));
            
            return (
              <div
                key={day}
                className={`py-3 px-1 relative cursor-pointer hover:bg-gray-50 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-[var(--brand-puce)] to-[var(--brand-apricot)] text-white' 
                    : session 
                    ? getColorClass(session.color, 'bg')
                    : ''
                } ${isPastDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isPastDate && handleDateSelect(day)}
              >
                <span className={`text-sm ${isSelected ? 'font-bold text-white' : ''}`}>
                  {day}
                </span>
                {session && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: getSessionColor(session.color) }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {startDate && (
        <div className="mb-6">
          <h3 className="font-medium mb-3">Program Schedule Preview</h3>
          <p className="text-gray-600 mb-4">
            Your {program.weeks?.length || 0}-week program will start on{' '}
            <strong>{new Date(startDate).toLocaleDateString()}</strong>
          </p>
          
          {program.weeks && program.weeks.length > 0 && (
            <div className="flex flex-col space-y-2">
              {program.weeks[0].sessions.map((session, index) => {
                const colors = ['blue', 'green', 'purple', 'orange'];
                const color = colors[index % colors.length];
                return (
                  <div key={session.id} className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getSessionColor(color) }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {session.name}: {session.goal}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button 
          onClick={handleComplete} 
          disabled={!startDate || loading}
        >
          {loading ? 'Creating Program...' : 'Create My Fitness Program'}
        </Button>
      </div>
    </div>
  );
};

export default CalendarView;
