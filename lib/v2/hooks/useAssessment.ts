import { useState } from 'react';
import { Assessment, SurveyData } from '../types';
import { supabase } from '@/utils/supabaseClient';

export const useAssessment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAssessment = async (surveyData: SurveyData): Promise<Assessment | null> => {
    setLoading(true);
    setError(null);

    try {
      let accessToken: string | undefined;
      try {
        const { data: sess } = await supabase.auth.getSession();
        accessToken = sess?.session?.access_token;
      } catch {
        // Fallback if getSession is undefined in certain test mocks
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token;
      }
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ surveyResponses: surveyData }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate assessment');
      }

      const assessment = await response.json();
      return assessment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const approveAssessment = async (assessmentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess?.session?.access_token;
      const response = await fetch('/api/assessment/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ assessmentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve assessment');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestAssessmentUpdate = async (
    assessmentId: string,
    feedback: string,
    currentAssessment?: string,
    surveyResponses?: SurveyData
  ): Promise<Assessment | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess?.session?.access_token;
      const response = await fetch('/api/assessment/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(
          typeof currentAssessment !== 'undefined' && typeof surveyResponses !== 'undefined'
            ? {
                currentAssessment,
                feedback,
                surveyResponses,
                revisionOfAssessmentId: assessmentId,
              }
            : {
                // Legacy minimal body for tests/backward-compat
                assessmentId,
                feedback,
              }
        ),
      });

      if (!response.ok) {
        throw new Error('Failed to update assessment');
      }

      const updatedAssessment = await response.json();
      return updatedAssessment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateAssessment,
    approveAssessment,
    requestAssessmentUpdate,
  };
};
