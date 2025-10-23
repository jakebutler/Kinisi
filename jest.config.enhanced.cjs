/**
 * Enhanced Jest Configuration - Test Automator Solution
 *
 * Optimized configuration for comprehensive test coverage and
 * enhanced mock management for resolving the 6 remaining test failures.
 */

module.exports = {
  setupFiles: ['dotenv/config'],

  // Enhanced module mapping with priority for unified mock system
  moduleNameMapper: {
    // Test infrastructure modules - highest priority
    '^@/utils/supabaseClient$': '<rootDir>/__tests__/utils/unifiedMockManager.ts',
    '^utils/supabaseClient$': '<rootDir>/__tests__/utils/unifiedMockManager.ts',

    // Server-side mocks
    '^@/utils/supabaseServer$': '<rootDir>/__mocks__/utils/supabaseServer.ts',
    '^utils/supabaseServer$': '<rootDir>/__mocks__/utils/supabaseServer.ts',

    // Other external dependencies
    '^server-only$': '<rootDir>/__mocks__/server-only.js',
    '^@supabase/ssr$': '<rootDir>/__mocks__/supabase-ssr.js',

    // Generic alias mapping
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Enhanced TypeScript configuration
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },

  // Comprehensive test path management
  testPathIgnorePatterns: [
    '/__mocks__/',
    '/__fixtures__/',
    '/fixtures/',
    '/e2e/',
    '/node_modules/'
  ],

  // Enhanced transform patterns for complex dependencies
  transformIgnorePatterns: [
    '/node_modules/(?!(got|@supabase|isows|isomorphic-fetch|ky|@testing-library|@jest|jest-environment-jsdom|ts-jest)/)'
  ],

  // Enhanced setup with test infrastructure
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/__tests__/setup/jestTestInfrastructure.js'
  ],

  // Mock management settings for consistency
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Prevent unexpected module loading issues
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],

  // Force manual mocks for better control
  automock: false,

  // Enhanced test execution settings
  maxConcurrency: 5,
  maxWorkers: '50%',

  // Test timeout settings for complex async operations
  testTimeout: 10000,

  // Enhanced error reporting
  verbose: true,
  errorOnDeprecated: true,

  // Coverage configuration for comprehensive testing
  collectCoverage: false, // Disable for performance during failure resolution
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Enhanced test pattern matching
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/__tests__/**/*.spec.{ts,tsx}'
  ],

  // Collect coverage from all relevant files
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/__mocks__/**'
  ],

  // Enhanced globals for test utilities
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: 'node',
        skipLibCheck: true
      }
    }
  },

  // Enhanced resolver for complex module structures
  resolver: undefined, // Use default resolver with enhanced module mapping

  // Setup for global test environment
  globalSetup: '<rootDir>/__tests__/setup/globalTestSetup.js',

  // Enhanced reporting
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }
    ]
  ]
};