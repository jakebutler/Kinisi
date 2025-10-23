/**
 * Centralized Supabase mocking utilities
 * Provides consistent mock structure across all test files
 */

export interface SupabaseMockOverrides {
  auth?: Partial<{
    getSession: jest.Mock;
    getUser: jest.Mock;
    onAuthStateChange: jest.Mock;
    signOut: jest.Mock;
  }>;
  from?: jest.Mock;
}

export interface QueryMockOverrides {
  data?: any;
  error?: any;
}

/**
 * Creates a chainable query mock that supports Supabase's query builder pattern
 */
export const createQueryMock = (overrides: QueryMockOverrides = {}) => {
  const { data = null, error = null } = overrides;

  const query: any = {};
  query.select = jest.fn().mockReturnValue(query);
  query.eq = jest.fn().mockReturnValue(query);
  query.order = jest.fn().mockReturnValue(query);
  query.limit = jest.fn().mockReturnValue(query);
  query.maybeSingle = jest.fn().mockResolvedValue({ data, error });
  query.single = jest.fn().mockResolvedValue({ data, error });
  query.insert = jest.fn().mockReturnValue(query);
  query.update = jest.fn().mockReturnValue(query);
  query.delete = jest.fn().mockReturnValue(query);

  return query;
};

/**
 * Creates a comprehensive Supabase mock with customizable overrides
 */
export const createSupabaseMock = (overrides: SupabaseMockOverrides = {}) => {
  const defaultAuth = {
    getSession: jest.fn(() => Promise.resolve({
      data: { session: null },
      error: null
    })),
    getUser: jest.fn(() => Promise.resolve({
      data: { user: null },
      error: null
    })),
    onAuthStateChange: jest.fn(() => ({
      data: {
        subscription: { unsubscribe: jest.fn() }
      }
    })),
    signOut: jest.fn(() => Promise.resolve({ error: null }))
  };

  const mockSupabase = {
    auth: { ...defaultAuth, ...overrides.auth },
    from: overrides.from || jest.fn(() => createQueryMock())
  };

  // Attach helpers for test customization
  (mockSupabase as any).__createQuery = createQueryMock;
  (mockSupabase as any).__resetAllMocks = () => {
    Object.values(mockSupabase.auth).forEach(mock => {
      if (jest.isMockFunction(mock)) mock.mockClear();
    });
    if (jest.isMockFunction(mockSupabase.from)) mockSupabase.from.mockClear();
  };

  return mockSupabase;
};

/**
 * Creates a Supabase mock for authenticated user scenarios
 */
export const createAuthenticatedSupabaseMock = (user: any = null, overrides: SupabaseMockOverrides = {}) => {
  const mockUser = user || {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { username: 'testuser' }
  };

  return createSupabaseMock({
    auth: {
      getSession: jest.fn(() => Promise.resolve({
        data: { session: { user: mockUser } },
        error: null
      })),
      getUser: jest.fn(() => Promise.resolve({
        data: { user: mockUser },
        error: null
      })),
      ...overrides.auth
    },
    ...overrides
  });
};

/**
 * Mock factory for different Supabase import patterns
 */
export const supabaseMockFactory = {
  /**
   * For tests that import: `import { supabase } from '@/utils/supabaseClient'`
   */
  namedImport: (overrides?: SupabaseMockOverrides) => ({
    supabase: createSupabaseMock(overrides)
  }),

  /**
   * For tests that import: `import supabase from '@/utils/supabaseClient'`
   */
  defaultImport: (overrides?: SupabaseMockOverrides) => createSupabaseMock(overrides),

  /**
   * For tests that need database query mocking
   */
  withDatabaseQueries: (tableData: Record<string, any[]>, overrides?: SupabaseMockOverrides) => {
    const mock = createSupabaseMock(overrides);
    mock.from = jest.fn().mockImplementation((table: string) => {
      const data = tableData[table] || [];
      return createQueryMock({ data });
    });
    return mock;
  }
};