"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { upsertSurveyResponse, getSurveyResponse } from '../../utils/surveyResponses';
import { supabase } from '../../utils/supabaseClient';
import intakeSurveySchema from './intake-survey-questions.json';
import { useRouter } from 'next/navigation';

// Helper: debounce
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const SurveyPage = () => {
  // Stepper state
  const questionKeys = Object.keys(intakeSurveySchema.properties);
  
  // Reorder question keys to ensure follow-up questions come after their parent questions
  const orderedQuestionKeys = questionKeys.reduce((acc: string[], key: string) => {
    if (key === 'otherActivityPreferences' || key === 'otherEquipmentAccess') {
      // These will be handled dynamically based on selection
      return acc;
    } else {
      acc.push(key);
      return acc;
    }
  }, []);
  const totalQuestions = orderedQuestionKeys.length;
  const [currentStep, setCurrentStep] = useState(0);

  // ...existing state
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Helper for pain question logic
  const currentPainKey = 'currentPain';

  // Load user and prefill data (unchanged)
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

  // Handle form changes
  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    // Check if we need to show follow-up questions when specific fields change
    if (field === 'activityPreferences') {
      setShowOtherActivityPreferences(Array.isArray(value) && value.includes('Other'));
    } else if (field === 'equipmentAccess') {
      setShowOtherEquipmentAccess(Array.isArray(value) && value.includes('Other'));
    }
  };

  // Validation for a single question
  const validateQuestion = (key: string, value: any, schema: any): string | null => {
    // Required check
    if (intakeSurveySchema.required.includes(key)) {
      if (value === undefined || value === null || value === "") {
        return "This field is required.";
      }
      if (schema.type === 'array' && Array.isArray(value) && value.length === 0) {
        return "This field is required.";
      }
      if (schema.type === 'object' && key === 'currentPain' && value.hasPain === undefined) {
        return "This field is required.";
      }
    }
    // Enum check
    if (schema.enum && value && !schema.enum.includes(value)) {
      return "Invalid selection.";
    }
    // Type check (basic)
    if (schema.type === 'integer' && value !== undefined && value !== null && value !== "") {
      if (isNaN(Number(value))) {
        return "Must be a number.";
      }
      // Special integer check for importance and confidence
      if ((key === 'importance' || key === 'confidence')) {
        const num = Number(value);
        if (!Number.isInteger(num) || num < 0 || num > 10) {
          return "Please enter an integer from 0 to 10.";
        }
      }
    }
    return null;
  };

  // Track validation errors
  const [validationError, setValidationError] = useState<string | null>(null);

  // Stepper navigation with validation
  const goNext = () => {
    const key = orderedQuestionKeys[currentStep];
    const schema = intakeSurveySchema.properties[key];
    const error = validateQuestion(key, formData[key], schema);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError(null);
    if (currentStep < totalQuestions - 1) setCurrentStep(currentStep + 1);
  };
  const goPrev = () => {
    setValidationError(null);
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // Validate all required fields on submit
  const validateAll = () => {
    for (const key of intakeSurveySchema.required) {
      const schema = intakeSurveySchema.properties[key];
      const error = validateQuestion(key, formData[key], schema);
      if (error) {
        return { key, error };
      }
    }
    return null;
  };

  // Submission state
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Handle final submission
  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(false);
    const validation = validateAll();
    if (validation) {
      setValidationError(`Please complete all required fields. (${validation.key}: ${validation.error})`);
      return;
    }
    setValidationError(null);
    if (!userId) {
      setSubmitError('User not authenticated.');
      return;
    }
    // Clean data
    const cleanData = Object.fromEntries(Object.entries(formData).filter(([_, v]) => v !== undefined && v !== null && v !== ""));
    try {
      const { error } = await upsertSurveyResponse(userId, cleanData);
      if (error) {
        setSubmitError('Failed to save survey. Please try again.');
        return;
      }
      setSubmitSuccess(true);
      // Redirect to results after a short delay
      setTimeout(() => router.push('/survey/results'), 1000);
    } catch (err) {
      setSubmitError('An unexpected error occurred.');
    }
  };


  // Custom label mapping
  const customLabels: Record<string, string> = {
    daysPerWeek: 'Days per week',
    minutesPerSession: 'Minutes per session',
    preferredTimeOfDay: 'Preferred time of day'
  };

  // Track keys that need follow-up questions
  const [showOtherActivityPreferences, setShowOtherActivityPreferences] = useState(false);
  const [showOtherEquipmentAccess, setShowOtherEquipmentAccess] = useState(false);

  // Check if we need to show follow-up questions when formData changes
  useEffect(() => {
    // Check if 'Other' is selected in activityPreferences
    setShowOtherActivityPreferences(
      Array.isArray(formData.activityPreferences) && 
      formData.activityPreferences.includes('Other')
    );
    
    // Check if 'Other' is selected in equipmentAccess
    setShowOtherEquipmentAccess(
      Array.isArray(formData.equipmentAccess) && 
      formData.equipmentAccess.includes('Other')
    );
  }, [formData.activityPreferences, formData.equipmentAccess]);

  // Render field for stepper
  const renderQuestion = (key: string, schema: any) => {
    // Handle follow-up questions for 'Other' selections
    if (key === 'otherActivityPreferences' && !showOtherActivityPreferences) {
      // Skip this question if 'Other' is not selected
      goNext();
      return null;
    }

    if (key === 'otherEquipmentAccess' && !showOtherEquipmentAccess) {
      // Skip this question if 'Other' is not selected
      goNext();
      return null;
    }

    // --- Pain Question Special Handling ---
    if (key === currentPainKey) {
      const hasPain = formData[currentPainKey]?.hasPain;
      // Show main pain question as Yes/No radio
      return (
        <div key={key} className="mb-4">
          <label className="font-semibold">Do you currently experience pain or injury that limits your physical activity?</label>
          <div className="flex gap-4 mt-2">
            {['Yes', 'No'].map((option) => (
              <label key={option} className="mr-4">
                <input
                  type="radio"
                  name="currentPain.hasPain"
                  value={option}
                  checked={hasPain === (option === 'Yes')}
                  required={true}
                  onChange={e => {
                    const newVal = e.target.value === 'Yes';
                    // If switching to No, clear description
                    handleChange(currentPainKey, { hasPain: newVal, description: newVal ? formData[currentPainKey]?.description || '' : '' });
                  }}
                />{' '}{option}
              </label>
            ))}
          </div>
          {/* Show description only if Yes */}
          {hasPain && (
            <div className="mt-4">
              <label className="font-semibold" htmlFor="currentPain.description">Describe the pain</label>
              <input
                type="text"
                id="currentPain.description"
                name="currentPain.description"
                value={formData[currentPainKey]?.description || ''}
                onChange={e => handleChange(currentPainKey, { hasPain: true, description: e.target.value })}
                className="border rounded px-2 py-1 w-full mt-1"
              />
            </div>
          )}
        </div>
      );
    }

    // Radio buttons for Yes/No questions
    if (["medicalClearance", "tobaccoUse"].includes(key) && schema.enum && schema.enum.length === 2) {
      return (
        <div key={key} className="mb-4">
          <label className="font-semibold">{schema.title}</label>
          <div className="flex gap-4 mt-2">
            {schema.enum.map((option: string) => (
              <label key={option} className="mr-4">
                <input
                  type="radio"
                  name={key}
                  value={option}
                  checked={formData[key] === option}
                  required={intakeSurveySchema.required.includes(key)}
                  onChange={e => handleChange(key, e.target.value)}
                />{' '}{option}
              </label>
            ))}
          </div>
        </div>
      );
    }

    // Radio buttons for intentToChange (Yes/No/Not sure)
    if (key === "intentToChange" && schema.enum) {
      return (
        <div key={key} className="mb-4">
          <label className="font-semibold">{schema.title}</label>
          <div className="flex gap-4 mt-2">
            {schema.enum.map((option: string) => (
              <label key={option} className="mr-4">
                <input
                  type="radio"
                  name={key}
                  value={option}
                  checked={formData[key] === option}
                  required={intakeSurveySchema.required.includes(key)}
                  onChange={e => handleChange(key, e.target.value)}
                />{' '}{option}
              </label>
            ))}
          </div>
        </div>
      );
    }

    // Dropdowns for specified fields
    if (["activityFrequency", "physicalFunction", "sleep", "primaryGoal"].includes(key) && schema.enum) {
      return (
        <div key={key} className="mb-4">
          <label className="font-semibold">{schema.title}</label>
          <select
            name={key}
            value={formData[key] ?? ''}
            required={intakeSurveySchema.required.includes(key)}
            className="border rounded px-2 py-1 w-full mt-1"
            onChange={e => handleChange(key, e.target.value)}
          >
            <option value="" disabled>Select...</option>
            {schema.enum.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      );
    }

    // Number input (with custom label if present)
    if (schema.type === 'integer') {
      // Only apply special logic for importance and confidence
      const isScaleQuestion = key === 'importance' || key === 'confidence';
      return (
        <div key={key} className="mb-4">
          <label className="font-semibold">{customLabels[key] || schema.title}</label>
          <input
            type="number"
            name={key}
            min={isScaleQuestion ? 0 : schema.minimum}
            max={isScaleQuestion ? 10 : schema.maximum}
            step={1}
            value={formData[key] ?? ''}
            required={intakeSurveySchema.required.includes(key)}
            className="border rounded px-2 py-1 w-full"
            onChange={e => {
              // Always store as number or empty string
              const val = e.target.value === '' ? '' : Number(e.target.value);
              handleChange(key, val);
            }}
            onBlur={e => {
              // If it's a scale question, validate integer
              if (isScaleQuestion && e.target.value !== '') {
                const num = Number(e.target.value);
                if (!Number.isInteger(num) || num < 0 || num > 10) {
                  setValidationError('Please enter an integer from 0 to 10.');
                } else {
                  setValidationError(null);
                }
              }
            }}
          />
          {/* Show validation error for scale questions only */}
          {isScaleQuestion && validationError && (
            <div className="text-red-600 text-sm mt-1">{validationError}</div>
          )}
        </div>
      );
    }  

    // Multi-select checkboxes
    if (schema.type === 'array' && schema.items && schema.items.enum) {
      return (
        <div key={key} className="mb-4">
          <label className="font-semibold">{schema.title}</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {schema.items.enum.map((option: string) => (
              <label key={option} className="mr-4">
                <input
                  type="checkbox"
                  name={key}
                  value={option}
                  checked={Array.isArray(formData[key]) && formData[key].includes(option)}
                  onChange={e => {
                    let arr = Array.isArray(formData[key]) ? [...formData[key]] : [];
                    if (e.target.checked) arr.push(option);
                    else arr = arr.filter((v: string) => v !== option);
                    handleChange(key, arr);
                  }}
                />{' '}{option}
              </label>
            ))}
          </div>
        </div>
      );
    }

    // Nested object (timeCommitment)
    if (schema.type === 'object' && key === 'timeCommitment') {
      const tc = formData[key] || {};
      return (
        <fieldset key={key} className="mb-4 border p-3 rounded">
          <legend className="font-semibold">{schema.title}</legend>
          <div className="mb-2">
            <label className="block font-semibold">Days per week</label>
            <input
              type="number"
              min={schema.properties.daysPerWeek.minimum}
              max={schema.properties.daysPerWeek.maximum}
              value={tc.daysPerWeek ?? ''}
              required={schema.required?.includes('daysPerWeek')}
              className="border rounded px-2 py-1 w-24"
              onChange={e => handleChange(key, { ...tc, daysPerWeek: Number(e.target.value) })}
            />
          </div>
          <div className="mb-2">
            <label className="block font-semibold">Minutes per session</label>
            <input
              type="number"
              min={schema.properties.minutesPerSession.minimum}
              value={tc.minutesPerSession ?? ''}
              required={schema.required?.includes('minutesPerSession')}
              className="border rounded px-2 py-1 w-32"
              onChange={e => handleChange(key, { ...tc, minutesPerSession: Number(e.target.value) })}
            />
          </div>
          <div className="mb-2">
            <label className="block font-semibold">Preferred time of day</label>
            <select
              value={tc.preferredTimeOfDay ?? ''}
              required={schema.required?.includes('preferredTimeOfDay')}
              className="border rounded px-2 py-1 w-full"
              onChange={e => handleChange(key, { ...tc, preferredTimeOfDay: e.target.value })}
            >
              <option value="" disabled>Select...</option>
              {schema.properties.preferredTimeOfDay.enum.map((option: string) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </fieldset>
      );
    }

    // Default: text input
    return (
      <div key={key} className="mb-4">
        <label className="font-semibold">{schema.title || key}</label>
        <input
          type="text"
          name={key}
          value={formData[key] ?? ''}
          required={intakeSurveySchema.required.includes(key)}
          className="border rounded px-2 py-1 w-full"
          onChange={e => handleChange(key, e.target.value)}
        />
      </div>
  );
}

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Intake Survey</h1>
      
      {/* Validation error */}
      {validationError && (
        <div className="mb-4 text-red-600 font-semibold">{validationError}</div>
      )}
      {/* Submission error/success */}
      {submitError && (
        <div className="mb-4 text-red-600 font-semibold">{submitError}</div>
      )}
      {submitSuccess && (
        <div className="mb-4 text-green-700 font-semibold">Survey saved! Redirecting...</div>
      )}

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span>Question {currentStep + 1} of {totalQuestions}</span>
          <span>{Math.round(((currentStep + 1) / totalQuestions) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Current question */}
      {renderQuestion(orderedQuestionKeys[currentStep], intakeSurveySchema.properties[orderedQuestionKeys[currentStep] as keyof typeof intakeSurveySchema.properties])}
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button 
          onClick={goPrev} 
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        {currentStep === totalQuestions - 1 ? (
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Finish
          </button>
        ) : (
          <button 
            onClick={goNext}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default SurveyPage;
