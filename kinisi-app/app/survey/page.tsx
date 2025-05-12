"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { upsertSurveyResponse, getSurveyResponse } from '../../utils/surveyResponses';
import { supabase } from '../../utils/supabaseClient';
import intakeSurveySchema from './intake-survey-questions.json';
import { useRouter } from 'next/navigation';

// Helper: debounce
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const SurveyPage = () => {
  const [formData, setFormData] = useState<any>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
  };

  // Debounced save
  const debouncedSave = useCallback(
    debounce(async (updatedData) => {
      if (userId) {
        await upsertSurveyResponse(userId, updatedData);
      }
    }, 800),
    [userId]
  );

  useEffect(() => {
    if (userId && Object.keys(formData).length > 0) {
      debouncedSave(formData);
    }
  }, [formData, userId, debouncedSave]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Intake Survey</h1>
      <form className="space-y-6">
        {Object.entries(intakeSurveySchema.properties).map(([key, config]: [string, any]) => (
          <div key={key}>
            <label className="block font-medium mb-2">{config.title}</label>
            <input
              type={config.type === 'number' ? 'number' : 'text'}
              className="border p-2 rounded w-full"
              value={formData[key] || ''}
              onChange={e => handleChange(key, config.type === 'number' ? Number(e.target.value) : e.target.value)}
            />
          </div>
        ))}
      </form>
      <div className="mt-8">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => router.push('/survey/results')}
        >
          Finish
        </button>
      </div>
    </div>
  );
};

export default SurveyPage;
