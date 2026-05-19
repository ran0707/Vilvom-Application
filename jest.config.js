module.exports = {
  preset: 'react-native',
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}',
  ],
  // Exclude Detox e2e tests from Jest unit test run
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/android/',
    '/ios/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-vector-icons|react-native-linear-gradient|react-native-image-picker|react-native-otp-entry|@react-native-async-storage|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|react-native-device-info|react-native-localize|react-native-permissions)/)',
  ],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/__mocks__/fileMock.js',
  },

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/__tests__/**',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage/unit',
  testEnvironment: 'node',
};
