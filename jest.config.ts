// Sync object
const config = {
  verbose: false,
  setupFiles: ['<rootDir>/test/environment-setup.ts'],
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/*.spec.ts'],

  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  setTimeout: 10000,
};
module.exports = config;
