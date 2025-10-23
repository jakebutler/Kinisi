/**
 * Advanced Supabase Mocking Strategy - Test Automator Solution
 *
 * Addresses critical Jest mocking edge cases for authentication contexts:
 * - Mock persistence through React component lifecycle
 * - Proper mock structure matching Supabase API
 * - Module loading order and timing issues
 * - Robust validation and self-healing capabilities
 */

import { jest } from '@jest/globals';

// Global mock registry to ensure persistence across module loads
const mockRegistry = new Map();

/**
 * Advanced Supabase mock factory with enhanced persistence
 * Implements test automator patterns for robust authentication mocking
 */
export const createAdvancedSupabaseMock = (overrides: any = {}) => {
  // Create comprehensive query mock with full chaining support
  const createQueryMock = (mockData: any = null) => {
    const query: any = {};

    // Ensure all methods return the same query instance for chaining
    query.select = jest.fn().mockImplementation(() => query);
    query.eq = jest.fn().mockImplementation(() => query);
    query.order = jest.fn().mockImplementation(() => query);
    query.limit = jest.fn().mockImplementation(() => query);
    query.single = jest.fn().mockResolvedValue({ data: mockData, error: null });
    query.maybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    query.insert = jest.fn().mockImplementation(() => query);
    query.update = jest.fn().mockImplementation(() => query);
    query.delete = jest.fn().mockImplementation(() => query);

    return query;
  };

  // Create persistent subscription mock that survives component lifecycle
  const createSubscriptionMock = () => ({
    data: {
      subscription: {
        unsubscribe: jest.fn(() => {
          // Track unsubscription calls for cleanup validation
          console.log('🔔 Mock subscription unsubscribed');
        })
      }
    }
  });

  // Enhanced auth mock with proper return value structure
  const authMock = {
    getSession: jest.fn().mockResolvedValue({
      data: {
        session: overrides.session || null
      },
      error: null
    }),

    getUser: jest.fn().mockResolvedValue({
      data: {
        user: overrides.user || null
      },
      error: null
    }),

    // Critical fix: Ensure onAuthStateChange returns proper structure
    onAuthStateChange: jest.fn().mockImplementation((callback: any) => {
      // Validate callback is a function
      if (typeof callback !== 'function') {
        console.warn('⚠️ onAuthStateChange: callback is not a function');
        return createSubscriptionMock();
      }

      // Store callback for potential simulation in tests
      (authMock as any)._authChangeCallback = callback;

      return createSubscriptionMock();
    }),

    signOut: jest.fn().mockResolvedValue({
      error: null,
      data: {}
    })
  };

  // Complete Supabase mock structure
  const advancedMock = {
    auth: { ...authMock, ...overrides.auth },
    from: jest.fn().mockImplementation((table: string) => {
      // Create table-specific mock data handling
      const mockData = overrides.tableData?.[table] || null;
      return createQueryMock(mockData);
    })
  };

  // Register mock globally for persistence
  mockRegistry.set('supabase', advancedMock);

  // Add self-healing capabilities
  (advancedMock as any).__validate = () => validateSupabaseMock(advancedMock);
  (advancedMock as any).__reset = () => resetSupabaseMock(advancedMock);

  return advancedMock;
};

/**
 * Enhanced mock validation with detailed diagnostics
 */
export const validateSupabaseMock = (mock?: any) => {
  const supabaseMock = mock || mockRegistry.get('supabase');

  try {
    // Structure validation
    if (!supabaseMock) {
      throw new Error('❌ Supabase mock not found in registry');
    }

    // Auth validation
    if (!supabaseMock.auth) {
      throw new Error('❌ Supabase auth not mocked');
    }

    if (!supabaseMock.auth.onAuthStateChange) {
      throw new Error('❌ onAuthStateChange not mocked');
    }

    // Test the actual method execution
    const result = supabaseMock.auth.onAuthStateChange(() => {});
    if (!result || !result.data || !result.data.subscription) {
      throw new Error('❌ onAuthStateChange returns invalid structure');
    }

    if (typeof result.data.subscription.unsubscribe !== 'function') {
      throw new Error('❌ subscription.unsubscribe is not a function');
    }

    console.log('✅ Advanced Supabase mock validation passed');
    console.log('📊 Mock registry size:', mockRegistry.size);

    return true;
  } catch (error) {
    console.error('❌ Advanced Supabase mock validation failed:', error.message);
    console.error('🔍 Mock state:', JSON.stringify(supabaseMock, null, 2));
    return false;
  }
};

