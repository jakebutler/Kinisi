import { renderHook, act } from '@testing-library/react';
import { useAssessment } from '@/lib/v2/hooks/useAssessment';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useAssessment', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('generateAssessment', () => {
    it('successfully generates assessment', async () => {
      const mockAssessment = {
        id: 'test-id',
        content: 'Test assessment content',
        approved: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAssessment,
      });

      const { result } = renderHook(() => useAssessment());

      let assessmentResult;
      await act(async () => {
        assessmentResult = await result.current.generateAssessment({ test: 'data' });
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ surveyResponses: { test: 'data' } }),
      });

      expect(assessmentResult).toEqual(mockAssessment);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useAssessment());

      let assessmentResult;
      await act(async () => {
        assessmentResult = await result.current.generateAssessment({ test: 'data' });
      });

      expect(assessmentResult).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to generate assessment');
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAssessment());

      let assessmentResult;
      await act(async () => {
        assessmentResult = await result.current.generateAssessment({ test: 'data' });
      });

      expect(assessmentResult).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });

    it('sets loading state during request', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { result } = renderHook(() => useAssessment());

      act(() => {
        result.current.generateAssessment({ test: 'data' });
      });

      expect(result.current.loading).toBe(true);
    });
  });

  describe('approveAssessment', () => {
    it('successfully approves assessment', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useAssessment());

      let approvalResult;
      await act(async () => {
        approvalResult = await result.current.approveAssessment('test-id');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/assessment/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentId: 'test-id' }),
      });

      expect(approvalResult).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles approval API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useAssessment());

      let approvalResult;
      await act(async () => {
        approvalResult = await result.current.approveAssessment('test-id');
      });

      expect(approvalResult).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to approve assessment');
    });
  });

  describe('requestAssessmentUpdate', () => {
    it('successfully requests assessment update', async () => {
      const mockUpdatedAssessment = {
        id: 'test-id',
        content: 'Updated assessment content',
        approved: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedAssessment,
      });

      const { result } = renderHook(() => useAssessment());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.requestAssessmentUpdate('test-id', 'Please update');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/assessment/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentId: 'test-id', feedback: 'Please update' }),
      });

      expect(updateResult).toEqual(mockUpdatedAssessment);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles update API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useAssessment());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.requestAssessmentUpdate('test-id', 'Please update');
      });

      expect(updateResult).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to update assessment');
    });
  });

  it('resets error state on new requests', async () => {
    // First request fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useAssessment());

    await act(async () => {
      await result.current.generateAssessment({ test: 'data' });
    });

    expect(result.current.error).toBe('Failed to generate assessment');

    // Second request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'test' }),
    });

    await act(async () => {
      await result.current.generateAssessment({ test: 'data' });
    });

    expect(result.current.error).toBe(null);
  });
});
