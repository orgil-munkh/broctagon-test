const { createModuleServerlessHandler } = require('./lib/serverless-handler');
const handlePayUrl = require('./api/pay/url');
const handlePayCallback = require('./api/pay/callback');
const handleHealth = require('./api/health');

// Test Vercel functions locally
async function testVercelFunctions() {
  console.log('🧪 Testing Vercel Functions Locally...\n');

  // Test Health Endpoint
  console.log('1. Testing Health Endpoint...');
  const healthReq = {
    method: 'GET',
    url: '/health',
    headers: {},
    body: {},
    query: {}
  };
  const healthRes = {
    statusCode: 200,
    headers: {},
    status: (code) => ({ json: (data) => console.log('Health Response:', data) }),
    json: (data) => console.log('Health Response:', data),
    end: (data) => console.log('Health Response:', data),
    setHeader: () => {}
  };
  
  try {
    await handleHealth(healthReq, healthRes);
  } catch (error) {
    console.error('Health test failed:', error.message);
  }

  // Test Payment URL Endpoint
  console.log('\n2. Testing Payment URL Endpoint...');
  const paymentReq = {
    method: 'POST',
    url: '/api/pay/url',
    headers: {
      'content-type': 'application/json',
      'crm-pay-token': 'changeme'
    },
    body: {
      amount: 100,
      currency: 'USD',
      client_id: 'test_vercel'
    },
    query: {}
  };
  const paymentRes = {
    statusCode: 200,
    headers: {},
    status: (code) => ({ json: (data) => console.log('Payment Response:', data) }),
    json: (data) => console.log('Payment Response:', data),
    end: (data) => console.log('Payment Response:', data),
    setHeader: () => {}
  };
  
  try {
    await handlePayUrl(paymentReq, paymentRes);
  } catch (error) {
    console.error('Payment test failed:', error.message);
  }

  // Test Webhook Callback Endpoint
  console.log('\n3. Testing Webhook Callback Endpoint...');
  const callbackReq = {
    method: 'POST',
    url: '/api/pay/callback',
    headers: {
      'content-type': 'application/json',
      'x-coinsbuy-signature': 'test_sig'
    },
    body: {
      data: {
        id: 'deposit_test_vercel',
        type: 'deposit',
        attributes: {
          status: 'confirmed',
          target_amount_requested: '100',
          currency: 'USD',
          tracking_id: 'test-order-vercel',
          client_id: 'test_vercel'
        }
      }
    },
    query: {}
  };
  const callbackRes = {
    statusCode: 200,
    headers: {},
    status: (code) => ({ json: (data) => console.log('Callback Response:', data) }),
    json: (data) => console.log('Callback Response:', data),
    end: (data) => console.log('Callback Response:', data),
    setHeader: () => {}
  };
  
  try {
    await handlePayCallback(callbackReq, callbackRes);
  } catch (error) {
    console.error('Callback test failed:', error.message);
  }

  console.log('\n✅ Vercel Functions Test Completed!');
}

// Run the test
testVercelFunctions().catch(console.error);
