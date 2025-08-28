import React, { useState } from 'react';
import Button from './Button';
import { CheckIcon, ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
interface IntakeSurveyProps {
  selectedExercises: string[];
  setSelectedExercises: React.Dispatch<React.SetStateAction<string[]>>;
  onNext: () => void;
}
const IntakeSurvey: React.FC<IntakeSurveyProps> = ({
  selectedExercises,
  setSelectedExercises,
  onNext
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [injuries, setInjuries] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState<number | null>(null);
  const [activityLikelihood, setActivityLikelihood] = useState<string>('');
  const exerciseOptions = ['Bodyweight only', 'Yoga / Pilates', 'Running', 'Strength training', 'Swimming'];
  const likelihoodOptions = ['Very likely', 'Somewhat likely', 'Maybe', 'Not very likely', 'I will not increase my physical activity'];
  const questions = [{
    id: 'exercises',
    title: 'What kind of exercises do you enjoy?',
    subtitle: 'Select all that apply',
    isValid: () => selectedExercises.length > 0
  }, {
    id: 'injuries',
    title: 'List any injuries or other physical considerations we should take into account.',
    isValid: () => true // Optional field
  }, {
    id: 'duration',
    title: 'How long can you commit to exercising each session? (minutes)',
    isValid: () => sessionDuration !== ''
  }, {
    id: 'confidence',
    title: 'How confident are you in your ability to stick to a fitness program?',
    isValid: () => confidenceLevel !== null
  }, {
    id: 'likelihood',
    title: 'How likely are you to increase your physical activity in the next 2 weeks?',
    isValid: () => activityLikelihood !== ''
  }];
  const toggleExercise = (exercise: string) => {
    if (selectedExercises.includes(exercise)) {
      setSelectedExercises(selectedExercises.filter(ex => ex !== exercise));
    } else {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow up to 3 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setSessionDuration(value);
  };
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onNext();
    }
  };
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isCurrentQuestionValid = currentQuestion.isValid();
  const renderQuestionContent = () => {
    switch (currentQuestion.id) {
      case 'exercises':
        return <div className="space-y-3">
            {exerciseOptions.map((exercise, index) => <button key={index} onClick={() => toggleExercise(exercise)} className={`w-full text-left p-4 rounded-lg border ${selectedExercises.includes(exercise) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'} transition-all duration-200 flex justify-between items-center`}>
                <span className="font-medium">{exercise}</span>
                {selectedExercises.includes(exercise) && <span className="bg-blue-500 text-white rounded-full p-1">
                    <CheckIcon size={16} />
                  </span>}
              </button>)}
          </div>;
      case 'injuries':
        return <textarea value={injuries} onChange={e => setInjuries(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" rows={4} placeholder="E.g., knee injury, lower back pain, etc." />;
      case 'duration':
        return <input type="text" value={sessionDuration} onChange={handleDurationChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" placeholder="Enter minutes (e.g., 30)" />;
      case 'confidence':
        return <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">
                Not at all confident
              </span>
              <span className="text-sm text-gray-500">Extremely confident</span>
            </div>
            <div className="flex justify-between mt-2 mb-2">
              {Array.from({
              length: 11
            }, (_, i) => <button key={i} onClick={() => setConfidenceLevel(i)} className={`w-12 h-12 flex items-center justify-center ${confidenceLevel === i ? 'bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all duration-200`}>
                    {i}
                  </button>)}
            </div>
          </div>;
      case 'likelihood':
        return <div className="space-y-3">
            {likelihoodOptions.map((option, index) => <button key={index} onClick={() => setActivityLikelihood(option)} className={`w-full text-left p-4 rounded-lg border ${activityLikelihood === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'} transition-all duration-200 flex justify-between items-center`}>
                <span className="font-medium">{option}</span>
                {activityLikelihood === option && <span className="bg-blue-500 text-white rounded-full p-1">
                    <CheckIcon size={16} />
                  </span>}
              </button>)}
          </div>;
      default:
        return null;
    }
  };
  return <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Intake Survey</h2>
      {/* Progress indicator */}
      <div className="mb-6 flex items-center">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)] h-2 rounded-full" style={{
          width: `${(currentQuestionIndex + 1) / questions.length * 100}%`
        }}></div>
        </div>
        <span className="ml-3 text-sm text-gray-500">
          {currentQuestionIndex + 1}/{questions.length}
        </span>
      </div>
      {/* Question */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          {currentQuestion.title}
        </h3>
        {currentQuestion.subtitle && <p className="text-sm text-gray-500 mb-4">
            {currentQuestion.subtitle}
          </p>}
        {renderQuestionContent()}
      </div>
      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0} className="flex items-center">
          <ArrowLeftIcon size={16} className="mr-2" />
          Back
        </Button>
        <Button onClick={goToNextQuestion} disabled={!isCurrentQuestionValid} className="flex items-center">
          {isLastQuestion ? 'Complete' : 'Continue'}
          {!isLastQuestion && <ArrowRightIcon size={16} className="ml-2" />}
        </Button>
      </div>
    </div>;
};
export default IntakeSurvey;