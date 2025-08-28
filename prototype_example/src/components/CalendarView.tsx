import React from 'react';
import Button from './Button';
import { CalendarIcon } from 'lucide-react';
interface CalendarViewProps {
  onComplete: () => void;
  onBack: () => void;
}
const CalendarView: React.FC<CalendarViewProps> = ({
  onComplete,
  onBack
}) => {
  return <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Your Exercise Schedule
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium">May 2023</h3>
        </div>
        <div className="grid grid-cols-7 text-center border-b border-gray-200">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={index} className="py-2 text-xs font-medium text-gray-500">
              {day}
            </div>)}
        </div>
        <div className="grid grid-cols-7 text-center">
          {Array.from({
          length: 31
        }, (_, i) => i + 1).map(date => <div key={date} className={`py-3 relative ${[3, 5, 10, 12, 17, 19, 24, 26].includes(date) ? 'bg-blue-50' : ''}`}>
              <span className="text-sm">{date}</span>
              {[3, 10, 17, 24].includes(date) && <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                </div>}
              {[5, 12, 19, 26].includes(date) && <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                </div>}
            </div>)}
        </div>
      </div>
      <div className="flex flex-col space-y-2 mb-6">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Session 1</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Session 2</span>
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Edit
        </Button>
        <Button onClick={onComplete}>Approve</Button>
      </div>
    </div>;
};
export default CalendarView;