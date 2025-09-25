/**
 * Jest Global Setup
 * Runs once before all tests start
 */

module.exports = async () => {
  console.log('🚀 Starting Jest test suite...')
  
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3333'
  process.env.NEXT_PUBLIC_APP_ENV = 'test'
  
  // Mock external services
  process.env.MOCK_EXTERNAL_SERVICES = 'true'
  
  // Set timezone for consistent date testing
  process.env.TZ = 'UTC'
  
  // Initialize test database or mock services if needed
  console.log('✅ Global test setup completed')
}