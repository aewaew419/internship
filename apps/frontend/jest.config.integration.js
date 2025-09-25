/**
 * Jest Configuration for Integration Tests
 * For testing component interactions and API integration
 */

const baseConfig = require('./jest.config.enhanced.js')

module.exports = {
  ...baseConfig,
  displayName: 'Integration Tests',
  testMatch: [
    '**/__tests__/integration/**/*.(test|spec).(ts|tsx|js)',
    '**/*.integration.(test|spec).(ts|tsx|js)'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/jest.setup.integration.js'
  ],
  testTimeout: 15000,
  maxWorkers: '50%',
  // Integration tests might need more time and resources
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
}