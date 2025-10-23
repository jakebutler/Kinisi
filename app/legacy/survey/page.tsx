"use client";
import React, { useEffect, useState } from 'react';
import { upsertSurveyResponse, getSurveyResponse } from '@/utils/surveyResponses';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';
import SurveyContainer from '@/components/survey/SurveyContainer';
import { intakeSurveyQuestions } from '@/utils/survey/questionDefinitions';
import { SurveyResponseData } from '@/types/survey';

const SurveyPage = () => {
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<SurveyResponseData>({});
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await getSurveyResponse(user.id);
      if (data && data.length > 0 && data[0].response) {
        setInitialData(data[0].response);
      }
      setLoading(false);
    };

    fetchUserAndData();
  }, [router]);

  const handleSubmit = async (responses: SurveyResponseData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await upsertSurveyResponse(user.id, responses);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting survey:', error);
      throw error; // Let the SurveyContainer handle the error display
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
        <SurveyContainer
          questions={intakeSurveyQuestions}
          onSubmit={handleSubmit}
          initialData={initialData}
          progressBarColor="bg-[var(--brand-puce)]"
        />
      </div>
    </div>
  );
};

export default SurveyPage;
