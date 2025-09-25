/**
 * Jest Configuration for Unit Tests
 * Optimized for fast unit testing
 */

const baseConfig = require('./jest.config.enhanced.js')

module.exports = {
  ...baseConfig,
  displayName: 'Unit Tests',
  testMatch: [
    '**/__tests__/unit/**/*.(test|spec).(ts|tsx|js)',
    '**/*.unit.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.config.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/**/*.types.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/node_modules/**',
    // Exclude integration test files
    '!src/**/*.integration.*',
    '!src/**/*.e2e.*',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testTimeout: 5000,
  maxWorkers: '75%',
}