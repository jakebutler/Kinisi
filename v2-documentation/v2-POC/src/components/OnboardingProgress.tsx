import React from 'react';
import { CheckIcon } from 'lucide-react';
interface OnboardingProgressProps {
  currentStep: number;
}
const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep
}) => {
  const steps = ['Intake Survey', 'Personalized Assessment', 'Exercise Program', 'Schedule'];
  return <div className="w-full py-6" style={{
    fontFamily: 'Nunito, "Nunito Fallback", sans-serif'
  }}>
      <div className="flex justify-between items-center relative px-6">
        {/* Horizontal line that spans across all steps - adjusted to not extend past circles */}
        <div className="absolute top-4 left-[22px] right-[22px] h-[2px] bg-gray-200"></div>
        {/* Colored line segments for completed steps */}
        {Array.from({
        length: steps.length - 1
      }).map((_, index) => {
        const isCompleted = index + 1 < currentStep;
        const segmentWidth = `calc(100% / ${steps.length - 1})`;
        return <div key={`line-${index}`} className={`absolute top-4 h-[2px] ${isCompleted ? 'bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)]' : 'bg-gray-200'}`} style={{
          left: `calc(${index * segmentWidth} + 6px + 16px)`,
          width: `calc(${segmentWidth} - 32px)`
        }}></div>;
      })}
        {/* Step circles */}
        {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        return <div key={`step-${index}`} className="z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)] text-white' : isCurrent ? 'border-2 border-[rgb(204,136,153)] bg-white text-[rgb(204,136,153)]' : 'bg-gray-200 text-gray-500'}`}>
                {isCompleted ? <CheckIcon size={16} /> : <span className="text-sm font-medium">{stepNumber}</span>}
              </div>
            </div>;
      })}
      </div>
    </div>;
};
export default OnboardingProgress;