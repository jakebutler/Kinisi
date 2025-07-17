import { supabase } from './supabaseClient';
import { getSurveyResponse } from './surveyResponses';

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
 * Determine where to redirect a user after login based on their survey completion status
 * @param userId - The user's ID
 * @returns Promise<string> - The path to redirect to
 */
export async function getPostLoginRedirect(userId: string): Promise<string> {
  const surveyCompleted = await hasCompletedSurvey(userId);
  
  if (surveyCompleted) {
    return '/dashboard';
  } else {
    return '/survey';
  }
}
