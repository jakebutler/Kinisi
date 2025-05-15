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
      if (data && data.response) {
        setFormData(data.response);
      }
      setLoading(false);
    };
    fetchUserAndData();
  }, [router]);

  // Auto-save handler (debounced)
  const autoSave = useCallback(debounce(async (newData: any) => {
    if (!userId) return;
    setSaveStatus('saving');
    const { error } = await upsertSurveyResponse(userId, newData);
    setSaveStatus(error ? 'error' : 'saved');
  }, 1000), [userId]);

  // Handle form changes and auto-save after each question
  const handleChange = (field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    autoSave(newData);
    
    // Check if we need to show follow-up questions when specific fields change
    if (field === 'activityPreferences') {
      setShowOtherActivityPreferences(Array.isArray(value) && value.includes('Other'));
    } else if (field === 'equipmentAccess') {
      setShowOtherEquipmentAccess(Array.isArray(value) && value.includes('Other'));
    }
  };

  // Stepper navigation
  const goNext = () => {
    if (currentStep < totalQuestions - 1) setCurrentStep(currentStep + 1);
  };
  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
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
      const hasPain = formData[currentPainKey]?.hasPain ?? false;
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
                placeholder="Describe the pain"
              />
            </div>
          )}
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
      return (
        <div key={key} className="mb-4">
          <label className="font-semibold">{customLabels[key] || schema.title}</label>
          <input
            type="number"
            name={key}
            min={schema.minimum}
            max={schema.maximum}
            value={formData[key] ?? ''}
            required={intakeSurveySchema.required.includes(key)}
            className="border rounded px-2 py-1 w-24 ml-2"
            onChange={e => handleChange(key, Number(e.target.value))}
          />
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
        <button 
          onClick={goNext} 
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {currentStep === totalQuestions - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default SurveyPage;
