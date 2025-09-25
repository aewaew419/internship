/**
 * Jest Global Teardown
 * Runs once after all tests complete
 */

module.exports = async () => {
  console.log('🧹 Cleaning up after test suite...')
  
  // Clean up any global resources
  // Close database connections, stop mock servers, etc.
  
  // Clear any global mocks or spies
  if (global.mockServer) {
    await global.mockServer.close()
  }
  
  // Reset environment variables
  delete process.env.MOCK_EXTERNAL_SERVICES
  
  console.log('✅ Global test teardown completed')
}