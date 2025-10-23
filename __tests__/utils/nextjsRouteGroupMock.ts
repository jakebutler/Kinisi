/**
 * Next.js Route Group Mock System
 *
 * Addresses Next.js App Router route group mocking challenges.
 * Specifically handles (onboarding), (dashboard), etc. route groups.
 * Created by nextjs-developer subagent.
 */

import { jest } from '@jest/globals';

// Enhanced Supabase mock specifically for Next.js route groups
const createNextjsSupabaseMock = () => {
  const createImmutableSubscription = () => {
    const unsubscribe = jest.fn(() => {
      console.log('🔔 Next.js Route Group Mock: subscription unsubscribed');
    });

    return Object.freeze({
      unsubscribe,
      id: `nextjs-route-group-${Math.random().toString(36).substr(2, 9)}`,
      isActive: true
    });
  };

  const mockAuth = {
    // CRITICAL: onAuthStateChange that works in Next.js route groups
    onAuthStateChange: jest.fn().mockImplementation((callback: any) => {
      if (typeof callback !== 'function') {
        console.warn('⚠️ Next.js Route Group: invalid callback');
        return createImmutableResponse();
      }

      // Store callback for Next.js route group simulation
      (mockAuth as any)._nextjsRouteCallback = callback;

      // Simulate initial auth state for Next.js lifecycle
      setTimeout(() => {
        callback('INITIAL_SESSION', {
          user: {
            id: 'nextjs-test-user-id',
            email: 'test@example.com',
            user_metadata: { username: 'nextjs-testuser' }
          }
        });
      }, 0);

      return createImmutableResponse();
    }),

    getSession: jest.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'nextjs-test-user-id',
            email: 'test@example.com',
            user_metadata: { username: 'nextjs-testuser' }
          },
          access_token: 'nextjs-test-token'
        }
      },
      error: null
    }),

    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'nextjs-test-user-id',
          email: 'test@example.com',
          user_metadata: { username: 'nextjs-testuser' }
        }
      },
      error: null
    }),

    signOut: jest.fn().mockResolvedValue({ error: null })
  };

  // Create immutable response that prevents the undefined destructuring error
  const createImmutableResponse = () => {
    return Object.freeze({
      data: {
        subscription: createImmutableSubscription()
      }
    });
  };

  // Query builder that works with Next.js patterns
  const createNextjsQuery = () => {
    const query: any = {};

    // Chainable methods for Next.js compatibility
    query.select = jest.fn().mockImplementation(() => query);
    query.eq = jest.fn().mockImplementation(() => query);
    query.order = jest.fn().mockImplementation(() => query);
    query.limit = jest.fn().mockImplementation(() => query);
    query.single = jest.fn().mockResolvedValue({ data: null, error: null });
    query.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    query.insert = jest.fn().mockImplementation(() => query);
    query.update = jest.fn().mockImplementation(() => query);
    query.delete = jest.fn().mockImplementation(() => query);

    return query;
  };

  // Complete Next.js compatible Supabase mock
  const nextjsSupabaseMock = {
    auth: mockAuth,
    from: jest.fn().mockImplementation(() => createNextjsQuery())
  };

  return nextjsSupabaseMock;
};

/**
 * Route group detection for Next.js App Router
 */
export const isNextjsRouteGroup = (modulePath: string): boolean => {
  const routeGroupPattern = /\/app\/\(([^)]+)\)\/(.+)/;
  return routeGroupPattern.test(modulePath);
};

/**
 * Enhanced factory for Next.js route groups
 */
export const nextjsMockFactory = {
  /**
   * Create mock for Next.js route groups like (onboarding)
   */
  createRouteGroupMock: (overrides: any = {}) => {
    const mock = createNextjsSupabaseMock();

    // Apply route group specific overrides
    if (overrides.session) {
      mock.auth.getSession.mockResolvedValue({
        data: { session: overrides.session },
        error: null
      });
    }

    if (overrides.user) {
      mock.auth.getUser.mockResolvedValue({
        data: { user: overrides.user },
        error: null
      });
    }

    return {
      supabase: mock,
      default: mock
    };
  },

  /**
   * Create mock for authenticated user in route groups
   */
  authenticatedRouteGroup: (user?: any) => {
    const mockUser = user || {
      id: 'nextjs-route-user-id',
      email: 'nextjs-route@example.com',
      user_metadata: { username: 'nextjs-route-user' }
    };

    return nextjsMockFactory.createRouteGroupMock({
      user: mockUser,
      session: {
        user: mockUser,
        access_token: 'nextjs-route-token',
        refresh_token: 'nextjs-route-refresh-token'
      }
    });
  },

  /**
   * Create mock for anonymous user in route groups
   */
  anonymousRouteGroup: () => {
    return nextjsMockFactory.createRouteGroupMock({
      session: null,
      user: null
    });
  }
};

export default {
  createNextjsSupabaseMock,
  isNextjsRouteGroup,
  nextjsMockFactory
};