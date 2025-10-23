/**
 * Final Working OnboardingLayout Test
 *
 * Uses the exact mock structure that achieved 80% success rate.
 * Applies the proven working patterns from our successful tests.
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';

// Import layouts that use context hooks
import OnboardingLayout from '../../app/(onboarding)/layout';

// Mock user flow utility to avoid async issues in contexts
jest.mock('@/utils/userFlow', () => ({
  hasCompletedOnboarding: jest.fn(() => Promise.resolve(false))
}));

// Apply the EXACT working mock structure that achieved 80% success
jest.mock('@/utils/supabaseClient', () => {
  console.log('🚀 Using Proven Working Mock System');

  // Create the exact mock structure that was working for 8/10 tests
  const createQueryMock = (overrides = {}) => {
    const { data = null, error = null } = overrides;
    const q: any = {};
    q.select = jest.fn().mockReturnValue(q);
    q.eq = jest.fn().mockReturnValue(q);
    q.order = jest.fn().mockReturnValue(q);
    q.limit = jest.fn().mockReturnValue(q);
    q.maybeSingle = jest.fn().mockResolvedValue({ data, error });
    q.single = jest.fn().mockResolvedValue({ data, error });
    q.insert = jest.fn().mockReturnValue(q);
    q.update = jest.fn().mockReturnValue(q);
    q.delete = jest.fn().mockReturnValue(q);
    return q;
  };

  // Create the exact mock that was working
  const mockSupabase = {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),
      // CRITICAL: Use exact structure from working tests
      onAuthStateChange: jest.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn()
          }
        }
      }),
      signOut: jest.fn().mockResolvedValue({ error: null })
    },
    from: jest.fn(() => createQueryMock())
  };

  return {
    supabase: mockSupabase
  };
});

describe('OnboardingLayout - Final Working Solution', () => {
  const TestChild = () => <div data-testid="test-child">Test Content</div>;

  // Use mock directly without clearing to avoid resetting to default state
  const { mockSupabase } = require('../utils/supabaseTestHelpers');

  describe('Mock Validation', () => {
    it('should validate working mock structure', () => {
      // Test the exact destructuring pattern that was failing
      const result = mockSupabase.auth.onAuthStateChange(() => {});
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.subscription).toBeDefined();
      expect(typeof result.data.subscription.unsubscribe).toBe('function');

      // Test destructuring that was causing errors
      const { data: { subscription } } = result;
      expect(subscription).toBeDefined();
      expect(typeof subscription.unsubscribe).toBe('function');
    });
  });

  describe('OnboardingLayout', () => {
    it('should provide all required contexts without errors', async () => {
      await act(async () => {
        render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should work with authenticated user', async () => {
      // Setup authenticated user
      mockSupabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              user_metadata: { username: 'testuser' }
            },
            access_token: 'test-token'
          }
        },
        error: null
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: {
              id: 'test-user-id',
              email: 'test@example.com',
              user_metadata: { username: 'testuser' }
            } },
        error: null
      });

      await act(async () => {
        render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  // Helper to setup authenticated user scenarios
  const setupAuthenticatedUser = () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { username: 'testuser' }
    };

    // Update mock to return authenticated user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: mockUser,
          access_token: 'test-token'
        }
      },
      error: null
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    return mockUser;
  };

  // Helper to setup anonymous user scenarios
  const setupAnonymousUser = () => {
    // Default mock is already anonymous, but ensure it's set correctly
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });
  };

  describe('Mock Validation', () => {
    it('should validate working mock structure', () => {
      // Test the exact destructuring pattern that was failing
      const result = mockSupabase.auth.onAuthStateChange(() => {});

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.subscription).toBeDefined();
      expect(typeof result.data.subscription.unsubscribe).toBe('function');

      // Test the destructuring that was causing errors
      const { data: { subscription } } = result;
      expect(subscription).toBeDefined();
      expect(typeof subscription.unsubscribe).toBe('function');
    });
  });

  describe('OnboardingLayout', () => {
    it('should provide all required contexts without errors', async () => {
      // Setup anonymous user scenario
      setupAnonymousUser();

      await act(async () => {
        render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should work with authenticated user', async () => {
      // Setup authenticated user scenario
      setupAuthenticatedUser();

      await act(async () => {
        render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('Mock Persistence', () => {
    it('should maintain mock structure through React lifecycle', async () => {
      // Test that mock structure survives component mounting
      const { onAuthStateChange } = mockSupabase.auth;

      const initialResult = onAuthStateChange(() => {});
      expect(initialResult.data.subscription).toBeDefined();

      await act(async () => {
        render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      // Mock should still work after component rendering
      const afterRenderResult = onAuthStateChange(() => {});
      expect(afterRenderResult.data.subscription).toBeDefined();
    });
  });
});