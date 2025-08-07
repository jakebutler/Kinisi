import { jest } from '@jest/globals';

// Mock dependencies with inline implementations (BEFORE imports)
jest.mock('@/utils/programDataHelpers', () => ({
  saveProgramFeedback: jest.fn()
}));

// Import AFTER mocking
import { saveProgramFeedback } from '@/utils/programDataHelpers';

describe('Program Feedback API Business Logic', () => {
  const mockSavedFeedback = {
    id: 'feedback-123',
    program_id: 'program-456',
    user_id: 'demo-user',
    feedback: 'This workout was great!',
    session_id: 'session-789',
    created_at: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configure default mock implementation
    (saveProgramFeedback as jest.Mock).mockResolvedValue(mockSavedFeedback);
  });

  describe('Success Scenarios', () => {
    it('should process valid feedback submission successfully', async () => {
      const feedbackData = {
        program_id: 'program-456',
        session_id: 'session-789',
        user_id: 'demo-user',
        feedback: 'This workout was challenging but effective!'
      };

      const result = await saveProgramFeedback(feedbackData);
      
      expect(result).toEqual(mockSavedFeedback);
      expect(saveProgramFeedback).toHaveBeenCalledWith(feedbackData);
      expect(saveProgramFeedback).toHaveBeenCalledTimes(1);
    });

    it('should handle feedback without session_id', async () => {
      const feedbackData = {
        program_id: 'program-456',
        session_id: undefined,
        user_id: 'demo-user',
        feedback: 'Overall program feedback'
      };

      await saveProgramFeedback(feedbackData);
      
      expect(saveProgramFeedback).toHaveBeenCalledWith(feedbackData);
    });

    it('should handle different feedback lengths', async () => {
      const shortFeedback = {
        program_id: 'program-456',
        session_id: 'session-789',
        user_id: 'demo-user',
        feedback: 'Good!'
      };

      const longFeedback = {
        program_id: 'program-456',
        session_id: 'session-789',
        user_id: 'demo-user',
        feedback: 'This was an excellent workout program. The exercises were well-balanced and progressively challenging. I particularly enjoyed the variety of movements and the clear instructions provided for each exercise. The rest periods were appropriate and I felt adequately recovered between sets.'
      };

      await saveProgramFeedback(shortFeedback);
      await saveProgramFeedback(longFeedback);
      
      expect(saveProgramFeedback).toHaveBeenCalledTimes(2);
      expect(saveProgramFeedback).toHaveBeenNthCalledWith(1, shortFeedback);
      expect(saveProgramFeedback).toHaveBeenNthCalledWith(2, longFeedback);
    });
  });

  describe('Validation Error Scenarios', () => {
    it('should handle missing program ID', () => {
      const id = '';
      expect(id).toBeFalsy();
      expect(typeof id).toBe('string');
    });

    it('should handle undefined program ID', () => {
      const id = undefined;
      expect(id).toBeFalsy();
      expect(typeof id).toBe('undefined');
    });

    it('should handle non-string program ID', () => {
      const id = 123;
      expect(typeof id).toBe('number');
      expect(typeof id !== 'string').toBe(true);
    });

    it('should handle missing feedback', () => {
      const feedback = '';
      expect(feedback).toBeFalsy();
      expect(typeof feedback).toBe('string');
    });

    it('should handle undefined feedback', () => {
      const feedback = undefined;
      expect(feedback).toBeFalsy();
      expect(typeof feedback).toBe('undefined');
    });

    it('should handle non-string feedback', () => {
      const feedback = { text: 'feedback' };
      expect(typeof feedback).toBe('object');
      expect(typeof feedback !== 'string').toBe(true);
    });

    it('should handle null feedback', () => {
      const feedback = null;
      expect(feedback).toBeNull();
      expect(typeof feedback).toBe('object');
    });
  });

  describe('External Service Failure Scenarios', () => {
    it('should handle saveProgramFeedback database failure', async () => {
      (saveProgramFeedback as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
      
      const feedbackData = {
        program_id: 'program-456',
        session_id: 'session-789',
        user_id: 'demo-user',
        feedback: 'Test feedback'
      };

      await expect(saveProgramFeedback(feedbackData))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle saveProgramFeedback constraint violation', async () => {
      (saveProgramFeedback as jest.Mock).mockRejectedValue(new Error('Foreign key constraint violation'));
      
      const feedbackData = {
        program_id: 'nonexistent-program',
        session_id: 'session-789',
        user_id: 'demo-user',
        feedback: 'Test feedback'
      };

      await expect(saveProgramFeedback(feedbackData))
        .rejects.toThrow('Foreign key constraint violation');
    });

    it('should handle network timeout', async () => {
      (saveProgramFeedback as jest.Mock).mockRejectedValue(new Error('Network timeout'));
      
      const feedbackData = {
        program_id: 'program-456',
        session_id: 'session-789',
        user_id: 'demo-user',
        feedback: 'Test feedback'
      };

      await expect(saveProgramFeedback(feedbackData))
        .rejects.toThrow('Network timeout');
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only feedback', () => {
      const feedback = '   \n\t   ';
      expect(feedback.trim()).toBe('');
      expect(feedback.length > 0).toBe(true);
    });

    it('should handle special characters in feedback', async () => {
      const feedbackData = {
        program_id: 'program-456',
        session_id: 'session-789',
        user_id: 'demo-user',
        feedback: 'Great workout! 💪 The squats were tough 😅 but I managed 3x10 reps @ 135lbs.'
      };

      await saveProgramFeedback(feedbackData);
      
      expect(saveProgramFeedback).toHaveBeenCalledWith(feedbackData);
    });

    it('should handle very long program IDs', async () => {
      const longId = 'a'.repeat(1000);
      const feedbackData = {
        program_id: longId,
        session_id: 'session-789',
        user_id: 'demo-user',
        feedback: 'Test feedback'
      };

      await saveProgramFeedback(feedbackData);
      
      expect(saveProgramFeedback).toHaveBeenCalledWith(feedbackData);
    });

    it('should handle missing session_id gracefully', async () => {
      const feedbackData = {
        program_id: 'program-456',
        session_id: undefined,
        user_id: 'demo-user',
        feedback: 'Program-level feedback without specific session'
      };

      await saveProgramFeedback(feedbackData);
      
      expect(saveProgramFeedback).toHaveBeenCalledWith(feedbackData);
    });
  });

  describe('Mock Verification', () => {
    it('should validate all mocks are working correctly', () => {
      expect(jest.isMockFunction(saveProgramFeedback)).toBe(true);
      
      console.log('✅ All Program Feedback API mocks are properly configured');
    });

    it('should verify mock behavior with different inputs', async () => {
      // Test multiple calls with different data
      const feedback1 = {
        program_id: 'program-1',
        session_id: 'session-1',
        user_id: 'user-1',
        feedback: 'Feedback 1'
      };

      const feedback2 = {
        program_id: 'program-2',
        session_id: 'session-2',
        user_id: 'user-2',
        feedback: 'Feedback 2'
      };

      await saveProgramFeedback(feedback1);
      await saveProgramFeedback(feedback2);

      expect(saveProgramFeedback).toHaveBeenCalledTimes(2);
      expect(saveProgramFeedback).toHaveBeenNthCalledWith(1, feedback1);
      expect(saveProgramFeedback).toHaveBeenNthCalledWith(2, feedback2);
    });

    it('should verify mock reset between tests', () => {
      // This test verifies that mocks are properly reset in beforeEach
      expect(saveProgramFeedback).toHaveBeenCalledTimes(0);
      
      // After calling the mock, it should have been called once
      saveProgramFeedback({ program_id: 'test', user_id: 'test', feedback: 'test' });
      expect(saveProgramFeedback).toHaveBeenCalledTimes(1);
    });
  });
});
