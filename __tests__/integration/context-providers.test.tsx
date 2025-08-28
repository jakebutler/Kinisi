import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Import all layouts that use context hooks
import OnboardingLayout from '../../app/(onboarding)/layout';
import DashboardLayout from '../../app/(dashboard)/layout';

// Import components that use context hooks
import ProtectedRoute from '../../lib/v2/components/ProtectedRoute';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/test'
  })
}));

// Mock Supabase client
jest.mock('@/utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signOut: jest.fn(() => Promise.resolve())
    }
  }
}));

describe('Context Provider Integration', () => {
  const TestChild = () => <div data-testid="test-child">Test Content</div>;

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
