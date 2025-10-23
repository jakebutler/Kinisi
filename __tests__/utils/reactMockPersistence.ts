/**
 * React Mock Persistence Solution for Test Automator
 *
 * Addresses critical Jest mocking issues with React context providers:
 * - Mock persistence through React component lifecycle
 * - Consistent mock structure across module re-loads
 * - Self-healing capabilities for React rendering phases
 */

import { jest } from '@jest/globals';

// Global persistence registry that survives Jest reset operations
declare global {
  var __REACT_SUPABASE_MOCK_REGISTRY__: any;
  var __REACT_MOCK_PERSISTENCE_GUARD__: boolean;
}

// Initialize global registry if not exists
if (!global.__REACT_SUPABASE_MOCK_REGISTRY__) {
  global.__REACT_SUPABASE_MOCK_REGISTRY__ = new Map();
  global.__REACT_MOCK_PERSISTENCE_GUARD__ = false;
}

/**
 * Creates a self-healing Supabase mock that persists through React lifecycle
 */
export const createPersistentSupabaseMock = (overrides: any = {}) => {
  const registry = global.__REACT_SUPABASE_MOCK_REGISTRY__;

  // Create immutable subscription mock that can't be undefined
  const createImmutableSubscription = () => {
    const unsubscribe = jest.fn(() => {
      console.log('🔔 Persistent mock subscription unsubscribed');
    });

    return {
      data: {
        subscription: {
          unsubscribe,
          // Add additional properties to prevent undefined access
          subscriptionId: 'persistent-mock-subscription',
          isActive: true
        }
      }
    };
  };

  // Create persistent auth mock with self-healing capabilities
  const createPersistentAuth = () => {
    const authMock = {
      getSession: jest.fn().mockResolvedValue({
        data: { session: overrides.session || null },
        error: null
      }),

      getUser: jest.fn().mockResolvedValue({
        data: { user: overrides.user || null },
        error: null
      }),

      // CRITICAL: onAuthStateChange that never returns undefined
      onAuthStateChange: jest.fn().mockImplementation((callback: any) => {
        // Validate callback
        if (typeof callback !== 'function') {
          console.warn('⚠️ onAuthStateChange: invalid callback provided');
        }

        // Store callback for potential testing simulation
        (authMock as any)._storedCallback = callback;

        // Always return valid subscription structure
        return createImmutableSubscription();
      }),

      signOut: jest.fn().mockResolvedValue({ error: null })
    };

    return authMock;
  };

  // Create persistent query builder
  const createPersistentQuery = () => {
    const query: any = {};

    // Chainable methods that return the same instance
    const chainableMethods = [
      'select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
      'is', 'in', 'contains', 'containedBy', 'overlaps', 'textSearch',
      'match', 'not', 'or', 'filter', 'order', 'limit', 'range', 'single',
      'maybeSingle', 'insert', 'update', 'upsert', 'delete'
    ];

    chainableMethods.forEach(method => {
      query[method] = jest.fn().mockImplementation(() => {
        return query; // Always return same instance for chaining
      });
    });

    // Promise-returning methods with consistent structure
    query.single = jest.fn().mockResolvedValue({ data: null, error: null });
    query.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    query.csv = jest.fn().mockResolvedValue({ data: '', error: null });

    return query;
  };

  // Create the complete persistent mock
  const persistentMock = {
    auth: { ...createPersistentAuth(), ...overrides.auth },
    from: jest.fn().mockImplementation((table: string) => {
      return createPersistentQuery();
    }),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null })
  };

  // Register in global registry for persistence
  registry.set('supabase', persistentMock);

  // Add self-healing methods
  (persistentMock as any).__validate = () => validatePersistentMock(persistentMock);
  (persistentMock as any).__heal = () => healPersistentMock(persistentMock);
  (persistentMock as any).__reset = () => resetPersistentMock(persistentMock);

  // Prevent garbage collection
  Object.freeze(persistentMock.auth);
  Object.freeze(persistentMock.auth.onAuthStateChange);

  return persistentMock;
};

/**
 * Validates that the persistent mock is still intact
 */
export const validatePersistentMock = (mock?: any) => {
  try {
    const supabaseMock = mock || global.__REACT_SUPABASE_MOCK_REGISTRY__.get('supabase');

    if (!supabaseMock) {
      throw new Error('❌ Persistent Supabase mock not found in registry');
    }

    if (!supabaseMock.auth) {
      throw new Error('❌ Auth object missing from persistent mock');
    }

    if (!supabaseMock.auth.onAuthStateChange) {
      throw new Error('❌ onAuthStateChange method missing from persistent mock');
    }

    // Test the critical failing pattern
    const result = supabaseMock.auth.onAuthStateChange(() => {});

    if (!result) {
      throw new Error('❌ onAuthStateChange returned undefined');
    }

    if (!result.data) {
      throw new Error('❌ onAuthStateChange result.data is undefined');
    }

    if (!result.data.subscription) {
      throw new Error('❌ onAuthStateChange result.data.subscription is undefined');
    }

    if (typeof result.data.subscription.unsubscribe !== 'function') {
      throw new Error('❌ onAuthStateChange subscription.unsubscribe is not a function');
    }

    // Test destructuring pattern
    const { data: { subscription } } = result;
    if (!subscription || typeof subscription.unsubscribe !== 'function') {
      throw new Error('❌ Destructuring pattern failed');
    }

    console.log('✅ Persistent Supabase mock validation passed');
    return true;

  } catch (error) {
    console.error('❌ Persistent Supabase mock validation failed:', error.message);
    console.error('🔍 Attempting self-healing...');
    return false;
  }
};

