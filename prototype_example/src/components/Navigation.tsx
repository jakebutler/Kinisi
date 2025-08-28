import React from 'react';
const Navigation: React.FC = () => {
  return <div className="w-full flex justify-between items-center gap-3">
      <div className="bg-white rounded-lg shadow-md p-3 flex-1 text-center hover:shadow-lg transition-shadow">
        <button className="w-full h-full flex flex-col justify-center items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors" style={{
        fontFamily: 'Nunito, "Nunito Fallback", sans-serif'
      }}>
          <span>Intake</span>
          <span>Survey</span>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md p-3 flex-1 text-center hover:shadow-lg transition-shadow">
        <button className="w-full h-full flex flex-col justify-center items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors" style={{
        fontFamily: 'Nunito, "Nunito Fallback", sans-serif'
      }}>
          <span>Personalized</span>
          <span>Assessment</span>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md p-3 flex-1 text-center hover:shadow-lg transition-shadow">
        <button className="w-full h-full flex flex-col justify-center items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors" style={{
        fontFamily: 'Nunito, "Nunito Fallback", sans-serif'
      }}>
          <span>Exercise Program</span>
          <span>+ Schedule</span>
        </button>
      </div>
    </div>;
};
export default Navigation;