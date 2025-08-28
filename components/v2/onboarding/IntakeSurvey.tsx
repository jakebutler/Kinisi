import React, { useState } from 'react';
import Button from '../ui/Button';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface IntakeSurveyProps {
  onNext: (surveyData: any) => void;
}

const IntakeSurvey: React.FC<IntakeSurveyProps> = ({ onNext }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Survey state based on comprehensive schema
  const [primaryGoal, setPrimaryGoal] = useState<string>('');
  const [medicalClearance, setMedicalClearance] = useState<string>('');
  const [currentPain, setCurrentPain] = useState({ hasPain: null as boolean | null, description: '' });
  const [activityFrequency, setActivityFrequency] = useState<string>('');
  const [physicalFunction, setPhysicalFunction] = useState<string>('');
  const [intentToChange, setIntentToChange] = useState<string>('');
  const [importance, setImportance] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [sleep, setSleep] = useState<string>('');
  const [tobaccoUse, setTobaccoUse] = useState<string>('');
  const [activityPreferences, setActivityPreferences] = useState<string[]>([]);
  const [otherActivityPreferences, setOtherActivityPreferences] = useState<string>('');
  const [equipmentAccess, setEquipmentAccess] = useState<string[]>([]);
  const [otherEquipmentAccess, setOtherEquipmentAccess] = useState<string>('');
  const [timeCommitment, setTimeCommitment] = useState({
    daysPerWeek: null as number | null,
    minutesPerSession: '',
    preferredTimeOfDay: ''
  });

  // Options arrays
  const primaryGoalOptions = ['Improve health', 'Lose weight', 'Gain strength', 'Reduce pain', 'Feel better/energized', 'Other'];
  const activityFrequencyOptions = ['0', '1–2', '3–4', '5–7'];
  const physicalFunctionOptions = ['Excellent', 'Good', 'Fair', 'Poor'];
  const intentToChangeOptions = ['Yes', 'No', 'Not sure'];
  const sleepOptions = ['Less than 5', '5–6', '7–8', 'More than 8'];
  const activityPreferencesOptions = ['Walking/hiking', 'Strength training', 'Yoga/stretching', 'Group classes', 'Sports', 'Cycling', 'Swimming', 'Home workouts', 'Other'];
  const equipmentAccessOptions = ['None / Bodyweight only', 'Dumbbells or resistance bands', 'Gym with machines/weights', 'Cardio equipment', 'Outdoor space', 'Pool', 'Other'];
  const preferredTimeOptions = ['Morning', 'Afternoon', 'Evening', 'Flexible'];

  const questions = [
    {
      id: 'primaryGoal',
      title: 'What is your top goal for being physically active?',
      isValid: () => primaryGoal !== ''
    },
    {
      id: 'medicalClearance',
      title: 'Have you ever been told by a doctor that you should not exercise because of a medical condition?',
      isValid: () => medicalClearance !== ''
    },
    {
      id: 'currentPain',
      title: 'Do you currently experience pain or injury that limits your physical activity?',
      isValid: () => typeof currentPain.hasPain === 'boolean' && (!currentPain.hasPain || currentPain.description.trim() !== '')
    },
    {
      id: 'activityFrequency',
      title: 'On average, how many days per week do you do 30+ minutes of moderate-to-vigorous physical activity?',
      isValid: () => activityFrequency !== ''
    },
    {
      id: 'physicalFunction',
      title: 'How would you rate your overall physical function?',
      isValid: () => physicalFunction !== ''
    },
    {
      id: 'intentToChange',
      title: 'Do you intend to increase your physical activity in the next 30 days?',
      isValid: () => intentToChange !== ''
    },
    {
      id: 'importance',
      title: 'On a scale of 0–10, how important is it for you to become more physically active?',
      isValid: () => importance !== null
    },
    {
      id: 'confidence',
      title: 'On a scale of 0–10, how confident are you in your ability to follow an exercise plan?',
      isValid: () => confidence !== null
    },
    {
      id: 'sleep',
      title: 'How many hours of sleep do you usually get per night?',
      isValid: () => sleep !== ''
    },
    {
      id: 'tobaccoUse',
      title: 'Do you currently smoke or use tobacco?',
      isValid: () => tobaccoUse !== ''
    },
    {
      id: 'activityPreferences',
      title: 'What types of physical activity do you enjoy or want to include in your routine?',
      subtitle: 'Select all that apply',
      isValid: () => activityPreferences.length > 0
    },
    {
      id: 'equipmentAccess',
      title: 'What equipment or facilities do you have access to?',
      subtitle: 'Select all that apply',
      isValid: () => equipmentAccess.length > 0
    },
    {
      id: 'timeCommitment',
      title: 'How much time can you realistically commit to physical activity each week?',
      isValid: () => timeCommitment.daysPerWeek !== null && 
                   timeCommitment.minutesPerSession !== '' && 
                   parseInt(timeCommitment.minutesPerSession) >= 5 && 
                   parseInt(timeCommitment.minutesPerSession) <= 180 &&
                   timeCommitment.preferredTimeOfDay !== ''
    }
  ];

  const toggleActivityPreference = (preference: string) => {
    if (activityPreferences.includes(preference)) {
      const newPreferences = activityPreferences.filter(p => p !== preference);
      setActivityPreferences(newPreferences);
      // Clear other text if "Other" is deselected
      if (preference === 'Other') {
        setOtherActivityPreferences('');
      }
    } else {
      setActivityPreferences([...activityPreferences, preference]);
    }
  };

  const toggleEquipmentAccess = (equipment: string) => {
    if (equipmentAccess.includes(equipment)) {
      const newEquipment = equipmentAccess.filter(e => e !== equipment);
      setEquipmentAccess(newEquipment);
      // Clear other text if "Other" is deselected
      if (equipment === 'Other') {
        setOtherEquipmentAccess('');
      }
    } else {
      setEquipmentAccess([...equipmentAccess, equipment]);
    }
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value === '' || (parseInt(value) >= 5 && parseInt(value) <= 180)) {
      setTimeCommitment({ ...timeCommitment, minutesPerSession: value });
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Submit survey data
      const surveyData = {
        primaryGoal,
        medicalClearance,
        currentPain,
        activityFrequency,
        physicalFunction,
        intentToChange,
        importance,
        confidence,
        sleep,
        tobaccoUse,
        activityPreferences,
        otherActivityPreferences: otherActivityPreferences.slice(0, 1000),
        equipmentAccess,
        otherEquipmentAccess: otherEquipmentAccess.slice(0, 1000),
        timeCommitment
      };
      onNext(surveyData);
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
      case 'primaryGoal':
        return (
          <div className="space-y-3">
            {primaryGoalOptions.map((goal, index) => (
              <button
                key={index}
                onClick={() => setPrimaryGoal(goal)}
                className={`w-full text-left p-4 rounded-lg border ${
                  primaryGoal === goal
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-200 flex justify-between items-center`}
              >
                <span className="font-medium">{goal}</span>
                {primaryGoal === goal && (
                  <span className="bg-blue-500 text-white rounded-full p-1">
                    <Check size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>
        );

      case 'medicalClearance':
        return (
          <div className="space-y-3">
            {['Yes', 'No'].map((option, index) => (
              <button
                key={index}
                onClick={() => setMedicalClearance(option)}
                className={`w-full text-left p-4 rounded-lg border ${
                  medicalClearance === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-200 flex justify-between items-center`}
              >
                <span className="font-medium">{option}</span>
                {medicalClearance === option && (
                  <span className="bg-blue-500 text-white rounded-full p-1">
                    <Check size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>
        );

      case 'currentPain':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {[true, false].map((hasPainValue) => (
                <button
                  key={hasPainValue.toString()}
                  onClick={() => setCurrentPain({ ...currentPain, hasPain: hasPainValue, description: hasPainValue ? currentPain.description : '' })}
                  className={`w-full text-left p-4 rounded-lg border ${
                    currentPain.hasPain === hasPainValue
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200 flex justify-between items-center`}
                >
                  <span className="font-medium">{hasPainValue ? 'Yes' : 'No'}</span>
                  {currentPain.hasPain === hasPainValue && (
                    <span className="bg-blue-500 text-white rounded-full p-1">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {currentPain.hasPain && (
              <textarea
                value={currentPain.description}
                onChange={e => setCurrentPain({ ...currentPain, description: e.target.value.slice(0, 1000) })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                rows={4}
                placeholder="Please describe your pain or injury..."
                maxLength={1000}
              />
            )}
          </div>
        );

      case 'activityFrequency':
        return (
          <div className="space-y-3">
            {activityFrequencyOptions.map((frequency, index) => (
              <button
                key={index}
                onClick={() => setActivityFrequency(frequency)}
                className={`w-full text-left p-4 rounded-lg border ${
                  activityFrequency === frequency
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-200 flex justify-between items-center`}
              >
                <span className="font-medium">{frequency} days</span>
                {activityFrequency === frequency && (
                  <span className="bg-blue-500 text-white rounded-full p-1">
                    <Check size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>
        );

      case 'physicalFunction':
        return (
          <div className="space-y-3">
            {physicalFunctionOptions.map((func, index) => (
              <button
                key={index}
                onClick={() => setPhysicalFunction(func)}
                className={`w-full text-left p-4 rounded-lg border ${
                  physicalFunction === func
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-200 flex justify-between items-center`}
              >
                <span className="font-medium">{func}</span>
                {physicalFunction === func && (
                  <span className="bg-blue-500 text-white rounded-full p-1">
                    <Check size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>
        );

      case 'intentToChange':
        return (
          <div className="space-y-3">
            {intentToChangeOptions.map((intent, index) => (
              <button
                key={index}
                onClick={() => setIntentToChange(intent)}
                className={`w-full text-left p-4 rounded-lg border ${
                  intentToChange === intent
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-200 flex justify-between items-center`}
              >
                <span className="font-medium">{intent}</span>
                {intentToChange === intent && (
                  <span className="bg-blue-500 text-white rounded-full p-1">
                    <Check size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>
        );

      case 'importance':
        return (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Not important</span>
              <span className="text-sm text-gray-500">Very important</span>
            </div>
            <div className="flex justify-between mt-2 mb-2">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setImportance(i)}
                  className={`w-12 h-12 flex items-center justify-center ${
                    importance === i
                      ? 'bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-all duration-200`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        );

      case 'confidence':
        return (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Not confident</span>
              <span className="text-sm text-gray-500">Very confident</span>
            </div>
            <div className="flex justify-between mt-2 mb-2">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setConfidence(i)}
                  className={`w-12 h-12 flex items-center justify-center ${
                    confidence === i
                      ? 'bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition-all duration-200`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        );

      case 'sleep':
        return (
          <div className="space-y-3">
            {sleepOptions.map((sleepHours, index) => (
              <button
                key={index}
                onClick={() => setSleep(sleepHours)}
                className={`w-full text-left p-4 rounded-lg border ${
                  sleep === sleepHours
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-200 flex justify-between items-center`}
              >
                <span className="font-medium">{sleepHours} hours</span>
                {sleep === sleepHours && (
                  <span className="bg-blue-500 text-white rounded-full p-1">
                    <Check size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>
        );

      case 'tobaccoUse':
        return (
          <div className="space-y-3">
            {['Yes', 'No'].map((option, index) => (
              <button
                key={index}
                onClick={() => setTobaccoUse(option)}
                className={`w-full text-left p-4 rounded-lg border ${
                  tobaccoUse === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-200 flex justify-between items-center`}
              >
                <span className="font-medium">{option}</span>
                {tobaccoUse === option && (
                  <span className="bg-blue-500 text-white rounded-full p-1">
                    <Check size={16} />
                  </span>
                )}
              </button>
            ))}
          </div>
        );

      case 'activityPreferences':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {activityPreferencesOptions.map((preference, index) => (
                <button
                  key={index}
                  onClick={() => toggleActivityPreference(preference)}
                  className={`w-full text-left p-4 rounded-lg border ${
                    activityPreferences.includes(preference)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200 flex justify-between items-center`}
                >
                  <span className="font-medium">{preference}</span>
                  {activityPreferences.includes(preference) && (
                    <span className="bg-blue-500 text-white rounded-full p-1">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {activityPreferences.includes('Other') && (
              <textarea
                value={otherActivityPreferences}
                onChange={e => setOtherActivityPreferences(e.target.value.slice(0, 1000))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                rows={3}
                placeholder="Please specify other activities..."
                maxLength={1000}
              />
            )}
          </div>
        );

      case 'equipmentAccess':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {equipmentAccessOptions.map((equipment, index) => (
                <button
                  key={index}
                  onClick={() => toggleEquipmentAccess(equipment)}
                  className={`w-full text-left p-4 rounded-lg border ${
                    equipmentAccess.includes(equipment)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200 flex justify-between items-center`}
                >
                  <span className="font-medium">{equipment}</span>
                  {equipmentAccess.includes(equipment) && (
                    <span className="bg-blue-500 text-white rounded-full p-1">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {equipmentAccess.includes('Other') && (
              <textarea
                value={otherEquipmentAccess}
                onChange={e => setOtherEquipmentAccess(e.target.value.slice(0, 1000))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                rows={3}
                placeholder="Please specify other equipment..."
                maxLength={1000}
              />
            )}
          </div>
        );

      case 'timeCommitment':
        return (
          <div className="space-y-6">
            {/* Days per week */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Days per week:</h4>
              <div className="flex justify-between">
                {Array.from({ length: 8 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setTimeCommitment({ ...timeCommitment, daysPerWeek: i })}
                    className={`w-12 h-12 flex items-center justify-center ${
                      timeCommitment.daysPerWeek === i
                        ? 'bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } transition-all duration-200 rounded`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes per session */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Minutes per session:</h4>
              <input
                type="text"
                value={timeCommitment.minutesPerSession}
                onChange={handleMinutesChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter minutes (5-180)"
              />
              <p className="text-sm text-gray-500 mt-1">Valid range: 5-180 minutes</p>
            </div>

            {/* Preferred time of day */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Preferred time of day:</h4>
              <div className="space-y-3">
                {preferredTimeOptions.map((timeOption, index) => (
                  <button
                    key={index}
                    onClick={() => setTimeCommitment({ ...timeCommitment, preferredTimeOfDay: timeOption })}
                    className={`w-full text-left p-4 rounded-lg border ${
                      timeCommitment.preferredTimeOfDay === timeOption
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } transition-all duration-200 flex justify-between items-center`}
                  >
                    <span className="font-medium">{timeOption}</span>
                    {timeCommitment.preferredTimeOfDay === timeOption && (
                      <span className="bg-blue-500 text-white rounded-full p-1">
                        <Check size={16} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Intake Survey</h2>
      
      {/* Progress indicator */}
      <div className="mb-6 flex items-center">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-[rgb(204,136,153)] via-[rgb(170,152,169)] to-[rgb(251,206,177)] h-2 rounded-full"
            style={{
              width: `${(currentQuestionIndex + 1) / questions.length * 100}%`
            }}
          />
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
        {currentQuestion.subtitle && (
          <p className="text-sm text-gray-500 mb-4">
            {currentQuestion.subtitle}
          </p>
        )}
        {renderQuestionContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="flex items-center"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <Button
          onClick={goToNextQuestion}
          disabled={!isCurrentQuestionValid}
          className="flex items-center"
        >
          {isLastQuestion ? 'Complete' : 'Continue'}
          {!isLastQuestion && <ArrowRight size={16} className="ml-2" />}
        </Button>
      </div>
    </div>
  );
};

export default IntakeSurvey;
