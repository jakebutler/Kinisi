import { useState } from 'react';
import { ExerciseProgram } from '../types';

export const useProgram = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateProgram = async (assessmentId: string): Promise<ExerciseProgram | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/program/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`/api/program/${programId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
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
      const response = await fetch(`/api/program/${programId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
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
      const response = await fetch(`/api/program/${programId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
