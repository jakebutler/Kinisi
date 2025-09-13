import { supabase } from './supabaseClient';
import { getSurveyResponse } from './surveyResponses';
import { getLatestAssessment } from './assessments';

/**
 * Check if a user has completed the initial survey
 * @param userId - The user's ID
 * @returns Promise<boolean> - true if survey is completed, false otherwise
 */
export async function hasCompletedSurvey(userId: string): Promise<boolean> {
  try {
    const { data, error } = await getSurveyResponse(userId);
    
    if (error) {
      console.error('Error checking survey completion:', error);
      return false;
    }
    
    // Check if user has any survey response
    if (!data || data.length === 0) {
      return false;
    }
    
    // Check if the survey response is complete
    const surveyResponse = data[0];
    const response = surveyResponse.response;
    
    // More robust check: ensure response exists and has meaningful content
    if (!response || typeof response !== 'object') {
      return false;
    }
    
    // Check if response has at least a few key fields that indicate completion
    const responseKeys = Object.keys(response);
    const hasMinimumFields = responseKeys.length >= 3; // Adjust based on your survey
    
    // Check if any of the responses have actual values (not just empty strings)
    const hasActualValues = responseKeys.some(key => {
      const value = response[key];
      return value !== null && value !== undefined && value !== '';
    });
    
    return hasMinimumFields && hasActualValues;
  } catch (err) {
    console.error('Error in hasCompletedSurvey:', err);
    return false;
  }
}

/**
 * Check if a user has completed the full onboarding flow
 * Based on completion criteria: Survey → Assessment (approved) → Program (approved) → Schedule
 * @param userId - The user's ID
 * @returns Promise<boolean> - true if onboarding is complete, false otherwise
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  try {
    // 1. Check survey completion
    const surveyCompleted = await hasCompletedSurvey(userId);
    if (!surveyCompleted) return false;

    // 2. Check assessment completion (approved = true)
    const { data: assessment } = await getLatestAssessment(userId);
    if (!assessment?.approved) return false;

    // 3. Check program completion (status = 'approved')
    const { data: programs, error: programError } = await supabase
      .from('exercise_programs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (programError || !programs || programs.length === 0) return false;
    const latestProgram = programs[0];
    if (latestProgram.status !== 'approved') return false;

    // 4. Check schedule completion (program_json has sessions with start_at OR last_scheduled_at is set)
    const hasScheduledSessions = latestProgram.program_json && 
      Array.isArray(latestProgram.program_json) &&
      latestProgram.program_json.some((session: any) => session.start_at);
    
    const hasLastScheduledAt = latestProgram.last_scheduled_at !== null;
    
    return hasScheduledSessions || hasLastScheduledAt;
  } catch (err) {
    console.error('Error in hasCompletedOnboarding:', err);
    return false;
  }
}

/**
 * Determine where to redirect a user after login based on their onboarding completion status
 * @param userId - The user's ID
 * @returns Promise<string> - The path to redirect to
 */
export async function getPostLoginRedirect(userId: string): Promise<string> {
  const onboardingCompleted = await hasCompletedOnboarding(userId);
  
  if (onboardingCompleted) {
    return '/dashboard';
  } else {
    return '/survey';
  }
}
