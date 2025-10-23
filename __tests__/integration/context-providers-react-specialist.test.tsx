import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';

// Import layouts that use context hooks
import OnboardingLayout from '../../app/(onboarding)/layout';
import DashboardLayout from '../../app/dashboard-v2/layout';

// Import components that use context hooks
import ProtectedRoute from '../../lib/v2/components/ProtectedRoute';

// Import React specialist test setup with persistent mocks
import { mockSupabase } from '../setup/supabaseSetup';

// Mock user flow utility to avoid async issues
jest.mock('@/utils/userFlow', () => ({
  hasCompletedOnboarding: jest.fn(() => Promise.resolve(false))
}));

describe('Context Provider Integration - React Specialist Solution', () => {
  const TestChild = () => <div data-testid="test-child">Test Content</div>;

  // Helper to setup authenticated user scenarios
  const setupAuthenticatedUser = () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { username: 'testuser' }
    };

    // Update global mock to return authenticated user
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
    it('should validate mock structure works correctly', () => {
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

    it('should validate getUser and getSession methods', async () => {
      const sessionResult = await mockSupabase.auth.getSession();
      expect(sessionResult.data.session).toBeNull();
      expect(sessionResult.error).toBeNull();

      const userResult = await mockSupabase.auth.getUser();
      expect(userResult.data.user).toBeNull();
      expect(userResult.error).toBeNull();
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

  describe('DashboardLayout', () => {
    it('should provide UserProvider context without errors', async () => {
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

    it('should handle unauthenticated users gracefully', async () => {
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
  });

  describe('ProtectedRoute', () => {
    it('should work when wrapped in UserProvider with authenticated user', async () => {
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

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
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

  describe('Context Hook Dependencies', () => {
    it('should verify all context hooks have proper provider setup', async () => {
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

    it('should handle authentication state changes', async () => {
      // Start with anonymous user
      setupAnonymousUser();

      const { UserProvider } = require('../../lib/v2/contexts/UserContext');

      await act(async () => {
        render(
          <UserProvider>
            <TestChild />
          </UserProvider>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();

      // Switch to authenticated user and re-render
      setupAuthenticatedUser();

      await act(async () => {
        render(
          <UserProvider>
            <TestChild />
          </UserProvider>
        );
      });

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });
});