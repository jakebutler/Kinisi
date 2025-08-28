import React from 'react';
import { CheckIcon } from 'lucide-react';
interface OnboardingProgressProps {
  currentStep: number;
}
const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep
}) => {
  const steps = ['Intake Survey', 'Review Summary', 'Exercise Program', 'Calendar'];
  return <div className="w-full" style={{
    fontFamily: 'Nunito, "Nunito Fallback", sans-serif'
  }}>
      <div className="flex justify-between items-center relative px-6">
        {/* Horizontal line that spans across all steps */}
        <div className="absolute top-4 left-6 right-6 h-[2px] bg-gray-200"></div>
        {/* Colored line segments for completed steps */}
        {Array.from({
        length: steps.length - 1
      }).map((_, index) => {
        const isCompleted = index + 1 < currentStep;
        const segmentWidth = `calc(100% / ${steps.length - 1})`;
        return <div key={`line-${index}`} className={`absolute top-4 h-[2px] ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`} style={{
          left: `calc(${index * segmentWidth} + 6px + 16px)`,
          width: `calc(${segmentWidth} - 32px)`
        }}></div>;
      })}
        {/* Step circles */}
        {steps.map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        return <div key={`step-${index}`} className="z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'border-2 border-blue-500 bg-white text-blue-500' : 'bg-gray-200 text-gray-500'}`}>
                {isCompleted ? <CheckIcon size={16} /> : <span className="text-sm font-medium">{stepNumber}</span>}
              </div>
            </div>;
      })}
      </div>
    </div>;
};
export default OnboardingProgress;