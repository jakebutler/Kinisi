module.exports = {
  setupFiles: ['dotenv/config'],
  moduleNameMapper: {
    // Specific mappings first
    '^@/utils/supabaseClient$': '<rootDir>/__mocks__/utils/supabaseClient.ts',
    '^utils/supabaseClient$': '<rootDir>/__mocks__/utils/supabaseClient.ts',
    '^@/utils/supabaseServer$': '<rootDir>/__mocks__/utils/supabaseServer.ts',
    '^utils/supabaseServer$': '<rootDir>/__mocks__/utils/supabaseServer.ts',
    '^server-only$': '<rootDir>/__mocks__/server-only.js',
    '^@supabase/ssr$': '<rootDir>/__mocks__/supabase-ssr.js',
    // Generic alias last
    '^@/(.*)$': '<rootDir>/$1',
  },
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  testPathIgnorePatterns: [
    '/__mocks__/',
    '/__fixtures__/',
    '/fixtures/',
    '/e2e/',
    '/__tests__/utils/',
    '/__tests__/setup/',
    '/__tests__/mocks/',
    '/__tests__/types/'
  ],
  transformIgnorePatterns: [
    '/node_modules/(?!(got|@supabase|isows|isomorphic-fetch|ky)/)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Ensure manual mocks are used
  modulePathIgnorePatterns: [],
  // Force Jest to use manual mocks
  automock: false,
  // Default timeout for all tests
  testTimeout: 10000,
};
