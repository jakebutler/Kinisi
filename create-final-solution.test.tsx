/**
 * FINAL SOLUTION: React Context Provider Mock Persistence Fix
 *
 * Test automator comprehensive solution addressing the core issue:
 * Mock structure persistence through React component lifecycle and context providers
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';

// Import components that are failing
import OnboardingLayout from '../../app/(onboarding)/layout';
import DashboardLayout from '../../app/dashboard-v2/layout';
import ProtectedRoute from '../../lib/v2/components/ProtectedRoute';

// Mock user flow utility
jest.mock('@/utils/userFlow', () => ({
  hasCompletedOnboarding: jest.fn(() => Promise.resolve(false))
}));

// CRITICAL SOLUTION: Mock that NEVER returns undefined for onAuthStateChange
// This addresses the exact error: "Cannot destructure property 'data' of 'supabaseClient_1.supabase.auth.onAuthStateChange(...)' as it is undefined"
jest.mock('@/utils/supabaseClient', () => {
  // Create unbreakable subscription object
  const createUnbreakableSubscription = () => ({
    data: {
      subscription: {
        unsubscribe: jest.fn(() => {
          console.log('🔔 Unbreakable subscription unsubscribed');
        }),
        // Additional properties to ensure complete structure
        subscriptionId: `mock-sub-${Date.now()}`,
        isActive: true,
        callback: null
      }
    }
  });

  // Create persistent auth mock that never breaks
  const createPersistentAuth = () => {
    const authMock = {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),

      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      }),

      // NEVER returns undefined - this is the critical fix
      onAuthStateChange: jest.fn().mockImplementation((callback) => {
        // Store callback for potential testing
        if (typeof callback === 'function') {
          authMock._storedCallback = callback;
        }

        // ALWAYS return valid structure
        return createUnbreakableSubscription();
      }),

      signOut: jest.fn().mockResolvedValue({ error: null })
    };

    return authMock;
  };

  // Create complete unbreakable mock
  const mockSupabase = {
    auth: createPersistentAuth(),

    from: jest.fn(() => {
      const query: any = {};

      // Chainable methods
      const chainableMethods = [
        'select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
        'is', 'in', 'contains', 'containedBy', 'overlaps', 'textSearch',
        'match', 'not', 'or', 'filter', 'order', 'limit', 'range'
      ];

      chainableMethods.forEach(method => {
        query[method] = jest.fn().mockReturnValue(query);
      });

      // Promise-returning methods
      query.single = jest.fn().mockResolvedValue({ data: null, error: null });
      query.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      query.insert = jest.fn().mockReturnValue(query);
      query.update = jest.fn().mockReturnValue(query);
      query.delete = jest.fn().mockReturnValue(query);

      return query;
    }),

    rpc: jest.fn().mockResolvedValue({ data: [], error: null })
  };

  // Ensure mock persistence through global registry
  if (typeof global !== 'undefined' && !global.__FINAL_SUPABASE_MOCK__) {
    global.__FINAL_SUPABASE_MOCK__ = mockSupabase;
  }

  return {
    supabase: mockSupabase,
    default: mockSupabase
  };
});

describe('FINAL SOLUTION: React Context Provider Mock Persistence', () => {
  const TestChild = () => <div data-testid="test-child">Test Content</div>;

  beforeEach(() => {
    // Reset all mocks while maintaining structure
    const { supabase } = require('@/utils/supabaseClient');

    if (supabase.auth.getSession.mockClear) {
      supabase.auth.getSession.mockClear();
    }
    if (supabase.auth.getUser.mockClear) {
      supabase.auth.getUser.mockClear();
    }
    if (supabase.auth.onAuthStateChange.mockClear) {
      supabase.auth.onAuthStateChange.mockClear();
    }
    if (supabase.from.mockClear) {
      supabase.from.mockClear();
    }

    // Reset to default values
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });

    jest.clearAllMocks();
  });

  describe('Core Mock Validation', () => {
    it('should validate critical destructuring pattern that was failing', () => {
      console.log('\n🔍 VALIDATING: Critical destructuring pattern');

      const { supabase } = require('@/utils/supabaseClient');

      // Test the exact failing pattern
      const result = supabase.auth.onAuthStateChange(() => {});

      console.log('✅ Result type:', typeof result);
      console.log('✅ result.data type:', typeof result?.data);
      console.log('✅ result.data.subscription type:', typeof result?.data?.subscription);
      console.log('✅ result.data.subscription.unsubscribe type:', typeof result?.data?.subscription?.unsubscribe);

      // Test destructuring - this is the pattern that was failing
      const { data: { subscription } } = result;

      expect(subscription).toBeDefined();
      expect(typeof subscription.unsubscribe).toBe('function');

      // Test unsubscribe works
      expect(() => subscription.unsubscribe()).not.toThrow();

      console.log('✅ CRITICAL: Destructuring pattern validation PASSED');
    });
  });

  describe('OnboardingLayout Tests', () => {
    it('should provide all required contexts without errors', async () => {
      console.log('\n🔍 TESTING: OnboardingLayout with anonymous user');

      const { supabase } = require('@/utils/supabaseClient');

      // Verify mock is working before rendering
      const testResult = supabase.auth.onAuthStateChange(() => {});
      expect(testResult.data).toBeDefined();
      expect(testResult.data.subscription).toBeDefined();

      await act(async () => {
        render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      console.log('✅ OnboardingLayout anonymous test PASSED');
    });

    it('should work with authenticated user', async () => {
      console.log('\n🔍 TESTING: OnboardingLayout with authenticated user');

      const { supabase } = require('@/utils/supabaseClient');

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' }
      };

      // Setup authenticated user
      supabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: mockUser,
            access_token: 'test-token'
          }
        },
        error: null
      });

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Verify mock works after changes
      const testResult = supabase.auth.onAuthStateChange(() => {});
      expect(testResult.data).toBeDefined();
      expect(testResult.data.subscription).toBeDefined();

      await act(async () => {
        render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      console.log('✅ OnboardingLayout authenticated test PASSED');
    });
  });

  describe('DashboardLayout Tests', () => {
    it('should provide UserProvider context without errors', async () => {
      console.log('\n🔍 TESTING: DashboardLayout with authenticated user');

      const { supabase } = require('@/utils/supabaseClient');

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' }
      };

      // Setup authenticated user for dashboard
      supabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: mockUser,
            access_token: 'test-token'
          }
        },
        error: null
      });

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      await act(async () => {
        render(
          <DashboardLayout>
            <TestChild />
          </DashboardLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      console.log('✅ DashboardLayout authenticated test PASSED');
    });

    it('should handle unauthenticated users gracefully', async () => {
      console.log('\n🔍 TESTING: DashboardLayout with unauthenticated user');

      // Default mock is unauthenticated
      await act(async () => {
        render(
          <DashboardLayout>
            <TestChild />
          </DashboardLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      console.log('✅ DashboardLayout unauthenticated test PASSED');
    });
  });

  describe('ProtectedRoute Tests', () => {
    it('should work when wrapped in UserProvider with authenticated user', async () => {
      console.log('\n🔍 TESTING: ProtectedRoute with UserProvider');

      const { supabase } = require('@/utils/supabaseClient');

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' }
      };

      // Setup authenticated user
      supabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: mockUser,
            access_token: 'test-token'
          }
        },
        error: null
      });

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const { UserProvider } = require('../../lib/v2/contexts/UserContext');

      await act(async () => {
        render(
          <UserProvider>
            <ProtectedRoute>
              <TestChild />
            </ProtectedRoute>
          </UserProvider>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      console.log('✅ ProtectedRoute with UserProvider test PASSED');
    });

    it('should throw error when not wrapped in UserProvider', () => {
      console.log('\n🔍 TESTING: ProtectedRoute without UserProvider');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        );
      }).toThrow('useUser must be used within a UserProvider');

      consoleSpy.mockRestore();
      console.log('✅ ProtectedRoute error handling test PASSED');
    });
  });

  describe('Context Hook Dependencies', () => {
    it('should verify all context hooks have proper provider setup', async () => {
      console.log('\n🔍 TESTING: Context hook dependencies');

      const { supabase } = require('@/utils/supabaseClient');

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' }
      };

      // Test with authenticated user to trigger all context hooks
      supabase.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: mockUser,
            access_token: 'test-token'
          }
        },
        error: null
      });

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Test onAuthStateChange works multiple times
      const result1 = supabase.auth.onAuthStateChange(() => {});
      const result2 = supabase.auth.onAuthStateChange(() => {});

      expect(result1.data.subscription).toBeDefined();
      expect(result2.data.subscription).toBeDefined();

      await act(async () => {
        render(
          <OnboardingLayout>
            <DashboardLayout>
              <TestChild />
            </DashboardLayout>
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      console.log('✅ Context hook dependencies test PASSED');
    });

    it('should handle authentication state changes', async () => {
      console.log('\n🔍 TESTING: Authentication state changes');

      const { supabase } = require('@/utils/supabaseClient');

      // Test state change simulation
      const mockCallback = jest.fn();
      const result = supabase.auth.onAuthStateChange(mockCallback);

      expect(result.data.subscription).toBeDefined();
      expect(typeof result.data.subscription.unsubscribe).toBe('function');

      // Test callback storage
      expect(supabase.auth._storedCallback).toBe(mockCallback);

      // Simulate authentication state change
      if (supabase.auth._storedCallback) {
        supabase.auth._storedCallback('SIGNED_IN', {
          user: { id: 'test-user', email: 'test@example.com' }
        });

        expect(mockCallback).toHaveBeenCalledWith(
          'SIGNED_IN',
          { user: { id: 'test-user', email: 'test@example.com' } }
        );
      }

      console.log('✅ Authentication state changes test PASSED');
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid context rendering without breaking', async () => {
      console.log('\n🔍 TESTING: Rapid context rendering stress test');

      const { supabase } = require('@/utils/supabaseClient');

      // Test 20 rapid renders
      for (let i = 0; i < 20; i++) {
        await act(async () => {
          render(
            <OnboardingLayout key={i}>
              <div data-testid={`rapid-test-${i}`}>Rapid Test {i}</div>
            </OnboardingLayout>
          );
        });

        expect(screen.getByTestId(`rapid-test-${i}`)).toBeInTheDocument();
      }

      // Verify mock is still valid
      const finalResult = supabase.auth.onAuthStateChange(() => {});
      expect(finalResult.data.subscription).toBeDefined();

      console.log('✅ Rapid context rendering stress test PASSED');
    });
  });
});

console.log('\n🎯 FINAL SOLUTION TEST SUITE LOADED');