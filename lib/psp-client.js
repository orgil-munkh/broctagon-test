const axios = require('axios');

const COINSBUY_BASE_URL = process.env.COINSBUY_URL || '';
const COINSBUY_AUTH_TOKEN = process.env.COINSBUY_AUTH_TOKEN || '';
const COINSBUY_WALLET_ID = process.env.COINSBUY_WALLET_ID || '1';
const PSP_SANDBOX_MODE = process.env.PSP_SANDBOX_MODE === 'true';
const PSP_PAYMENT_BASE_URL = process.env.PSP_PAYMENT_BASE_URL || 'https://mock-psp.pay/url/';

/**
 * Create a Coinsbuy deposit invoice
 * @param {Object} params - Payment parameters
 * @param {string} params.order_id - Unique order identifier
 * @param {number} params.amount - Payment amount
 * @param {string} params.currency - Payment currency
 * @param {string} params.client_id - Client identifier
 * @param {string} params.return_url - Return URL after payment
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} Coinsbuy deposit response
 */
async function createCoinsbuyInvoice({
  order_id,
  amount,
  currency,
  client_id,
  return_url,
  metadata
}) {
  try {
    const { data } = await axios.post(
      `${COINSBUY_BASE_URL}/deposit/`,
      {
        data: {
          type: 'deposit',
          attributes: {
            label: 'BROCTAGON_CRM_DEPOSIT',
            tracking_id: order_id,
            target_amount_requested: amount.toString(),
            confirmations_needed: 2,
            callback_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/pay/callback`,
            payment_page_redirect_url: return_url || 'https://my.itrader.global/dashboard',
            payment_page_button_text: 'Back to dashboard'
          },
          relationships: {
            wallet: {
              data: {
                type: 'wallet',
                id: parseInt(COINSBUY_WALLET_ID)
              }
            }
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${COINSBUY_AUTH_TOKEN}`,
          'Content-Type': 'application/vnd.api+json'
        }
      }
    );
    return data.data;
  } catch (error) {
    console.error('[psp-client] Coinsbuy API error:', error.response?.data || error.message);
    throw new Error(`Coinsbuy API error: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Create a mock payment URL for sandbox mode
 * @param {Object} params - Payment parameters
 * @returns {Promise<string>} Mock payment URL
 */
async function createMockPaymentUrl({
  order_id,
  amount,
  currency,
  client_id,
  return_url,
  metadata
}) {
  const params = new URLSearchParams({
    order_id,
    amount: amount.toString(),
    currency,
    client_id,
    ...(return_url ? { return_url } : {}),
  }).toString();
  
  return `${PSP_PAYMENT_BASE_URL}?${params}`;
}

/**
 * Create a payment URL using the configured PSP
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} Payment response with URL and order details
 */
async function createPaymentUrl({
  amount,
  currency,
  order_id,
  client_id,
  return_url,
  metadata
}) {
  if (PSP_SANDBOX_MODE) {
    console.log('[psp-client] Using sandbox mode - creating mock payment URL');
    const payment_url = await createMockPaymentUrl({
      order_id,
      amount,
      currency,
      client_id,
      return_url,
      metadata
    });
    
    return {
      payment_url,
      order_id,
      provider: 'mock'
    };
  }

  // Use Coinsbuy in production
  console.log('[psp-client] Creating Coinsbuy deposit invoice');
  const coinsbuyResponse = await createCoinsbuyInvoice({
    order_id,
    amount,
    currency,
    client_id,
    return_url,
    metadata
  });

  return {
    payment_url: coinsbuyResponse.attributes.payment_url,
    order_id,
    provider: 'coinsbuy',
    coinsbuy_id: coinsbuyResponse.id,
    status: coinsbuyResponse.attributes.status
  };
}

/**
 * Verify PSP webhook signature (placeholder for Coinsbuy signature verification)
 * @param {Object} req - Express request object
 * @returns {boolean} Always returns true for now
 */
function verifyPspSignature(req) {
  // TODO: Implement Coinsbuy webhook signature verification
  // Coinsbuy should provide signature verification in their webhook documentation
  const signature = req.headers['x-coinsbuy-signature'] || req.headers['x-psp-signature'];
  
  if (!signature) {
    console.warn('[psp-client] No signature found in webhook headers');
    return true; // Allow for testing, but should be false in production
  }
  
  // Placeholder for actual signature verification
  return true;
}

/**
 * Map Coinsbuy webhook payload to CRM format
 * @param {Object} coinsbuyPayload - Coinsbuy webhook payload
 * @returns {Object} CRM-formatted payload
 */
function mapCoinsbuyToCrmPayload(coinsbuyPayload) {
  const data = coinsbuyPayload.data || coinsbuyPayload;
  const attributes = data.attributes || {};
  
  return {
    amount: parseFloat(attributes.target_amount_requested || attributes.amount || 0),
    currency: attributes.currency || 'USD',
    status: mapCoinsbuyStatus(attributes.status),
    merchant_reference: attributes.tracking_id || data.id,
    transaction_id: data.id,
    client_id: attributes.client_id || 'unknown',
    ...(attributes.exchange_rate ? { exchange_rate: attributes.exchange_rate } : {})
  };
}

/**
 * Map Coinsbuy status to CRM status
 * @param {string} coinsbuyStatus - Coinsbuy status
 * @returns {string} CRM status
 */
function mapCoinsbuyStatus(coinsbuyStatus) {
  const statusMap = {
    'pending': 'pending',
    'confirmed': 'success',
    'completed': 'success',
    'failed': 'failed',
    'cancelled': 'failed',
    'expired': 'failed'
  };
  
  return statusMap[coinsbuyStatus] || 'pending';
}

module.exports = {
  createPaymentUrl,
  verifyPspSignature,
  mapCoinsbuyToCrmPayload
};
