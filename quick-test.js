#!/usr/bin/env node

/**
 * Quick Integration Test - Check if backend is running and responsive
 */

const axios = require('axios').default;

const BACKEND_URL = 'http://localhost:8080';
const API_BASE = `${BACKEND_URL}/api/v1`;

async function quickTest() {
  console.log('🔍 Quick Integration Test');
  console.log('========================');
  
  try {
    // Test 1: Backend Health Check
    console.log('\n1. Testing backend health...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend health:', healthResponse.data);
    
    // Test 2: API Test Endpoint
    console.log('\n2. Testing API endpoint...');
    const apiResponse = await axios.get(`${API_BASE}/test`, { timeout: 5000 });
    console.log('✅ API test:', apiResponse.data);
    
    // Test 3: Auth Endpoints
    console.log('\n3. Testing auth endpoints...');
    const loginResponse = await axios.post(`${API_BASE}/login`, {
      email: 'test@example.com',
      password: 'test123'
    }, { timeout: 5000 });
    console.log('✅ Login endpoint:', loginResponse.data);
    
    // Test 4: Users Endpoint
    console.log('\n4. Testing users endpoint...');
    const usersResponse = await axios.get(`${API_BASE}/users`, { timeout: 5000 });
    console.log('✅ Users endpoint:', usersResponse.data);
    
    console.log('\n🎉 All quick tests passed!');
    console.log('✅ Backend is running and responsive');
    console.log('✅ API endpoints are working correctly');
    
  } catch (error) {
    console.error('\n❌ Quick test failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 Backend server is not running');
      console.error('💡 Start it with: cd apps/backend && npm run dev');
    } else if (error.response) {
      console.error(`🔴 HTTP Error: ${error.response.status} - ${error.response.statusText}`);
      console.error('📝 Response:', error.response.data);
    } else {
      console.error('🔴 Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the quick test
quickTest();