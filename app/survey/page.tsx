"use client";
import React, { useEffect, useState } from 'react';
import { upsertSurveyResponse, getSurveyResponse } from '../../utils/surveyResponses';
import { supabase } from '../../utils/supabaseClient';
import { useRouter } from 'next/navigation';

type Question = {
  key: string;
  title: string;
  type: 'radio' | 'select' | 'number' | 'text' | 'multiselect' | 'group';
  options?: { label: string; value: string }[];
  required?: boolean;
  min?: number;
  max?: number;
  showFollowUp?: (value: unknown) => boolean;
  followUp?: Omit<Question, 'isFollowUp'>;
  isFollowUp?: boolean;
  fields?: Question[];
};

const questions: Question[] = [
  {
    key: 'medicalClearance',
    title: 'Have you ever been told by a doctor that you should not exercise because of a medical condition?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
    required: true
  },
  {
    key: 'currentPain',
    title: 'Do you currently experience pain or injury that limits your physical activity?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
    required: true,
    showFollowUp: (value: unknown) => value === 'Yes',
    followUp: {
      key: 'painDescription',
      title: 'Please describe your pain or injury:',
      type: 'text',
      required: true
    }
  },
  {
    key: 'painDescription',
    title: 'Please describe your pain or injury:',
    type: 'text',
    required: false,
    isFollowUp: true
  },
  {
    key: 'activityFrequency',
    title: 'On average, how many days per week do you do 30+ minutes of moderate-to-vigorous physical activity?',
    type: 'select',
    options: [
      { label: '0', value: '0' },
      { label: '1-2', value: '1-2' },
      { label: '3-4', value: '3-4' },
      { label: '5-7', value: '5-7' },
    ],
    required: true
  },
  {
    key: 'physicalFunction',
    title: 'How would you rate your overall physical function?',
    type: 'select',
    options: [
      { label: 'Excellent', value: 'Excellent' },
      { label: 'Good', value: 'Good' },
      { label: 'Fair', value: 'Fair' },
      { label: 'Poor', value: 'Poor' },
    ],
    required: true
  },
  {
    key: 'intentToChange',
    title: 'Do you intend to increase your physical activity in the next 30 days?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
      { label: 'Not sure', value: 'Not sure' },
    ],
    required: true
  },
  {
    key: 'importance',
    title: 'On a scale of 0–10, how important is it for you to become more physically active?',
    type: 'number',
    required: true
  },
  {
    key: 'confidence',
    title: 'On a scale of 0–10, how confident are you in your ability to follow an exercise plan?',
    type: 'number',
    required: true
  },
  {
    key: 'sleep',
    title: 'How many hours of sleep do you usually get per night?',
    type: 'select',
    options: [
      { label: 'Less than 5', value: 'Less than 5' },
      { label: '5-6', value: '5-6' },
      { label: '7-8', value: '7-8' },
      { label: 'More than 8', value: 'More than 8' },
    ],
    required: true
  },
  {
    key: 'tobaccoUse',
    title: 'Do you currently smoke or use tobacco?',
    type: 'radio',
    options: [
      { label: 'Yes', value: 'Yes' },
      { label: 'No', value: 'No' },
    ],
    required: true
  },
  {
    key: 'primaryGoal',
    title: 'What is your top goal for being physically active?',
    type: 'select',
    options: [
      { label: 'Improve health', value: 'Improve health' },
      { label: 'Lose weight', value: 'Lose weight' },
      { label: 'Gain strength', value: 'Gain strength' },
      { label: 'Reduce pain', value: 'Reduce pain' },
      { label: 'Feel better/energized', value: 'Feel better/energized' },
      { label: 'Other', value: 'Other' },
    ],
    required: true
  },
  {
    key: 'activityPreferences',
    title: 'What types of physical activity do you enjoy or want to include in your routine? (Select all that apply)',
    type: 'multiselect',
    options: [
      { label: 'Walking/hiking', value: 'Walking/hiking' },
      { label: 'Strength training', value: 'Strength training' },
      { label: 'Yoga/stretching', value: 'Yoga/stretching' },
      { label: 'Group classes', value: 'Group classes' },
      { label: 'Sports', value: 'Sports' },
      { label: 'Cycling', value: 'Cycling' },
      { label: 'Swimming', value: 'Swimming' },
      { label: 'Home workouts', value: 'Home workouts' },
      { label: 'Other', value: 'Other' },
    ],
    required: true
  },
  {
    key: 'otherActivityPreferences',
    title: 'Please specify other activities you enjoy',
    type: 'text',
    required: false
  },
  {
    key: 'equipmentAccess',
    title: 'What equipment or facilities do you have access to? (Select all that apply)',
    type: 'multiselect',
    options: [
      { label: 'None / Bodyweight only', value: 'None / Bodyweight only' },
      { label: 'Dumbbells or resistance bands', value: 'Dumbbells or resistance bands' },
      { label: 'Gym with machines/weights', value: 'Gym with machines/weights' },
      { label: 'Cardio equipment', value: 'Cardio equipment' },
      { label: 'Outdoor space', value: 'Outdoor space' },
      { label: 'Pool', value: 'Pool' },
      { label: 'Other', value: 'Other' },
    ],
    required: true
  },
  {
    key: 'otherEquipmentAccess',
    title: 'Please specify other equipment or facilities you have access to',
    type: 'text',
    required: false
  },
  {
    key: 'timeCommitment',
    title: 'How much time can you realistically commit to physical activity each week?',
    type: 'group',
    fields: [
      {
        key: 'daysPerWeek',
        title: 'Days per week',
        type: 'number',
        min: 1,
        max: 7,
        required: true
      },
      {
        key: 'minutesPerSession',
        title: 'Minutes per session',
        type: 'number',
        min: 5,
        max: 240,
        required: true
      },
      {
        key: 'preferredTimeOfDay',
        title: 'Preferred time of day',
        type: 'select',
        options: [
          { label: 'Morning', value: 'Morning' },
          { label: 'Afternoon', value: 'Afternoon' },
          { label: 'Evening', value: 'Evening' },
          { label: 'Flexible', value: 'Flexible' }
        ],
        required: true
      }
    ]
  }
];

