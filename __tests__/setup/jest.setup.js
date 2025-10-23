/**
 * Advanced Jest Setup - Test Automator Configuration
 *
 * This setup file ensures consistent, robust mocking across all tests
 * with special handling for Supabase authentication edge cases.
 */

// Import advanced mocking utilities
const { setupGlobalSupabaseMock } = require('../utils/advancedSupabaseMock');

// Set up global mocks before all tests
setupGlobalSupabaseMock();

// Global test environment setup
beforeAll(() => {
  // Mock console methods to reduce noise in test output
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    // Filter out specific warnings that are expected in test environment
    const message = args[0];
    if (typeof message === 'string' &&
        (message.includes('act()') ||
         message.includes('React') ||
         message.includes('validateDOM Nesting'))) {
      return;
    }
    console.warn(...args);
  });

  // Mock window.matchMedia for responsive testing
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock ResizeObserver for component testing
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock IntersectionObserver for visibility testing
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Set up proper environment variables for testing
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

beforeEach(() => {
  // Reset global state between tests
  jest.clearAllTimers();
  jest.useFakeTimers();

  // Ensure clean DOM state
  document.body.innerHTML = '';

  // Reset any global mocks
  if (global.fetch) {
    global.fetch.mockClear();
  }
});

afterEach(() => {
  // Restore real timers
  jest.useRealTimers();

  // Clean up any remaining DOM elements
  document.body.innerHTML = '';
});

afterAll(() => {
  // Restore all mocked global objects
  console.warn.mockRestore();

  // Clean up global mock registries
  if (global.__supabase_mock_registry) {
    global.__supabase_mock_registry.clear();
  }
});

// Enhanced error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global test timeout (test automator best practice)
jest.setTimeout(10000);

// Enhanced mock for fetch API with retry logic
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  })
);

// Mock Next.js router for component testing
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation for app router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

console.log('🔧 Advanced Jest setup complete - Test Automator configuration applied');