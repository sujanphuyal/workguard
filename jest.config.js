module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/flash-list|@supabase/.*|uuid|date-fns|date-fns-tz)',
  ],
  collectCoverageFrom: [
    'src/rules/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    'src/database/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
    '!**/__tests__/**',
  ],
  coverageThreshold: {
    'src/rules/': {
      branches: 90,
      functions: 90,
      lines: 95,
      statements: 95,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
};
