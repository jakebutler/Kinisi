/**
 * Jest Test Infrastructure Setup - Test Automator Solution
 *
 * Global test setup for comprehensive test infrastructure
 * to resolve the 6 remaining test failures with enhanced mocking.
 */

// Import enhanced test utilities
const { unifiedMockManager } = require('../utils/unifiedMockManager');

/**
 * Global test setup for consistent mock management
 */
beforeAll(() => {
  console.log('🚀 Initializing enhanced test infrastructure');

  // Initialize unified mock manager
  try {
    unifiedMockManager.reset();
    console.log('✅ Unified mock manager initialized');
  } catch (error) {
    console.error('❌ Failed to initialize unified mock manager:', error.message);
  }

  // Set up global test environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

/**
 * Global cleanup after all tests
 */
afterAll(() => {
  console.log('🧹 Cleaning up enhanced test infrastructure');

  // Clean up mock manager
  try {
    unifiedMockManager.reset();
    console.log('✅ Mock manager cleaned up');
  } catch (error) {
    console.error('❌ Failed to cleanup mock manager:', error.message);
  }
});

/**
 * Enhanced error handling for unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection in tests:', reason);
  // Don't exit, but log for debugging
});

/**
 * Enhanced console output for test debugging
 */
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out expected React testing library warnings
  const message = args.join(' ');

  const expectedWarnings = [
    'act()',
    'Warning: ReactDOM.render is deprecated',
    'Warning: An invalid form control',
    'Warning: A component is changing an uncontrolled input'
  ];

  const isExpectedWarning = expectedWarnings.some(warning =>
    message.includes(warning)
  );

  if (!isExpectedWarning) {
    originalConsoleError(...args);
  }
};