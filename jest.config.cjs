module.exports = {
  setupFiles: ['dotenv/config'],
  moduleNameMapper: {
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
    '/e2e/'
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
};
