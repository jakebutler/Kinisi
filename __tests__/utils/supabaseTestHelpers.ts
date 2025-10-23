/**
 * Advanced Supabase testing utilities
 * Implements patterns from test-automator expertise for robust authentication mocking
 */

import { createSupabaseMock, type SupabaseMockOverrides } from '../mocks/supabaseMock';

/**
 * Creates a Supabase mock that handles both direct and named import patterns
 */
export const createRobustSupabaseMock = (overrides?: SupabaseMockOverrides) => {
  const mock = createSupabaseMock(overrides);

  // Return structure that works with both import patterns:
  // import { supabase } from '@/utils/supabaseClient'
  // import supabase from '@/utils/supabaseClient'
  return {
    default: mock, // For default imports
    supabase: mock   // For named imports
  };
};

/**
 * Mock helper for authentication scenarios with proper session structure
 */
export const createAuthMock = (authenticated = false, user?: any) => {
  const mockUser = user || {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { username: 'testuser' }
  };

  return createRobustSupabaseMock({
    auth: {
      getSession: jest.fn(() => Promise.resolve({
        data: {
          session: authenticated ? { user: mockUser, access_token: 'test-token' } : null
        },
        error: null
      })),
      getUser: jest.fn(() => Promise.resolve({
        data: { user: authenticated ? mockUser : null },
        error: null
      })),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn()
          }
        }
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null }))
    }
  });
};

/**
 * Mock helper for database operations with proper query chaining
 */
export const createDatabaseMock = (tableData: Record<string, any[]>) => {
  const createQuery = (data: any[]) => {
    const query: any = {};
    query.select = jest.fn().mockReturnValue(query);
    query.eq = jest.fn().mockReturnValue(query);
    query.order = jest.fn().mockReturnValue(query);
    query.limit = jest.fn().mockReturnValue(query);
    query.maybeSingle = jest.fn().mockResolvedValue({ data, error: null });
    query.single = jest.fn().mockResolvedValue({ data, error: null });
    query.insert = jest.fn().mockReturnValue(query);
    query.update = jest.fn().mockReturnValue(query);
    return query;
  };

  return createRobustSupabaseMock({
    from: jest.fn().mockImplementation((table: string) => {
      return createQuery(tableData[table] || []);
    })
  });
};

/**
 * Validates that Supabase mocks are properly applied (test automator pattern)
 */
export const validateSupabaseMock = () => {
  try {
    const { supabase } = require('@/utils/supabaseClient');

    if (!supabase) {
      throw new Error('❌ Supabase mock not properly applied');
    }

    if (!supabase.auth) {
      throw new Error('❌ Supabase auth methods not mocked');
    }

    if (!supabase.from) {
      throw new Error('❌ Supabase database methods not mocked');
    }

    if (!supabase.auth.getSession || !supabase.auth.getUser || !supabase.auth.onAuthStateChange) {
      throw new Error('❌ Critical auth methods missing from mock');
    }

    console.log('✅ Supabase mock validation passed');
    return true;
  } catch (error) {
    console.error('❌ Supabase mock validation failed:', error.message);
    return false;
  }
};

/**
 * Comprehensive mock reset for test isolation (test automator pattern)
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.resetModules();

  // Reset any global state
  if (typeof global !== 'undefined') {
    delete (global as any).__supabase_mock;
  }
};

/**
 * Test data factories for realistic test scenarios
 */
export const createTestData = {
  user: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    user_metadata: { username: 'testuser' },
    ...overrides
  }),

  session: (user?: any) => ({
    user: user || createTestData.user(),
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    expires_in: 3600
  }),

  assessment: (overrides = {}) => ({
    id: 'test-assessment-id',
    user_id: 'test-user-id',
    survey_response_id: 'test-survey-id',
    assessment: 'Test assessment content',
    approved: false,
    created_at: new Date().toISOString(),
    ...overrides
  }),

  program: (overrides = {}) => ({
    id: 'test-program-id',
    user_id: 'test-user-id',
    status: 'draft',
    program_json: [
      {
        weekNumber: 1,
        goal: 'Foundation Building',
        sessions: [
          {
            id: 'test-session-id',
            name: 'Session 1',
            goal: 'Strength',
            exercises: [
              {
                id: 'test-exercise-id',
                name: 'Test Exercise',
                sets: 3,
                reps: '10-12',
                targetMuscles: ['test'],
                instructions: 'Test instructions'
              }
            ]
          }
        ]
      }
    ],
    created_at: new Date().toISOString(),
    ...overrides
  })
};

/**
 * Advanced mock configuration for complex scenarios
 */
export const createAdvancedMockConfig = {
  // Configure for different authentication states
  authentication: {
    anonymous: () => createAuthMock(false),
    authenticated: (user?: any) => createAuthMock(true, user),
    withExpiredSession: () => createAuthMock(true, createTestData.user({
      user_metadata: { session_expired: true }
    }))
  },

  // Configure for different database states
  database: {
    empty: () => createDatabaseMock({}),
    withData: (data: Record<string, any[]>) => createDatabaseMock(data),
    withError: (table: string, error: any) => createDatabaseMock({}).mockImplementation((t: string) => {
      const query = createQueryMock();
      if (t === table) {
        query.maybeSingle.mockResolvedValue({ data: null, error });
        query.single.mockResolvedValue({ data: null, error });
      }
      return query;
    })
  },

  // Configure for API simulation
  api: {
    successfulResponse: (data: any) => ({
      ok: true,
      status: 200,
      json: async () => data
    }),
    serverError: (status = 500, message = 'Server Error') => ({
      ok: false,
      status,
      json: async () => ({ error: message })
    }),
    networkError: () => Promise.reject(new Error('Network Error'))
  }
};

/**
 * Performance monitoring for test execution (test automator metric)
 */
export const trackTestPerformance = (testName: string, startTime: number) => {
  const endTime = Date.now();
  const duration = endTime - startTime;

  if (duration > 5000) {
    console.warn(`⚠️  Slow test detected: ${testName} took ${duration}ms`);
  }

  return { testName, startTime, endTime, duration };
};

/**
 * Self-healing test utilities (test automator pattern)
 */
export const createSelfHealingMocks = () => {
  // Add automatic retry logic for flaky network calls
  const originalFetch = global.fetch;

  (global as any).fetch = jest.fn().mockImplementation((...args) => {
    // Add automatic retry logic
    return originalFetch(...args).catch(async (error) => {
      // Retry once for network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return originalFetch(...args);
      }
      throw error;
    });
  });
};

export default {
  createRobustSupabaseMock,
  createAuthMock,
  createDatabaseMock,
  validateSupabaseMock,
  resetAllMocks,
  createTestData,
  createAdvancedMockConfig,
  trackTestPerformance,
  createSelfHealingMocks
};