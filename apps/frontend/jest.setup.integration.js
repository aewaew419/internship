/**
 * Jest Setup for Integration Tests
 * Additional setup for integration testing
 */

// Mock API server setup
let mockServer

beforeAll(async () => {
  // Setup mock API server for integration tests
  const { setupServer } = require('msw/node')
  const { rest } = require('msw')
  
  // Define API mocks
  const handlers = [
    // Auth endpoints
    rest.post('http://localhost:3333/api/auth/login', (req, res, ctx) => {
      return res(
        ctx.json({
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin'
          },
          token: 'mock-jwt-token'
        })
      )
    }),
    
    rest.post('http://localhost:3333/api/auth/logout', (req, res, ctx) => {
      return res(ctx.json({ message: 'Logged out successfully' }))
    }),
    
    // User management endpoints
    rest.get('http://localhost:3333/api/users', (req, res, ctx) => {
      return res(
        ctx.json({
          data: [
            { id: 1, email: 'user1@example.com', name: 'User 1', role: 'user' },
            { id: 2, email: 'user2@example.com', name: 'User 2', role: 'admin' }
          ],
          total: 2
        })
      )
    }),
    
    rest.post('http://localhost:3333/api/users', (req, res, ctx) => {
      return res(
        ctx.json({
          id: 3,
          email: 'newuser@example.com',
          name: 'New User',
          role: 'user'
        })
      )
    }),
    
    // Role management endpoints
    rest.get('http://localhost:3333/api/roles', (req, res, ctx) => {
      return res(
        ctx.json({
          data: [
            { id: 1, name: 'admin', displayName: 'Administrator', permissions: ['all'] },
            { id: 2, name: 'user', displayName: 'User', permissions: ['read'] }
          ]
        })
      )
    }),
    
    // Audit endpoints
    rest.get('http://localhost:3333/api/audit/events', (req, res, ctx) => {
      return res(
        ctx.json({
          data: [
            {
              id: 'event-1',
              action: 'user_create',
              entityType: 'user',
              entityId: 'user-1',
              userId: 1,
              userName: 'Admin User',
              timestamp: '2024-01-01T00:00:00Z',
              changes: [
                { field: 'name', oldValue: null, newValue: 'Test User', fieldType: 'string' }
              ],
              success: true
            }
          ],
          total: 1
        })
      )
    }),
    
    // Fallback for unhandled requests
    rest.get('*', (req, res, ctx) => {
      console.warn(`Unhandled GET request to ${req.url}`)
      return res(ctx.status(404), ctx.json({ error: 'Not found' }))
    }),
    
    rest.post('*', (req, res, ctx) => {
      console.warn(`Unhandled POST request to ${req.url}`)
      return res(ctx.status(404), ctx.json({ error: 'Not found' }))
    }),
  ]
  
  mockServer = setupServer(...handlers)
  mockServer.listen({
    onUnhandledRequest: 'warn',
  })
  
  global.mockServer = mockServer
})

afterAll(async () => {
  if (mockServer) {
    mockServer.close()
  }
})

beforeEach(() => {
  if (mockServer) {
    mockServer.resetHandlers()
  }
})

// Additional integration test utilities
global.waitForApiCall = async (url, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const checkForCall = () => {
      // Check if the API call was made
      const calls = global.fetch.mock.calls || []
      const found = calls.find(call => call[0].includes(url))
      
      if (found) {
        resolve(found)
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`API call to ${url} not found within ${timeout}ms`))
      } else {
        setTimeout(checkForCall, 100)
      }
    }
    
    checkForCall()
  })
}

// Mock WebSocket for real-time features
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 1 // OPEN
    this.onopen = null
    this.onclose = null
    this.onmessage = null
    this.onerror = null
    
    setTimeout(() => {
      if (this.onopen) this.onopen({ type: 'open' })
    }, 0)
  }
  
  send(data) {
    // Mock sending data
    console.log('WebSocket send:', data)
  }
  
  close() {
    this.readyState = 3 // CLOSED
    if (this.onclose) this.onclose({ type: 'close' })
  }
}