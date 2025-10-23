import React from 'react';
import { render, screen } from '@testing-library/react';

// Import all layouts that use context hooks
import OnboardingLayout from '../../app/(onboarding)/layout';
import DashboardLayout from '../../app/dashboard-v2/layout';

// Import components that use context hooks
import ProtectedRoute from '../../lib/v2/components/ProtectedRoute';

// Mock user flow utility to avoid async issues in contexts
jest.mock('@/utils/userFlow', () => ({
  hasCompletedOnboarding: jest.fn(() => Promise.resolve(false))
}));

// Mock Supabase client using correct structure to fix destructuring issues
jest.mock('@/utils/supabaseClient', () => {
  const createQueryMock = (overrides = {}) => {
    const { data = null, error = null } = overrides;
    const q: any = {};
    q.select = jest.fn().mockReturnValue(q);
    q.eq = jest.fn().mockReturnValue(q);
    q.order = jest.fn().mockReturnValue(q);
    q.limit = jest.fn().mockReturnValue(q);
    q.maybeSingle = jest.fn().mockResolvedValue({ data, error });
    q.single = jest.fn().mockResolvedValue({ data, error });
    return q;
  };

  return {
    supabase: {
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } }
        })),
        signOut: jest.fn(() => Promise.resolve({ error: null }))
      },
      from: jest.fn(() => createQueryMock())
    }
  };
});

describe('Context Provider Integration', () => {
  const TestChild = () => <div data-testid="test-child">Test Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OnboardingLayout', () => {
    it('should provide all required contexts without errors', () => {
      expect(() => {
        render(
          <OnboardingLayout>
            <TestChild />
          </OnboardingLayout>
        );
      }).not.toThrow();

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('DashboardLayout', () => {
    it('should provide UserProvider context without errors', () => {
      expect(() => {
        render(
          <DashboardLayout>
            <TestChild />
          </DashboardLayout>
        );
      }).not.toThrow();

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('ProtectedRoute', () => {
    it('should work when wrapped in UserProvider', () => {
      const { UserProvider } = require('../../lib/v2/contexts/UserContext');

      expect(() => {
        render(
          <UserProvider>
            <ProtectedRoute>
              <TestChild />
            </ProtectedRoute>
          </UserProvider>
        );
      }).not.toThrow();
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
    it('should verify all context hooks have proper provider setup', () => {
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

      expect(() => {
        render(
          <UserProvider>
            <UIProvider>
              <OnboardingProvider>
                <TestAllContexts />
              </OnboardingProvider>
            </UIProvider>
          </UserProvider>
        );
      }).not.toThrow();

      expect(screen.getByTestId('all-contexts')).toBeInTheDocument();
    });
  });
});
