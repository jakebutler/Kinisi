/**
 * React Specialist Test Setup
 * Ensures Supabase mocks are properly applied before React components render
 */

import { jest } from '@jest/globals';
import { createSupabaseMock } from '../utils/supabaseMock';

// Create global mock instance that persists across all tests
const { mockSupabase } = createSupabaseMock();

// Mock the Supabase client module with our persistent mock
jest.mock('@/utils/supabaseClient', () => {
  return {
    supabase: mockSupabase
  };
});

// Ensure mock is reset but structure persists between tests
beforeEach(() => {
  // Clear all mock call history but keep the implementation
  jest.clearAllMocks();

  // CRITICAL: Re-apply the mock implementation to ensure it survives React rendering
  mockSupabase.auth.onAuthStateChange.mockImplementation((callback: any) => {
    return {
      data: {
        subscription: {
          unsubscribe: jest.fn()
        }
      }
    };
  });

  // Ensure other auth methods also work
  mockSupabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null
  });

  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null
  });
});

// Export the mock for test access
export { mockSupabase };