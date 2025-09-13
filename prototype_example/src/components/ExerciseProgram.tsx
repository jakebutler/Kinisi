import React from 'react';
import Button from './Button';
interface ExerciseProgramProps {
  onNext: () => void;
  onBack: () => void;
}
const ExerciseProgram: React.FC<ExerciseProgramProps> = ({
  onNext,
  onBack
}) => {
  return <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Your Exercise Program
      </h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Week
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exercise
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Week 1
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Session 1
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Exercise 1
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Week 1
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Session 1
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Exercise 2
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Week 1
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Session 2
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                Exercise 1
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Continue</Button>
      </div>
    </div>;
};
export default ExerciseProgram;