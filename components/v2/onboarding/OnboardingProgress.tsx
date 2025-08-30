import React from 'react';
import { Check } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: number;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep
}) => {
  const steps = [
    { label: 'Survey', fullLabel: 'Intake Survey' },
    { label: 'Assessment', fullLabel: 'Personalized Assessment' },
    { label: 'Program', fullLabel: 'Exercise Program' },
    { label: 'Schedule', fullLabel: 'Schedule' }
  ];

  return (
    <div className="w-full py-6" style={{
      fontFamily: 'Nunito, "Nunito Fallback", sans-serif'
    }}>
      <div className="flex justify-between items-center relative px-6">
        {/* Colored line segments for completed steps - positioned between circle centers */}
        {Array.from({
          length: steps.length - 1
        }).map((_, index) => {
          const isCompleted = index + 1 < currentStep;
          const totalSteps = steps.length;
          const containerWidth = `calc(100% - 48px)`; // Account for 24px padding on each side
          const stepSpacing = `calc(${containerWidth} / ${totalSteps - 1})`;
          
          return (
            <div 
              key={`line-${index}`} 
              className={`absolute top-4 h-[2px] ${
                isCompleted 
                  ? 'bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)]' 
                  : 'bg-gray-200'
              }`} 
              style={{
                left: `calc(24px + 16px + ${index} * ${stepSpacing})`,
                width: `calc(${stepSpacing} - 32px)`
              }}
            />
          );
        })}
        
        {/* Step circles */}
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={`step-${index}`} className="z-10 flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)] text-white' 
                    : isCurrent 
                      ? 'bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)] text-white' 
                      : 'bg-gray-200 text-gray-500'
                }`}
                data-testid={isCompleted ? 'completed-step' : isCurrent ? 'current-step' : 'inactive-step'}
              >
                {isCompleted ? (
                  <Check size={16} />
                ) : (
                  <span className="text-sm font-medium">{stepNumber}</span>
                )}
              </div>
              <span className="text-xs mt-2 text-gray-600 font-medium">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingProgress;
