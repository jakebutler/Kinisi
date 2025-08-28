import { renderHook, act } from '@testing-library/react';
import { useAssessment } from '../../../../lib/v2/hooks/useAssessment';

// Mock fetch
global.fetch = jest.fn();

// Mock Supabase client
const mockGetSession = jest.fn();
jest.mock('@/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession
    }
  }
}));

describe('useAssessment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('generateAssessment', () => {
    it('should include Authorization header when session exists', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-1' }
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'assessment-1', assessment: 'Test assessment' })
      });

      const { result } = renderHook(() => useAssessment());
      
      await act(async () => {
        await result.current.generateAssessment({ goal: 'fitness' });
      });

      expect(fetch).toHaveBeenCalledWith('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ surveyResponses: { goal: 'fitness' } })
      });
    });

    it('should not include Authorization header when no session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'assessment-1', assessment: 'Test assessment' })
      });

      const { result } = renderHook(() => useAssessment());
      
      await act(async () => {
        await result.current.generateAssessment({ goal: 'fitness' });
      });

      expect(fetch).toHaveBeenCalledWith('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ surveyResponses: { goal: 'fitness' } })
      });
    });

    it('should handle 401 Unauthorized error', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      const { result } = renderHook(() => useAssessment());
      
      await act(async () => {
        const assessment = await result.current.generateAssessment({ goal: 'fitness' });
        expect(assessment).toBeNull();
      });

      expect(result.current.error).toBe('Failed to generate assessment');
    });

    it('should handle network errors', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAssessment());
      
      await act(async () => {
        const assessment = await result.current.generateAssessment({ goal: 'fitness' });
        expect(assessment).toBeNull();
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('approveAssessment', () => {
    it('should include Authorization header when session exists', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-1' }
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const { result } = renderHook(() => useAssessment());
      
      await act(async () => {
        await result.current.approveAssessment('assessment-1');
      });

      expect(fetch).toHaveBeenCalledWith('/api/assessment/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ assessmentId: 'assessment-1' })
      });
    });
  });

  describe('requestAssessmentUpdate', () => {
    it('should include Authorization header when session exists', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'user-1' }
      };
      mockGetSession.mockResolvedValue({ data: { session: mockSession } });
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'assessment-1', assessment: 'Updated assessment' })
      });

      const { result } = renderHook(() => useAssessment());
      
      await act(async () => {
        await result.current.requestAssessmentUpdate('assessment-1', 'Please make it shorter');
      });

      expect(fetch).toHaveBeenCalledWith('/api/assessment/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({ 
          assessmentId: 'assessment-1', 
          feedback: 'Please make it shorter' 
        })
      });
    });
  });

  describe('loading and error states', () => {
    it('should set loading to true during API call', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'assessment-1' })
        }), 100))
      );

      const { result } = renderHook(() => useAssessment());
      
      expect(result.current.loading).toBe(false);
      
      act(() => {
        result.current.generateAssessment({ goal: 'fitness' });
      });
      
      expect(result.current.loading).toBe(true);
    });

    it('should clear error on new request', async () => {
      mockGetSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
      
      // First call fails
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const { result } = renderHook(() => useAssessment());
      
      await act(async () => {
        await result.current.generateAssessment({ goal: 'fitness' });
      });
      
      expect(result.current.error).toBeTruthy();
      
      // Second call succeeds
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'assessment-1' })
      });
      
      await act(async () => {
        await result.current.generateAssessment({ goal: 'fitness' });
      });
      
      expect(result.current.error).toBeNull();
    });
  });
});
