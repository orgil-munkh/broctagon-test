const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testIntegration() {
  console.log('🧪 Testing Broctagon CRM Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test 2: Payment URL Generation
    console.log('2. Testing payment URL generation...');
    const paymentResponse = await axios.post(`${BASE_URL}/api/pay/url`, {
      amount: 100,
      currency: 'USD',
      client_id: 'broker123',
      return_url: 'https://my.itrader.global/dashboard',
      metadata: {
        order_note: 'Test deposit'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'crm-pay-token': 'changeme'
      }
    });
    console.log('✅ Payment URL generated:', paymentResponse.data);
    console.log('');

    // Test 3: Webhook Callback
    console.log('3. Testing webhook callback...');
    const callbackResponse = await axios.post(`${BASE_URL}/api/pay/callback`, {
      data: {
        id: 'deposit_test_001',
        type: 'deposit',
        attributes: {
          status: 'confirmed',
          target_amount_requested: '100',
          currency: 'USD',
          tracking_id: paymentResponse.data.order_id,
          client_id: 'broker123'
        }
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-coinsbuy-signature': 'test_signature'
      }
    });
    console.log('✅ Webhook callback processed:', callbackResponse.data);
    console.log('');

    console.log('🎉 All tests passed! Integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Run the test
testIntegration();
