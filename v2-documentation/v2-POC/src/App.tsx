import React, { useState } from 'react';
import Header from './components/Header';
import OnboardingProgress from './components/OnboardingProgress';
import IntakeSurvey from './components/IntakeSurvey';
import PersonalizedAssessment from './components/PersonalizedAssessment';
import ExerciseProgram from './components/ExerciseProgram';
import CalendarView from './components/CalendarView';
import Navigation from './components/Navigation';
export function App() {
  const [userStatus, setUserStatus] = useState<'onboarding' | 'active'>('onboarding');
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState('program');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      setUserStatus('active');
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const renderOnboardingStep = () => {
    switch (currentStep) {
      case 1:
        return <IntakeSurvey selectedExercises={selectedExercises} setSelectedExercises={setSelectedExercises} onNext={handleNext} />;
      case 2:
        return <PersonalizedAssessment onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <ExerciseProgram onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <CalendarView onComplete={() => setUserStatus('active')} onBack={handleBack} />;
      default:
        return null;
    }
  };
  const renderActiveUserContent = () => {
    switch (activeTab) {
      case 'program':
        return <div className="mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <ExerciseProgram onNext={() => {}} onBack={() => {}} isActive={true} />
            </div>
          </div>;
      case 'assessment':
        return <div className="mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <PersonalizedAssessment onNext={() => {}} onBack={() => {}} isActive={true} />
            </div>
          </div>;
      case 'survey':
        return <div className="mt-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <IntakeSurvey selectedExercises={selectedExercises} setSelectedExercises={setSelectedExercises} onNext={() => {}} />
            </div>
          </div>;
      default:
        return null;
    }
  };
  return <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header username="JohnDoe" />
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-3xl">
          {userStatus === 'onboarding' ? <>
              <OnboardingProgress currentStep={currentStep} />
              <div className="mt-4 bg-white rounded-lg shadow-md p-6">
                {renderOnboardingStep()}
              </div>
            </> : <>
              <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
              {renderActiveUserContent()}
            </>}
        </div>
      </div>
    </div>;
}