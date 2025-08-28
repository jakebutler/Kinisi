import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '@/utils/supabaseClient';
import { ExerciseProgram, Assessment } from '../types';

export const useDashboardData = () => {
  const { user } = useUser();
  const [program, setProgram] = useState<ExerciseProgram | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [surveyData, setSurveyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Load latest approved program
      const { data: programs, error: programError } = await supabase
        .from('exercise_programs')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);

      if (programError) {
        console.error('Error loading program:', programError);
      } else if (programs && programs.length > 0) {
        setProgram(programs[0] as ExerciseProgram);
      }

      // Load latest approved assessment
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (assessmentError) {
        console.error('Error loading assessment:', assessmentError);
      } else if (assessments && assessments.length > 0) {
        setAssessment(assessments[0] as Assessment);
      }

      // Load survey data
      const { data: survey, error: surveyError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (surveyError) {
        console.error('Error loading survey:', surveyError);
      } else if (survey && survey.length > 0) {
        setSurveyData(survey[0]);
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  return {
    program,
    assessment,
    surveyData,
    loading,
    error,
    refreshData
  };
};