/**
 * Self-healing mechanism for persistent mocks
 */
export const healPersistentMock = (mock?: any) => {
  try {
    const supabaseMock = mock || global.__REACT_SUPABASE_MOCK_REGISTRY__.get('supabase');

    if (!supabaseMock) {
      console.log('🔄 Creating new persistent mock during healing');
      return createPersistentSupabaseMock();
    }

    // Heal critical components
    if (!supabaseMock.auth || !supabaseMock.auth.onAuthStateChange) {
      console.log('🔄 Healing auth methods...');
      supabaseMock.auth = createPersistentSupabaseMock().auth;
    }

    // Re-register the healed mock
    global.__REACT_SUPABASE_MOCK_REGISTRY__.set('supabase', supabaseMock);

    console.log('✅ Persistent mock healing completed');
    return supabaseMock;

  } catch (error) {
    console.error('❌ Mock healing failed:', error.message);
    // Fallback to fresh mock
    return createPersistentSupabaseMock();
  }
};

/**
 * Reset persistent mock while maintaining structure
 */
export const resetPersistentMock = (mock?: any) => {
  const supabaseMock = mock || global.__REACT_SUPABASE_MOCK_REGISTRY__.get('supabase');

  if (supabaseMock) {
    // Clear call history but preserve structure
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

    // Reset to default values
    supabaseMock.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });

    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });
  }

  console.log('🔄 Persistent mock reset completed');
};

/**
 * React-specific mock factory that handles component lifecycle
 */
export const createReactCompatibleSupabaseMock = () => {
  console.log('🔧 Creating React-compatible persistent Supabase mock');

  // Create base persistent mock
  const persistentMock = createPersistentSupabaseMock();

  // Add React lifecycle guards
  const reactCompatibleMock = new Proxy(persistentMock, {
    get(target, prop) {
      // Guard against undefined access during React rendering
      const value = target[prop];

      if (value === undefined) {
        console.warn(`⚠️ Undefined property access: ${String(prop)}, healing mock...`);
        healPersistentMock(target);
        return target[prop]; // Return healed value
      }

      return value;
    },

    set(target, prop, value) {
      // Prevent accidental overriding of critical methods
      if (prop === 'auth' && value?.onAuthStateChange === undefined) {
        console.warn('⚠️ Prevented override of auth object with missing onAuthStateChange');
        return false;
      }

      target[prop] = value;
      return true;
    }
  });

  return reactCompatibleMock;
};

/**
 * Setup global React-compatible mock with automatic healing
 */
export const setupGlobalReactSupabaseMock = () => {
  console.log('🔧 Setting up global React-compatible Supabase mock');

  // Mock the module with React-compatible implementation
  jest.mock('@/utils/supabaseClient', () => {
    const mock = createReactCompatibleSupabaseMock();

    return {
      supabase: mock,
      default: mock
    };
  });

  // Setup lifecycle guards
  beforeAll(() => {
    global.__REACT_MOCK_PERSISTENCE_GUARD__ = true;
    console.log('🛡️ React mock persistence guard activated');
  });

  beforeEach(() => {
    // Reset but don't recreate
    resetPersistentMock();

    // Validate mock health
    if (!validatePersistentMock()) {
      healPersistentMock();
    }
  });

  afterEach(() => {
    // Validate after each test
    validatePersistentMock();
  });

  afterAll(() => {
    global.__REACT_MOCK_PERSISTENCE_GUARD__ = false;
    global.__REACT_SUPABASE_MOCK_REGISTRY__.clear();
    console.log('🧹 React mock persistence guard deactivated');
  });
};

/**
 * Pre-configured scenarios for common React testing patterns
 */
export const ReactMockScenarios = {
  anonymous: () => createReactCompatibleSupabaseMock(),

  authenticated: (user?: any) => {
    const mockUser = user || {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { username: 'testuser' }
    };

    return createPersistentSupabaseMock({
      session: {
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh-token'
      },
      user: mockUser
    });
  },

  withError: (method: string, error: any) => {
    const mock = createReactCompatibleSupabaseMock();

    if (method === 'getSession') {
      mock.auth.getSession.mockResolvedValue({ data: { session: null }, error });
    } else if (method === 'getUser') {
      mock.auth.getUser.mockResolvedValue({ data: { user: null }, error });
    }

    return mock;
  }
};

export default {
  createPersistentSupabaseMock,
  validatePersistentMock,
  healPersistentMock,
  resetPersistentMock,
  createReactCompatibleSupabaseMock,
  setupGlobalReactSupabaseMock,
  ReactMockScenarios
};