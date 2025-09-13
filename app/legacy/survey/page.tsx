"use client";
import React, { useEffect, useState } from 'react';
import { upsertSurveyResponse, getSurveyResponse } from '@/utils/surveyResponses';
import { supabase } from '@/utils/supabaseClient';
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
  
  const isQuestionAnswered = (q: Question): boolean => {
    const getVal = (key: string) => formData[key as keyof typeof formData];
    const val = getVal(q.key);

    const nonEmptyString = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
    const validNumber = (v: unknown) => typeof v === 'number' && !Number.isNaN(v);
    const nonEmptyArray = (v: unknown) => Array.isArray(v) && v.length > 0;

    switch (q.type) {
      case 'text':
        return nonEmptyString(val);
      case 'radio':
      case 'select':
        return typeof val === 'string' && val !== '';
      case 'multiselect':
        return nonEmptyArray(val);
      case 'number':
        return validNumber(val);
      case 'group': {
        const group = formData[q.key];
        if (!group || typeof group !== 'object' || Array.isArray(group)) return false;
        const obj = group as Record<string, unknown>;
        return (q.fields || []).every(f => {
          if (!f.required) return true;
          const fv = obj[f.key];
          if (f.type === 'text') return nonEmptyString(fv);
          if (f.type === 'number') return validNumber(fv);
          if (f.type === 'multiselect') return nonEmptyArray(fv);
          if (f.type === 'radio' || f.type === 'select') return typeof fv === 'string' && fv !== '';
          return !!fv;
        });
      }
      default:
        return !!val;
    }
  };
  
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
    
    const isZeroToTenScale = (q: Question) => {
      const t = q.title || '';
      return /0\s*[–-]\s*10/.test(t) || (typeof q.min === 'number' && typeof q.max === 'number' && q.min === 0 && q.max === 10);
    };

    switch (question.type) {
      case 'radio':
        return (
          <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options?.map(option => {
              const selected = value === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleChangeFn(option.value)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition ${selected ? 'border-[var(--brand-puce)] ring-2 ring-[var(--brand-puce)] bg-[var(--brand-puce)]/10' : 'border-gray-300 hover:border-gray-400'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-block h-4 w-4 rounded-full border ${selected ? 'bg-[var(--brand-puce)] border-[var(--brand-puce)]' : 'border-gray-400'}`} />
                    <span className="font-medium">{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      
      case 'select':
        return (
          <div role="listbox" aria-label={question.title} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options?.map(option => {
              const selected = value === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleChangeFn(option.value)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition ${selected ? 'border-[var(--brand-puce)] ring-2 ring-[var(--brand-puce)] bg-[var(--brand-puce)]/10' : 'border-gray-300 hover:border-gray-400'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`inline-block h-4 w-4 rounded-full border ${selected ? 'bg-[var(--brand-puce)] border-[var(--brand-puce)]' : 'border-gray-400'}`} />
                    <span className="font-medium">{option.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        );
      
      case 'multiselect':
        const selectedValues = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="flex flex-wrap gap-2">
            {question.options?.map(option => {
              const selected = selectedValues.includes(option.value);
              return (
                <button
                  type="button"
                  key={option.value}
                  aria-pressed={selected}
                  onClick={() => {
                    const newValue = selected
                      ? selectedValues.filter(v => v !== option.value)
                      : [...selectedValues, option.value];
                    handleChangeFn(newValue);
                  }}
                  className={`px-3 py-1.5 rounded-full border text-sm transition ${selected ? 'bg-[var(--brand-puce)] text-white border-[var(--brand-puce)]' : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        );
      
      case 'number':
        {
          const numVal = typeof value === 'number' ? value : (value === '' ? '' : Number(value));
          if (isZeroToTenScale(question)) {
          const v = typeof numVal === 'number' && !isNaN(numVal) ? numVal : 0;
          return (
            <div>
              <div className="mb-2 text-sm text-gray-600 flex items-center gap-2">
                <span className="text-gray-500">Selected:</span>
                <span className="font-semibold text-gray-900" data-testid="scale-selected-value">{v}</span>
              </div>
              <div className="grid grid-cols-11 gap-1 sm:gap-2" role="group" aria-label="0 to 10 scale" data-testid="scale-0-10">
                {Array.from({ length: 11 }).map((_, i) => {
                  const selected = v === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="button"
                      aria-pressed={selected}
                      onClick={() => handleChangeFn(i)}
                      className={`h-10 sm:h-12 rounded-md border text-sm font-medium transition ${selected
                        ? 'bg-[var(--brand-puce)] text-white border-[var(--brand-puce)]'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-gray-400'}`}
                      data-testid={`scale-box-${i}`}
                    >
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
  
          const v = typeof numVal === 'number' && !isNaN(numVal) ? numVal : (question.min ?? 0);
          const decrement = () => handleChangeFn(Math.max((question.min ?? Number.NEGATIVE_INFINITY), v - 1));
          const increment = () => handleChangeFn(Math.min((question.max ?? Number.POSITIVE_INFINITY), v + 1));
          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decrement}
                className="h-10 w-10 rounded-lg border border-gray-300 hover:border-gray-400"
                aria-label="Decrease"
              >
                −
              </button>
              <input
                type="number"
                value={v}
                onChange={(e) => handleChangeFn(Number(e.target.value))}
                className="w-24 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-puce)]"
                min={question.min}
                max={question.max}
                required={question.required}
              />
              <button
                type="button"
                onClick={increment}
                className="h-10 w-10 rounded-lg border border-gray-300 hover:border-gray-400"
                aria-label="Increase"
              >
                +
              </button>
            </div>
          );
        }
      
      case 'text':
        {
          const str = typeof value === 'string' ? value : '';
          const count = str.length;
          return (
            <div>
              <textarea
                value={str}
                onChange={(e) => handleChangeFn(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand-puce)]"
                rows={4}
                required={question.required}
              />
              <div className="mt-1 text-xs text-gray-500">{count} characters</div>
            </div>
          );
        }
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500" role="status" aria-live="polite">
        Loading...
      </div>
    );
  }

  return (
    <div className="aura-hero min-h-screen">
      <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Intake Survey</h1>
        <div className="w-full progress-outer rounded-full h-2.5">
          <div 
            className="progress-inner h-2.5 rounded-full" 
            style={{ width: `${visibleQuestions.length ? ((currentQuestionIndex + 1) / visibleQuestions.length) * 100 : 0}%` }}
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
            className={`px-4 py-2 rounded ${currentQuestionIndex === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Previous
          </button>
          
          {!isLastQuestion ? (
            <button
              type="button"
              onClick={handleNext}
              className={`btn-primary ${(currentQuestion.required && !isQuestionAnswered(currentQuestion)) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={currentQuestion.required && !isQuestionAnswered(currentQuestion)}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || (currentQuestion.required && !isQuestionAnswered(currentQuestion))}
              className={`btn-primary ${(submitting || (currentQuestion.required && !isQuestionAnswered(currentQuestion))) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Submitting...' : 'Submit Survey'}
            </button>
          )}
        </div>
      </div>
    </div>
    </div>
  );
};

export default SurveyPage;
