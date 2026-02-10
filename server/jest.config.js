export default {
  preset: 'ts-jest',
  testEnvironment: "node",
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/emailMock.ts'],
  maxWorkers: '50%',
  testTimeout: 30000,
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/__tests__/utils/factories.ts',
    '/src/__tests__/utils/testHelpers.ts',
    '/src/__tests__/setup/testEnv.ts',
    '/src/__tests__/setup/emailMock.ts',
    '/src/__tests__/factories/userFactory.ts',
  ],
};
