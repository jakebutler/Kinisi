import React, { useState } from 'react';
import Button from './Button';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
interface CalendarViewProps {
  onComplete: () => void;
  onBack: () => void;
}
const CalendarView: React.FC<CalendarViewProps> = ({
  onComplete,
  onBack
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
    return dateObj.getFullYear() === year && dateObj.getMonth() === month && dateObj.getDate() === day;
  };
  const handleComplete = () => {
    if (startDate) {
      onComplete();
    }
  };
  // Mock program sessions that would be scheduled
  const programSessions = [{
    id: 1,
    type: 'Session 1',
    day: 3,
    color: 'blue'
  }, {
    id: 2,
    type: 'Session 2',
    day: 5,
    color: 'green'
  }, {
    id: 3,
    type: 'Session 1',
    day: 10,
    color: 'blue'
  }, {
    id: 4,
    type: 'Session 2',
    day: 12,
    color: 'green'
  }, {
    id: 5,
    type: 'Session 1',
    day: 17,
    color: 'blue'
  }, {
    id: 6,
    type: 'Session 2',
    day: 19,
    color: 'green'
  }, {
    id: 7,
    type: 'Session 1',
    day: 24,
    color: 'blue'
  }, {
    id: 8,
    type: 'Session 2',
    day: 26,
    color: 'green'
  }];
  const getSessionForDay = (day: number) => {
    return programSessions.find(session => session.day === day);
  };
  return <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Schedule Your Program
      </h2>
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">
          Select a start date for your program:
        </label>
        <div className="flex items-center">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <button onClick={handlePrevMonth} className="p-1 rounded-full hover:bg-gray-200">
            <ChevronLeftIcon size={20} />
          </button>
          <h3 className="font-medium">
            {monthNames[month]} {year}
          </h3>
          <button onClick={handleNextMonth} className="p-1 rounded-full hover:bg-gray-200">
            <ChevronRightIcon size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center border-b border-gray-200">
          {daysOfWeek.map((day, index) => <div key={index} className="py-2 text-xs font-medium text-gray-500">
              {day}
            </div>)}
        </div>
        <div className="grid grid-cols-7 text-center">
          {/* Empty cells for days before the first of the month */}
          {Array.from({
          length: firstDayOfMonth
        }).map((_, index) => <div key={`empty-${index}`} className="py-3"></div>)}
          {/* Calendar days */}
          {Array.from({
          length: daysInMonth
        }, (_, i) => i + 1).map(day => {
          const session = getSessionForDay(day);
          const isSelected = isDateSelected(day);
          return <div key={day} className={`py-3 px-1 relative cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : session ? `bg-${session.color}-50` : ''}`} onClick={() => handleDateSelect(day)}>
                <span className={`text-sm ${isSelected ? 'font-bold text-blue-600' : ''}`}>
                  {day}
                </span>
                {session && <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className={`w-1 h-1 bg-${session.color}-500 rounded-full`} style={{
                backgroundColor: session.color === 'blue' ? '#3b82f6' : '#10b981'
              }}></div>
                  </div>}
              </div>;
        })}
        </div>
      </div>
      {startDate && <div className="mb-6">
          <h3 className="font-medium mb-3">Program Schedule Preview</h3>
          <p className="text-gray-600 mb-2">
            Your 8-week program will start on{' '}
            <strong>{new Date(startDate).toLocaleDateString()}</strong>
          </p>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">
                Session 1: Upper Body & Core (Monday)
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">
                Session 2: Lower Body & Cardio (Wednesday)
              </span>
            </div>
          </div>
        </div>}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleComplete} disabled={!startDate}>
          Create my fitness program
        </Button>
      </div>
    </div>;
};
export default CalendarView;