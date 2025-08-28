import React, { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import OnboardingProgress from './components/OnboardingProgress';
import IntakeSurvey from './components/IntakeSurvey';
import SummaryReview from './components/SummaryReview';
import ExerciseProgram from './components/ExerciseProgram';
import CalendarView from './components/CalendarView';
import Navigation from './components/Navigation';
export function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <IntakeSurvey selectedExercises={selectedExercises} setSelectedExercises={setSelectedExercises} onNext={handleNext} />;
      case 2:
        return <SummaryReview selectedExercises={selectedExercises} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <ExerciseProgram onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <CalendarView onComplete={() => setCompleted(true)} onBack={handleBack} />;
      default:
        return null;
    }
  };
  return <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        {!completed ? <>
            <OnboardingProgress currentStep={currentStep} />
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              {renderStep()}
            </div>
          </> : <>
            <Navigation />
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to Kinisi!
              </h2>
              <p className="text-gray-600">
                Your personalized exercise program is ready. Use the navigation
                above to explore your plan.
              </p>
            </div>
          </>}
      </div>
    </div>;
}