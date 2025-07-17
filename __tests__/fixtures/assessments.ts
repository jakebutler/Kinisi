// Test fixtures for assessment data
import { Assessment } from '../../utils/assessments';

export const mockAssessment: Assessment = {
  id: 'assessment-123',
  user_id: 'test-user-id-123',
  survey_response_id: 'survey-response-123',
  assessment: `Based on your survey responses, here's your personalized fitness assessment:

**Fitness Level:** Intermediate
**Primary Goals:** Weight loss and muscle gain
**Recommended Approach:** A balanced program combining strength training and cardiovascular exercise.

**Weekly Schedule:**
- 3 days strength training (full body)
- 2 days cardio (moderate intensity)
- 2 days active recovery

**Key Recommendations:**
1. Focus on compound movements for maximum efficiency
2. Incorporate progressive overload in your strength training
3. Maintain a slight caloric deficit for weight loss while preserving muscle
4. Ensure adequate protein intake (1.6-2.2g per kg body weight)

This program is designed to help you achieve both weight loss and muscle gain simultaneously through a strategic approach to training and nutrition.`,
  approved: false,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z'
};

export const mockApprovedAssessment: Assessment = {
  ...mockAssessment,
  id: 'assessment-approved-456',
  approved: true
};

export const mockRevisedAssessment: Assessment = {
  ...mockAssessment,
  id: 'assessment-revised-789',
  assessment: `REVISED: Based on your feedback and survey responses, here's your updated personalized fitness assessment:

**Fitness Level:** Intermediate
**Primary Goals:** Weight loss and muscle gain (with emphasis on strength)
**Recommended Approach:** A strength-focused program with strategic cardio integration.

**Weekly Schedule:**
- 4 days strength training (upper/lower split)
- 1 day HIIT cardio
- 2 days active recovery or light cardio

**Key Recommendations:**
1. Prioritize heavy compound movements (deadlifts, squats, bench press)
2. Use periodization for strength gains
3. Strategic cardio timing to preserve muscle
4. Higher protein intake (2.0-2.4g per kg body weight)

This revised program places greater emphasis on strength development while still supporting your weight loss goals.`,
  approved: false
};
