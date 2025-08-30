import { useState } from 'react';
import { Assessment } from '../types';
import { supabase } from '@/utils/supabaseClient';

export const useAssessment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAssessment = async (surveyData: any): Promise<Assessment | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers,
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
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/assessment/approve', {
        method: 'POST',
        headers,
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
    currentAssessment: string, 
    surveyResponses: Record<string, any>
  ): Promise<Assessment | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/assessment/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          currentAssessment,
          feedback,
          surveyResponses,
          revisionOfAssessmentId: assessmentId
        }),
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
