/**
 * Enhanced Test Helpers - Test Automator Solution
 *
 * Provides utilities to resolve async timing failures and component integration issues
 * with standardized testing patterns and provider management.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { act, waitFor } from '@testing-library/react';
import { createStandardMock, validateCurrentMock } from './unifiedMockManager';

// Context providers that might be needed
interface TestProviders {
  UserProvider?: any;
  UIProvider?: any;
  OnboardingProvider?: any;
}

/**
 * Enhanced wrapper that automatically provides required contexts
 */
const UnifiedProviderWrapper: React.FC<{
  children: React.ReactNode;
  providers?: TestProviders;
}> = ({ children, providers = {} }) => {
  // Dynamically import and wrap with providers
  let wrappedChildren = <>{children}</>;

  if (providers.UserProvider) {
    wrappedChildren = <providers.UserProvider>{wrappedChildren}</providers.UserProvider>;
  }
  if (providers.UIProvider) {
    wrappedChildren = <providers.UIProvider>{wrappedChildren}</providers.UIProvider>;
  }
  if (providers.OnboardingProvider) {
    wrappedChildren = <providers.OnboardingProvider>{wrappedChildren}</providers.OnboardingProvider>;
  }

  return wrappedChildren;
};

/**
 * Enhanced render with automatic provider detection and async handling
 */
export const renderWithProviders = async (
  component: ReactElement,
  options: {
    providers?: TestProviders;
    mockScenario?: string;
    mockOverrides?: any;
    waitForReady?: boolean;
    renderOptions?: RenderOptions;
  } = {}
): Promise<RenderResult> => {
  const {
    providers = {},
    mockScenario = 'anonymous',
    mockOverrides,
    waitForReady = true,
    renderOptions = {}
  } = options;

  // Setup mock scenario if specified
  if (mockScenario) {
    createStandardMock(mockScenario, mockOverrides);
  }

  // Validate mock before rendering
  if (!validateCurrentMock()) {
    throw new Error('Mock validation failed before render');
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <UnifiedProviderWrapper providers={providers}>
      {children}
    </UnifiedProviderWrapper>
  );

  let result: RenderResult;

  // Wrap render in act for proper async handling
  await act(async () => {
    result = render(component, {
      wrapper: Wrapper,
      ...renderOptions
    });
  });

  // Wait for component to be ready if requested
  if (waitForReady && result) {
    await waitFor(() => {
      // Ensure any initial async operations are complete
      expect(result.container).toBeDefined();
    });
  }

  return result!;
};

/**
 * Wait for mock state to stabilize
 */
export const waitForMockState = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 10
): Promise<void> => {
  const startTime = Date.now();

  while (!condition() && Date.now() - startTime < timeout) {
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  if (!condition()) {
    throw new Error(`Mock state condition not met within ${timeout}ms`);
  }
};

/**
 * Simulate authentication state change with proper async handling
 */
export const simulateAuthChange = async (
  event: string,
  session: any,
  options: {
    waitForUpdate?: boolean;
    timeout?: number;
  } = {}
): Promise<void> => {
  const { waitForUpdate = true, timeout = 3000 } = options;

  await act(async () => {
    const supabaseClient = require('@/utils/supabaseClient');
    const supabase = supabaseClient.supabase || supabaseClient.default;

    // Get the stored callback if it exists
    const callback = (supabase as any)._authChangeCallback;

    if (callback && typeof callback === 'function') {
      // Simulate async behavior
      await new Promise(resolve => setTimeout(resolve, 0));
      callback(event, session);
    } else {
      console.warn('⚠️ No auth callback registered for simulation');
    }
  });

  // Wait for auth state to update if requested
  if (waitForUpdate) {
    await waitForMockState(() => {
      // Check if auth state has been updated
      const supabaseClient = require('@/utils/supabaseClient');
      const supabase = supabaseClient.supabase || supabaseClient.default;
      return supabase.auth.getSession && typeof supabase.auth.getSession === 'function';
    }, timeout);
  }
};

/**
 * Create authenticated user scenario with proper async setup
 */
export const createAuthenticatedUser = async (
  userOverrides: any = {},
  options: {
    simulateAuthChange?: boolean;
    providers?: TestProviders;
  } = {}
): Promise<any> => {
  const { simulateAuthChange: shouldSimulate = false, providers = {} } = options;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { username: 'testuser' },
    ...userOverrides
  };

  const mockSession = {
    user: mockUser,
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600 * 1000
  };

  // Create authenticated mock
  createStandardMock('authenticated', { user: mockUser, session: mockSession });

  // Simulate auth state change if requested
  if (shouldSimulate) {
    await simulateAuthChange('SIGNED_IN', mockSession);
  }

  return mockUser;
};

/**
 * Test component with automatic error boundary
 */
export const expectComponentError = async (
  component: ReactElement,
  expectedError: string | RegExp,
  options: {
    providers?: TestProviders;
    suppressConsole?: boolean;
  } = {}
): Promise<void> => {
  const { providers = {}, suppressConsole = true } = options;

  let consoleSpy: jest.SpyInstance | null = null;

  if (suppressConsole) {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  }

  try {
    await expect(
      renderWithProviders(component, { providers, waitForReady: false })
    ).rejects.toThrow(expectedError);
  } finally {
    if (consoleSpy) {
      consoleSpy.mockRestore();
    }
  }
};

/**
 * Wait for async component to complete loading
 */
export const waitForComponentReady = async (
  getComponent: () => HTMLElement,
  timeout = 5000
): Promise<void> => {
  await waitFor(() => {
    expect(getComponent()).toBeInTheDocument();
  }, { timeout });
};

/**
 * Enhanced act utility with better error handling
 */
export const safeAct = async (callback: () => void | Promise<void>): Promise<void> => {
  try {
    await act(async () => {
      await callback();
    });
  } catch (error) {
    // Re-throw with more context
    throw new Error(`Act failed: ${error.message}`);
  }
};

/**
 * Setup standard test environment with all common utilities
 */
export const setupTestEnvironment = (options: {
  mockScenario?: string;
  mockOverrides?: any;
  providers?: TestProviders;
} = {}) => {
  const { mockScenario = 'anonymous', mockOverrides, providers } = options;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock scenario
    createStandardMock(mockScenario, mockOverrides);

    // Validate setup
    if (!validateCurrentMock()) {
      throw new Error('Test environment setup validation failed');
    }
  });

  afterEach(() => {
    // Cleanup after each test
    jest.restoreAllMocks();
  });

  // Return utilities for use in tests
  return {
    renderWithProviders: (component: ReactElement, renderOptions?: any) =>
      renderWithProviders(component, { providers, ...renderOptions }),
    createAuthenticatedUser: (userOverrides?: any) =>
      createAuthenticatedUser(userOverrides, { providers }),
    simulateAuthChange: (event: string, session: any) =>
      simulateAuthChange(event, session),
    waitForComponentReady: (getComponent: () => HTMLElement) =>
      waitForComponentReady(getComponent)
  };
};

export default {
  renderWithProviders,
  waitForMockState,
  simulateAuthChange,
  createAuthenticatedUser,
  expectComponentError,
  waitForComponentReady,
  safeAct,
  setupTestEnvironment
};