const SurveyPage = () => {
  const [formData, setFormData] = useState<Record<string, unknown | Record<string, unknown>>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [visibleQuestions, setVisibleQuestions] = useState<Question[]>([]);
  const router = useRouter();
  
  // Filter out follow-up questions that aren't needed
  useEffect(() => {
    const filteredQuestions: Question[] = [];
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Skip follow-up questions, we'll handle them separately
      if (q.isFollowUp) continue;
      
      filteredQuestions.push(q);
      
      // Check if this question has a follow-up that should be shown
      if (q.showFollowUp && q.followUp) {
        const response = formData[q.key];
        if (q.showFollowUp(response)) {
          filteredQuestions.push({
            ...q.followUp,
            isFollowUp: true,
            key: `${q.key}_${q.followUp.key}`
          });
        }
      }
    }
    
    setVisibleQuestions(filteredQuestions);
  }, [formData]);
  
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === visibleQuestions.length - 1;

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);
      const { data } = await getSurveyResponse(user.id);
      if (data && data.length > 0 && data[0].response) {
        setFormData(data[0].response);
      }
      setLoading(false);
    };
    fetchUserAndData();
  }, [router]);

  const handleChange = (value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [currentQuestion.key]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    let currentUserId = userId;
    
    if (!currentUserId) {
      // Double-check auth state before redirecting
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      currentUserId = user.id;
      setUserId(user.id);
    }
    
    setSubmitting(true);
    try {
      await upsertSurveyResponse(currentUserId, formData);
      // Redirect to dashboard after successful survey completion
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('There was an error submitting your survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderInput = (question = currentQuestion, groupKey?: string) => {
    const getValue = (key: string) => {
      if (groupKey) {
        const group = formData[groupKey];
        if (group && typeof group === 'object' && group !== null && !Array.isArray(group)) {
          return (group as Record<string, unknown>)[key] ?? '';
        }
        return '';
      }
      return formData[question.key] ?? '';
    };
    
    const handleGroupChange = (key: string, value: unknown) => {
      setFormData(prev => ({
        ...prev,
        [groupKey!]: {
          ...(prev[groupKey!] || {}),
          [key]: value
        }
      }));
    };
    
    const value = getValue(question.key);
    const handleChangeFn = groupKey 
      ? (val: unknown) => handleGroupChange(question.key, val)
      : handleChange;
    
    // Handle group question type
    if (question.type === 'group' && !groupKey) {
      return (
        <div className="space-y-4">
          {question.fields?.map((field) => (
            <div key={field.key} className="mb-4">
              <label className="block font-medium mb-2">{field.title}</label>
              {renderInput(field, question.key)}
            </div>
          ))}
        </div>
      );
    }
    
    switch (question.type) {
      case 'radio':
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.key}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => handleChangeFn(option.value)}
                  className="h-4 w-4 text-blue-600"
                  required={question.required}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );
      
      case 'select':
        return (
          <select
            value={typeof value === 'string' || typeof value === 'number' ? value : ''}
            onChange={(e) => handleChangeFn(e.target.value)}
            className="w-full p-2 border rounded"
            required={question.required}
          >
            <option value="">Select an option</option>
            {question.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {question.options?.map(option => (
              <label key={option.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value);
                    handleChangeFn(newValue);
                  }}
                  className="h-4 w-4 text-blue-600"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={typeof value === 'number' ? value : value === '' ? '' : Number(value) || ''}
            onChange={(e) => handleChangeFn(Number(e.target.value))}
            className="w-full p-2 border rounded"
            min={question.min}
            max={question.max}
            required={question.required}
          />
        );
      
      case 'text':
        return (
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => handleChangeFn(e.target.value)}
            className="w-full p-2 border rounded"
            rows={3}
            required={question.required}
          />
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Intake Survey</h1>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Question {currentQuestionIndex + 1} of {visibleQuestions.length}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">{currentQuestion.title}</h2>
        
        <div className="mb-8 space-y-4">
          {currentQuestion.type === 'group' ? (
            currentQuestion.fields?.map((field) => (
              <div key={field.key} className="mb-4">
                <label className="block font-medium mb-2">{field.title}</label>
                {renderInput(field, currentQuestion.key)}
              </div>
            ))
          ) : (
            renderInput()
          )}
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 rounded ${currentQuestionIndex === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
          >
            Previous
          </button>
          
          {!isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              disabled={!formData[currentQuestion.key] && currentQuestion.required}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || (currentQuestion.required && !formData[currentQuestion.key])}
              className={`px-6 py-2 rounded ${(submitting || (currentQuestion.required && !formData[currentQuestion.key])) 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              {submitting ? 'Submitting...' : 'Submit Survey'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;
