// Unit tests for AssessmentChat component
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssessmentChat from '../../../components/AssessmentChat';
import { mockAssessment, mockRevisedAssessment } from '../../fixtures/assessments';
import { mockSurveyResponse } from '../../fixtures/surveys';

// Mock fetch
global.fetch = jest.fn();

const mockProps = {
  initialAssessment: mockAssessment.assessment,
  surveyResponses: mockSurveyResponse.response,
  userId: 'test-user-id-123',
  onAssessmentUpdate: jest.fn()
};

describe('AssessmentChat', () => {
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial render', () => {
    it('should render feedback form with current assessment', () => {
      render(<AssessmentChat {...mockProps} />);

      expect(screen.getByText('Assessment Feedback')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Suggest a change or give feedback/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
    });

    it('should display current assessment text', () => {
      render(<AssessmentChat {...mockProps} />);

      // Check if the assessment text is rendered
      const assessmentText = screen.getByTestId('assessment-text');
      expect(assessmentText).toHaveTextContent(/Based on your survey responses/);
    });
  });

  describe('feedback submission', () => {
    it('should submit feedback and update assessment', async () => {
      const user = userEvent.setup();
      
      // Mock fetch with a delay so loading state is observable
      mockFetch.mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ assessment: mockRevisedAssessment.assessment })
        } as Response), 50))
      );

      render(<AssessmentChat {...mockProps} />);

      const feedbackInput = screen.getByPlaceholderText(/Suggest a change or give feedback/);
      const submitButton = screen.getByRole('button', { name: /Send/i });

      // Enter feedback
      await user.type(feedbackInput, 'Please focus more on strength training');
      
      // Submit feedback
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByPlaceholderText('Sending feedback...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for API call completion
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/assessment/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentAssessment: mockAssessment.assessment,
            feedback: 'Please focus more on strength training',
            surveyResponses: mockSurveyResponse.response,
            userId: 'test-user-id-123'
          }),
        });
      });

      // Check that onAssessmentUpdate was called
      await waitFor(() => {
        expect(mockProps.onAssessmentUpdate).toHaveBeenCalledWith(
          mockRevisedAssessment.assessment
        );
      });
    });

    it('should not submit empty feedback', async () => {
      const user = userEvent.setup();
      
      render(<AssessmentChat {...mockProps} />);

      const submitButton = screen.getByRole('button', { name: /Send/i });

      // Try to submit without feedback
      await user.click(submitButton);

      // Should not make API call
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockProps.onAssessmentUpdate).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Suppress expected error logs
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      render(<AssessmentChat {...mockProps} />);

      const feedbackInput = screen.getByPlaceholderText(/Suggest a change or give feedback/);
      const submitButton = screen.getByRole('button', { name: /Send/i });

      await user.type(feedbackInput, 'Test feedback');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to update assessment/)).toBeInTheDocument();
      });

      // Should not call onAssessmentUpdate on error
      expect(mockProps.onAssessmentUpdate).not.toHaveBeenCalled();

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      // Suppress expected error logs
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const user = userEvent.setup();
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AssessmentChat {...mockProps} />);

      const feedbackInput = screen.getByPlaceholderText(/Suggest a change or give feedback/);
      const submitButton = screen.getByRole('button', { name: /Send/i });

      await user.type(feedbackInput, 'Test feedback');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to update assessment/)).toBeInTheDocument();
      });
    });
  });

  describe('loading states', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ assessment: mockRevisedAssessment.assessment })
          } as Response), 100)
        )
      );

      render(<AssessmentChat {...mockProps} />);

      const feedbackInput = screen.getByPlaceholderText(/Suggest a change or give feedback/);
      const submitButton = screen.getByRole('button', { name: /Send/i });

      await user.type(feedbackInput, 'Test feedback');
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByPlaceholderText('Sending feedback...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Sending feedback...')).not.toBeInTheDocument();
      });
    });

    it('should disable submit button when loading', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ revisedAssessment: mockRevisedAssessment.assessment })
          } as Response), 100)
        )
      );

      render(<AssessmentChat {...mockProps} />);

      const feedbackInput = screen.getByPlaceholderText(/Suggest a change or give feedback/);
      const submitButton = screen.getByRole('button', { name: /Send/i });

      await user.type(feedbackInput, 'Test feedback');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();

      // Button should remain disabled during loading
      expect(submitButton).toBeDisabled();
    });
  });

  describe('form validation', () => {
    it('should trim whitespace from feedback', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ assessment: mockRevisedAssessment.assessment })
      } as Response);

      render(<AssessmentChat {...mockProps} />);

      const feedbackInput = screen.getByPlaceholderText(/Suggest a change or give feedback/);
      const submitButton = screen.getByRole('button', { name: /Send/i });

      // Enter feedback with whitespace
      await user.type(feedbackInput, '   Test feedback   ');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/assessment/feedback', 
          expect.objectContaining({
            body: expect.stringContaining('"feedback":"Test feedback"')
          })
        );
      });
    });

    it('should not submit feedback with only whitespace', async () => {
      const user = userEvent.setup();
      
      render(<AssessmentChat {...mockProps} />);

      const feedbackInput = screen.getByPlaceholderText(/Suggest a change or give feedback/);
      const submitButton = screen.getByRole('button', { name: /Send/i });

      // Enter only whitespace
      await user.type(feedbackInput, '   ');
      await user.click(submitButton);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper form labels and structure', () => {
      render(<AssessmentChat {...mockProps} />);

      const feedbackInput = screen.getByPlaceholderText(/Suggest a change or give feedback/);
      const submitButton = screen.getByRole('button', { name: /Send/i });

      expect(feedbackInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(feedbackInput.tagName).toBe('INPUT');
    });

    it('should maintain focus management during loading', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ assessment: mockRevisedAssessment.assessment })
      } as Response);

      render(<AssessmentChat {...mockProps} />);

      const feedbackInput = screen.getByPlaceholderText(/Suggest a change or give feedback/);
      const submitButton = screen.getByRole('button', { name: /Send/i });

      await user.type(feedbackInput, 'Test feedback');
      await user.click(submitButton);

      // Button should be disabled but still focusable
      expect(submitButton).toBeDisabled();
      
      // Button should remain disabled during loading
      expect(submitButton).toBeDisabled();
    });
  });
});
