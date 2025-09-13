import { renderHook, act } from '@testing-library/react';
import { useProgram } from '@/lib/v2/hooks/useProgram';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useProgram', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('generateProgram', () => {
    it('successfully generates program', async () => {
      const mockProgram = {
        id: 'test-program-id',
        userId: 'test-user-id',
        weeks: [],
        approved: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProgram,
      });

      const { result } = renderHook(() => useProgram());

      let programResult;
      await act(async () => {
        programResult = await result.current.generateProgram('test-assessment-id');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/program/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentId: 'test-assessment-id' }),
      });

      expect(programResult).toEqual(mockProgram);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useProgram());

      let programResult;
      await act(async () => {
        programResult = await result.current.generateProgram('test-assessment-id');
      });

      expect(programResult).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to generate program');
    });

    it('sets loading state during request', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { result } = renderHook(() => useProgram());

      act(() => {
        result.current.generateProgram('test-assessment-id');
      });

      expect(result.current.loading).toBe(true);
    });
  });

  describe('approveProgram', () => {
    it('successfully approves program', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useProgram());

      let approvalResult;
      await act(async () => {
        approvalResult = await result.current.approveProgram('test-program-id');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/program/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ programId: 'test-program-id' }),
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

      const { result } = renderHook(() => useProgram());

      let approvalResult;
      await act(async () => {
        approvalResult = await result.current.approveProgram('test-program-id');
      });

      expect(approvalResult).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to approve program');
    });
  });

  describe('requestProgramUpdate', () => {
    it('successfully requests program update', async () => {
      const mockUpdatedProgram = {
        id: 'test-program-id',
        userId: 'test-user-id',
        weeks: [],
        approved: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedProgram,
      });

      const { result } = renderHook(() => useProgram());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.requestProgramUpdate('test-program-id', 'Please update');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/program/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ programId: 'test-program-id', feedback: 'Please update' }),
      });

      expect(updateResult).toEqual(mockUpdatedProgram);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles update API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useProgram());

      let updateResult;
      await act(async () => {
        updateResult = await result.current.requestProgramUpdate('test-program-id', 'Please update');
      });

      expect(updateResult).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to update program');
    });
  });

  describe('scheduleProgram', () => {
    it('successfully schedules program', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useProgram());

      let scheduleResult;
      await act(async () => {
        scheduleResult = await result.current.scheduleProgram('test-program-id', '2024-12-25');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/program/test-program-id/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate: '2024-12-25' }),
      });

      expect(scheduleResult).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles schedule API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useProgram());

      let scheduleResult;
      await act(async () => {
        scheduleResult = await result.current.scheduleProgram('test-program-id', '2024-12-25');
      });

      expect(scheduleResult).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to schedule program');
    });
  });

  it('resets error state on new requests', async () => {
    // First request fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useProgram());

    await act(async () => {
      await result.current.generateProgram('test-assessment-id');
    });

    expect(result.current.error).toBe('Failed to generate program');

    // Second request succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'test' }),
    });

    await act(async () => {
      await result.current.generateProgram('test-assessment-id');
    });

    expect(result.current.error).toBe(null);
  });
});
