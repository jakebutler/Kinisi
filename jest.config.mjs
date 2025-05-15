// jest.config.mjs

export default {
  // --- Keep existing core configuration ---
  preset: 'ts-jest/presets/default-esm', // Use the default ESM preset
  testEnvironment: 'node', // Keep 'node' environment (good for API routes/server code)
                          // Change to 'jsdom' if most tests are for React components, or configure per-file if mixed
  extensionsToTreatAsEsm: ['.ts'], // Treat .ts files as ESM
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // File extensions Jest should look for

  // --- Address ts-jest warning: Move config from 'globals' to 'transform' ---
  // Remove this deprecated 'globals' section:
  // globals: {
  //   'ts-jest': {
  //     useESM: true, // This option needs to move
  //   },
  // },
  // Add the 'transform' configuration:
  transform: {
    // This regex tells Jest to process files ending in .ts or .tsx
    // using ts-jest with the specified options.
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true, // <-- Option moved here
      // You might also need to point to your tsconfig.json if not automatically picked up:
      // tsconfig: '<rootDir>/tsconfig.json',
    }],
    // If you have other file types to transform (e.g., .js files not in node_modules)
    // you might add them here, but the preset often handles standard cases.
  },
  // -----------------------------------------------------------------------


  // --- Add line to ignore the e2e directory ---
  // This tells Jest to skip any test files located within the 'e2e' directory.
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  // -------------------------------------------

  // --- Optional: Add moduleNameMapper if you use path aliases like @/ ---
  // If you have paths configured in tsconfig.json (e.g., "@/*": ["./*"]),
  // you need to map them for Jest.
  // moduleNameMapper: {
  //   '^@/(.*)$': '<rootDir>/$1', // Example mapping for "@" alias to project root
  //   // Add other aliases if needed, e.g., '^@/utils/(.*)$': '<rootDir>/utils/$1'
  // },
  // --------------------------------------------------------------------
};