/**
 * Reset specific mock while maintaining registry
 */
export const resetSupabaseMock = (mock?: any) => {
  const supabaseMock = mock || mockRegistry.get('supabase');

  if (supabaseMock) {
    // Clear all mock call history
    if (jest.isMockFunction(supabaseMock.auth.getSession)) {
      supabaseMock.auth.getSession.mockClear();
    }
    if (jest.isMockFunction(supabaseMock.auth.getUser)) {
      supabaseMock.auth.getUser.mockClear();
    }
    if (jest.isMockFunction(supabaseMock.auth.onAuthStateChange)) {
      supabaseMock.auth.onAuthStateChange.mockClear();
    }
    if (jest.isMockFunction(supabaseMock.from)) {
      supabaseMock.from.mockClear();
    }
  }

  console.log('🔄 Supabase mock reset completed');
};

/**
 * Simulate authentication state changes for testing
 */
export const simulateAuthChange = (event: string, session: any, supabaseMock?: any) => {
  const mock = supabaseMock || mockRegistry.get('supabase');
  const callback = (mock as any)?._authChangeCallback;

  if (callback && typeof callback === 'function') {
    try {
      // Simulate async behavior without setTimeout to avoid emittery issues
      setImmediate(() => {
        try {
          callback(event, session);
          console.log(`🔄 Simulated auth change: ${event}`);
        } catch (error) {
          console.error('❌ Error in auth change callback:', error);
        }
      });
    } catch (error) {
      console.error('❌ Error scheduling auth change:', error);
      // Fallback: call synchronously
      try {
        callback(event, session);
        console.log(`🔄 Simulated auth change (sync): ${event}`);
      } catch (syncError) {
        console.error('❌ Error in sync auth change:', syncError);
      }
    }
  } else {
    console.warn('⚠️ No auth callback registered to simulate');
  }
};

/**
 * Jest mock factory with proper module handling
 */
export const supabaseMockFactory = {
  /**
   * Create mock that works with both import patterns
   */
  createMock: (overrides?: any) => {
    const mock = createAdvancedSupabaseMock(overrides);

    return {
      // For named imports: import { supabase } from '@/utils/supabaseClient'
      supabase: mock,

      // For default imports: import supabase from '@/utils/supabaseClient'
      default: mock
    };
  },

  /**
   * Pre-configured mocks for common scenarios
   */
  scenarios: {
    anonymous: () => supabaseMockFactory.createMock({
      session: null,
      user: null
    }),

    authenticated: (user?: any) => supabaseMockFactory.createMock({
      user: user || {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' }
      },
      session: {
        user: user || {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: { username: 'testuser' }
        },
        access_token: 'test-token',
        refresh_token: 'test-refresh-token'
      }
    }),

    withTableData: (tableData: Record<string, any[]>) => supabaseMockFactory.createMock({
      tableData
    })
  }
};

/**
 * Global test setup for consistent mocking across all tests
 */
export const setupGlobalSupabaseMock = () => {
  // Mock the entire module with proper structure
  jest.mock('@/utils/supabaseClient', () => {
    const mock = createAdvancedSupabaseMock();

    return {
      supabase: mock,
      default: mock
    };
  });

  // Ensure mock persistence across test runs
  beforeAll(() => {
    console.log('🔧 Setting up global Supabase mock');
  });

  beforeEach(() => {
    // Reset but don't recreate the mock
    resetSupabaseMock();
  });

  afterAll(() => {
    mockRegistry.clear();
    console.log('🧹 Supabase mock registry cleared');
  });
};

export default {
  createAdvancedSupabaseMock,
  validateSupabaseMock,
  resetSupabaseMock,
  simulateAuthChange,
  supabaseMockFactory,
  setupGlobalSupabaseMock
};