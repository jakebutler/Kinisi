/**
 * Testing utilities for React components with context providers
 * Provides consistent wrapper patterns for complex integration tests
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { UserProvider } from '@/lib/v2/contexts/UserContext';
import { UIProvider } from '@/lib/v2/contexts/UIContext';
import { OnboardingProvider } from '@/lib/v2/contexts/OnboardingContext';
import { supabaseMockFactory } from '../mocks/supabaseMock';

// Mock user flow utility consistently across tests
jest.mock('@/utils/userFlow', () => ({
  hasCompletedOnboarding: jest.fn(() => Promise.resolve(false))
}));

// Mock Next.js navigation consistently
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => ({ get: () => null }),
}));

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withUserProvider?: boolean;
  withUIProvider?: boolean;
  withOnboardingProvider?: boolean;
  supabaseOverrides?: any;
  initialUserState?: any;
}

/**
 * Custom render function with configurable provider wrapping
 */
const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    withUserProvider = true,
    withUIProvider = true,
    withOnboardingProvider = true,
    supabaseOverrides,
    initialUserState,
    ...renderOptions
  } = options;

  // Setup Supabase mock if overrides provided
  if (supabaseOverrides) {
    jest.doMock('@/utils/supabaseClient', () =>
      supabaseMockFactory.namedImport(supabaseOverrides)
    );
  }

  const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    let content = children;

    if (withOnboardingProvider) {
      content = <OnboardingProvider>{content}</OnboardingProvider>;
    }

    if (withUIProvider) {
      content = <UIProvider>{content}</UIProvider>;
    }

    if (withUserProvider) {
      content = <UserProvider>{content}</UserProvider>;
    }

    return <>{content}</>;
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

/**
 * Renders with all context providers (most common scenario)
 */
export const renderWithAllProviders = (ui: ReactElement, options?: CustomRenderOptions) => {
  return customRender(ui, {
    withUserProvider: true,
    withUIProvider: true,
    withOnboardingProvider: true,
    ...options
  });
};

/**
 * Renders with only UserProvider (for user-specific components)
 */
export const renderWithUserProvider = (ui: ReactElement, options?: CustomRenderOptions) => {
  return customRender(ui, {
    withUserProvider: true,
    withUIProvider: false,
    withOnboardingProvider: false,
    ...options
  });
};

/**
 * Renders with no providers (for isolated component testing)
 */
export const renderWithoutProviders = (ui: ReactElement, options?: CustomRenderOptions) => {
  return customRender(ui, {
    withUserProvider: false,
    withUIProvider: false,
    withOnboardingProvider: false,
    ...options
  });
};

/**
 * Creates a test user state for consistent testing
 */
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  status: 'active' as const,
  ...overrides
});

/**
 * Setup function for common test scenarios
 */
export const setupTestEnvironment = (scenario: 'anonymous' | 'authenticated' | 'onboarding' = 'anonymous') => {
  switch (scenario) {
    case 'anonymous':
      return {
        user: null,
        userStatus: 'onboarding' as const,
        supabaseMock: supabaseMockFactory.namedImport()
      };

    case 'authenticated':
      const authenticatedUser = createTestUser();
      return {
        user: authenticatedUser,
        userStatus: 'active' as const,
        supabaseMock: supabaseMockFactory.namedImport({
          auth: {
            getSession: () => Promise.resolve({
              data: { session: { user: authenticatedUser } },
              error: null
            }),
            getUser: () => Promise.resolve({
              data: { user: authenticatedUser },
              error: null
            })
          }
        })
      };

    case 'onboarding':
      const onboardingUser = createTestUser({ status: 'onboarding' });
      return {
        user: onboardingUser,
        userStatus: 'onboarding' as const,
        supabaseMock: supabaseMockFactory.namedImport({
          auth: {
            getSession: () => Promise.resolve({
              data: { session: { user: onboardingUser } },
              error: null
            }),
            getUser: () => Promise.resolve({
              data: { user: onboardingUser },
              error: null
            })
          }
        })
      };

    default:
      return {
        user: null,
        userStatus: 'onboarding' as const,
        supabaseMock: supabaseMockFactory.namedImport()
      };
  }
};

/**
 * Mock validation utilities
 */
export const validateMocks = () => {
  const { supabase } = require('@/utils/supabaseClient');

  if (!supabase) {
    throw new Error('Supabase mock not properly applied');
  }

  if (!supabase.auth) {
    throw new Error('Supabase auth mock not properly configured');
  }

  if (!supabase.from) {
    throw new Error('Supabase from mock not properly configured');
  }
};

/**
 * Cleanup utilities for test isolation
 */
export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.resetModules();
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };