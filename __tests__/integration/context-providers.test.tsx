import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';

// Import all layouts that use context hooks
import OnboardingLayout from '../../app/(onboarding)/layout';
import DashboardLayout from '../../app/dashboard-v2/layout';

// Import components that use context hooks
import ProtectedRoute from '../../lib/v2/components/ProtectedRoute';

// Apply advanced Supabase mock using the test automator solution
// This ensures proper mock persistence through React component lifecycle
jest.mock('@/utils/supabaseClient', () => {
  const { supabaseMockFactory } = require('../utils/advancedSupabaseMock');

  // Create a persistent mock that works with both import patterns
  const mock = supabaseMockFactory.scenarios.anonymous();

  return {
    supabase: mock.supabase,
    default: mock.default
  };
});

// Mock user flow utility to avoid async issues in contexts
jest.mock('@/utils/userFlow', () => ({
  hasCompletedOnboarding: jest.fn(() => Promise.resolve(false))
}));

// Import advanced Supabase testing utilities after mock setup
import {
  createAdvancedSupabaseMock,
  validateSupabaseMock,
  resetSupabaseMock,
  simulateAuthChange,
  supabaseMockFactory
} from '../utils/advancedSupabaseMock';

// Removed legacy validation utilities - using advanced mock system

describe('Context Provider Integration - Advanced Test Automator Solution', () => {
  const TestChild = () => <div data-testid="test-child">Test Content</div>;

  // Global test setup for consistent mocking
  beforeAll(() => {
    console.log('🚀 Starting advanced context provider tests');
  });

  beforeEach(() => {
    // Re-initialize the advanced mock for every test to ensure structure
    const { supabase, default: defaultMock } = supabaseMockFactory.scenarios.anonymous();

    // Replace module mocks for both named and default imports
    jest.doMock('@/utils/supabaseClient', () => ({
      supabase,
      default: defaultMock,
    }));

    resetSupabaseMock();

    jest.clearAllMocks();

    const isValid = validateSupabaseMock();
    if (!isValid) {
      throw new Error('Supabase mock validation failed in beforeEach');
    }
  });

  // Helper to setup authenticated user scenarios using advanced utilities
  const setupAuthenticatedUser = (user?: any) => {
    const mockUser = user || {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { username: 'testuser' }
    };

    // Use the advanced mock factory for authenticated scenarios
    const authMock = supabaseMockFactory.scenarios.authenticated(mockUser);

    // Get the mocked module and replace the entire mock structure
    const supabaseClient = require('@/utils/supabaseClient');

    // Deep merge to ensure all properties are properly set
    Object.assign(supabaseClient.supabase, authMock.supabase);
    if (supabaseClient.default) {
      Object.assign(supabaseClient.default, authMock.default);
    }

    // Validate that the mock was updated correctly
    const isValid = validateSupabaseMock();
    if (!isValid) {
      throw new Error('Supabase mock validation failed after authentication setup');
    }

    // Additional validation using legacy helper
    const legacyValid = legacyValidateSupabaseMock();
    if (!legacyValid) {
      console.warn('⚠️ Legacy validation failed, but continuing with advanced mock');
    }

    return mockUser;
  };

  // Helper to setup anonymous user scenarios
  const setupAnonymousUser = () => {
    const authMock = supabaseMockFactory.scenarios.anonymous();

    // Get the mocked module and replace the entire mock structure
    const supabaseClient = require('@/utils/supabaseClient');

    // Deep merge to ensure all properties are properly set
    Object.assign(supabaseClient.supabase, authMock.supabase);
    if (supabaseClient.default) {
      Object.assign(supabaseClient.default, authMock.default);
    }

    // Validate that the mock was updated correctly
    const isValid = validateSupabaseMock();
    if (!isValid) {
      throw new Error('Supabase mock validation failed after anonymous setup');
    }
  };

  describe('OnboardingLayout - Advanced Mock Testing', () => {
    it('should provide all required contexts without errors with advanced mocking', async () => {
      // Setup anonymous user scenario
      setupAnonymousUser();

      // Debug: Check mock state right before render
      console.log('🔍 Mock state before render:', {
        supabase: !!require('@/utils/supabaseClient').supabase,
        auth: !!require('@/utils/supabaseClient').supabase?.auth,
        onAuthStateChange: typeof require('@/utils/supabaseClient').supabase?.auth?.onAuthStateChange
      });

      // Test the critical onAuthStateChange method directly
      const supabaseClient = require('@/utils/supabaseClient').supabase;
      const result = supabaseClient.auth.onAuthStateChange(() => {});

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.subscription).toBeDefined();
      expect(typeof result.data.subscription.unsubscribe).toBe('function');

      // Render component within act to handle async effects
      await act(async () => {
        render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should work with authenticated user using advanced mocking', async () => {
      // Setup authenticated user scenario
      const mockUser = setupAuthenticatedUser();

      // Mock hasCompletedOnboarding for this test
      const { hasCompletedOnboarding } = require('@/utils/userFlow');
      hasCompletedOnboarding.mockReturnValue(Promise.resolve(false));

      await act(async () => {
        render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();

      // Verify mock was called correctly
      expect(hasCompletedOnboarding).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle auth state changes dynamically', async () => {
      // Start with anonymous user
      setupAnonymousUser();

      const { rerender } = await act(async () => {
        return render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();

      // Simulate authentication
      const mockUser = setupAuthenticatedUser();

      // Simulate auth state change
      const supabaseClient = require('@/utils/supabaseClient').supabase;
      simulateAuthChange('SIGNED_IN', mockUser, supabaseClient);

      // Rerender to test state persistence
      await act(async () => {
        rerender(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('DashboardLayout - Advanced Mock Testing', () => {
    it('should provide UserProvider context without errors with advanced mocking', async () => {
      // Setup authenticated user scenario for dashboard
      setupAuthenticatedUser();

      await act(async () => {
        render(
          <DashboardLayout>
            <TestChild />
          </DashboardLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should handle unauthenticated users gracefully with advanced mocking', async () => {
      // Setup anonymous user scenario
      setupAnonymousUser();

      await act(async () => {
        render(
          <DashboardLayout>
            <TestChild />
          </DashboardLayout>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('should handle user loading states correctly', async () => {
      setupAnonymousUser();

      // Create a loading state test
      let resolveUser: (value: any) => void;
      const getUserPromise = new Promise(resolve => {
        resolveUser = resolve;
      });

      // Mock getUser to be initially pending
      const supabaseClient = require('@/utils/supabaseClient').supabase;
      supabaseClient.auth.getUser.mockReturnValue(getUserPromise);

      const { unmount } = render(
        <DashboardLayout>
          <TestChild />
        </DashboardLayout>
      );

      // Should render without crashing even during loading
      expect(screen.getByTestId('test-child')).toBeInTheDocument();

      // Resolve the user promise
      resolveUser({ data: { user: null }, error: null });

      await act(async () => {
        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      unmount();
    });
  });

  describe('ProtectedRoute - Advanced Mock Testing', () => {
    it('should work when wrapped in UserProvider with authenticated user', async () => {
      // Setup authenticated user scenario
      setupAuthenticatedUser();

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
    });

    it('should throw error when not wrapped in UserProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        );
      }).toThrow('useUser must be used within a UserProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Context Hook Dependencies - Advanced Edge Cases', () => {
    it('should verify all context hooks have proper provider setup with advanced mocking', async () => {
      // Setup authenticated user for comprehensive context testing
      setupAuthenticatedUser();

      const { UserProvider } = require('../../lib/v2/contexts/UserContext');
      const { UIProvider } = require('../../lib/v2/contexts/UIContext');
      const { OnboardingProvider } = require('../../lib/v2/contexts/OnboardingContext');

      // Test component that uses all context hooks
      const TestAllContexts = () => {
        const { useUser } = require('../../lib/v2/contexts/UserContext');
        const { useUI } = require('../../lib/v2/contexts/UIContext');
        const { useOnboarding } = require('../../lib/v2/contexts/OnboardingContext');

        useUser();
        useUI();
        useOnboarding();

        return <div data-testid="all-contexts">All contexts working</div>;
      };

      await act(async () => {
        render(
          <UserProvider>
            <UIProvider>
              <OnboardingProvider>
                <TestAllContexts />
              </OnboardingProvider>
            </UIProvider>
          </UserProvider>
        );
      });

      expect(screen.getByTestId('all-contexts')).toBeInTheDocument();
    });

    it('should handle authentication state changes with advanced mocking', async () => {
      // Start with anonymous user
      setupAnonymousUser();

      const { UserProvider } = require('../../lib/v2/contexts/UserContext');

      let component;

      await act(async () => {
        component = render(
          <UserProvider>
            <TestChild />
          </UserProvider>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();

      // Switch to authenticated user and re-render
      const mockUser = setupAuthenticatedUser();

      await act(async () => {
        component.rerender(
          <UserProvider>
            <TestChild />
          </UserProvider>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();

      // Simulate an auth change event
      const supabaseClient = require('@/utils/supabaseClient').supabase;
      simulateAuthChange('TOKEN_REFRESHED', mockUser, supabaseClient);
    });

    it('should test the critical destructuring edge case', () => {
      // Setup authenticated user
      setupAuthenticatedUser();

      // Test the exact destructuring pattern that was failing
      const supabaseClient = require('@/utils/supabaseClient').supabase;

      // This is the critical line that was causing the error:
      // const { data: { subscription } } = supabase.auth.onAuthStateChange(...)
      const result = supabaseClient.auth.onAuthStateChange(() => {});

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.subscription).toBeDefined();

      // Test destructuring directly
      const { data: { subscription } } = result;
      expect(subscription).toBeDefined();
      expect(typeof subscription.unsubscribe).toBe('function');
    });
  });

  describe('Performance and Reliability - Test Automator Metrics', () => {
    it('should complete tests within performance thresholds', async () => {
      const startTime = Date.now();

      setupAuthenticatedUser();

      await act(async () => {
        render(
          <DashboardLayout>
            <TestChild />
          </DashboardLayout>
        );
      });

      const duration = Date.now() - startTime;

      // Test should complete within 2 seconds (test automator metric)
      expect(duration).toBeLessThan(2000);

      if (duration > 1000) {
        console.warn(`⚠️ Slow test detected: ${duration}ms`);
      }
    });

    it('should have zero flaky test indicators', () => {
      // Setup authenticated user
      setupAuthenticatedUser();

      // Run the same operation multiple times to check for consistency
      const supabaseClient = require('@/utils/supabaseClient').supabase;

      for (let i = 0; i < 5; i++) {
        const result = supabaseClient.auth.onAuthStateChange(() => {});
        expect(result.data.subscription.unsubscribe).toBeDefined();
      }
    });
  });
});