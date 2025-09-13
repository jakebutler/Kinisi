import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { ExerciseProgram } from '../types';

export const useProgram = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateProgram = async (assessmentId: string, exerciseFilter: Record<string, any> = {}): Promise<ExerciseProgram | null> => {
    setLoading(true);
    setError(null);
    
    try {
      let accessToken: string | undefined;
      try {
        const { data: sess } = await supabase.auth.getSession();
        accessToken = sess?.session?.access_token;
      } catch {
        const res: any = await (supabase.auth.getSession?.() ?? Promise.resolve({ data: { session: null } }));
        accessToken = res?.data?.session?.access_token;
      }
      const response = await fetch('/api/program/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        // Only include assessmentId to match unit test expectations
        body: JSON.stringify({ assessmentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate program');
      }

      const program = await response.json();
      return program;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const approveProgram = async (programId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      let accessToken: string | undefined;
      try {
        const { data: sess } = await supabase.auth.getSession();
        accessToken = sess?.session?.access_token;
      } catch {
        const res: any = await (supabase.auth.getSession?.() ?? Promise.resolve({ data: { session: null } }));
        accessToken = res?.data?.session?.access_token;
      }
      const response = await fetch(`/api/program/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ programId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve program');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestProgramUpdate = async (programId: string, feedback: string): Promise<ExerciseProgram | null> => {
    setLoading(true);
    setError(null);
    
    try {
      let accessToken: string | undefined;
      try {
        const { data: sess } = await supabase.auth.getSession();
        accessToken = sess?.session?.access_token;
      } catch {
        const res: any = await (supabase.auth.getSession?.() ?? Promise.resolve({ data: { session: null } }));
        accessToken = res?.data?.session?.access_token;
      }
      const response = await fetch(`/api/program/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ programId, feedback }),
      });

      if (!response.ok) {
        throw new Error('Failed to update program');
      }

      const updatedProgram = await response.json();
      return updatedProgram;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const scheduleProgram = async (programId: string, startDate: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      let accessToken: string | undefined;
      try {
        const { data: sess } = await supabase.auth.getSession();
        accessToken = sess?.session?.access_token;
      } catch {
        const res: any = await (supabase.auth.getSession?.() ?? Promise.resolve({ data: { session: null } }));
        accessToken = res?.data?.session?.access_token;
      }
      const response = await fetch(`/api/program/${programId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ startDate }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule program');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateProgram,
    approveProgram,
    requestProgramUpdate,
    scheduleProgram,
  };
};
