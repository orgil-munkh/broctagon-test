const { v4: uuidv4 } = require('uuid');
const { createPaymentUrl } = require('../lib/psp-client');
const { validateCrmPayToken, validatePayUrlRequest } = require('../lib/validators');
const { createModuleLogger, generateRequestId, sanitizeData, createTimer } = require('../lib/logger');

const CRM_PAY_TOKEN_EXPECTED = process.env.CRM_PAY_TOKEN || '';

// Create module logger
const logger = createModuleLogger('pay-url');

/**
 * POST /api/pay/url
 * Creates a payment URL for Broctagon CRM deposit handling
 */
async function handlePayUrl(req, res) {
  const requestId = generateRequestId();
  const timer = createTimer();
  
  if (req.method !== 'POST') {
    logger.warn('Invalid method', { requestId, method: req.method });
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Validate CRM pay token
    const crmPayToken = req.headers['crm-pay-token'] || req.headers['Crm-Pay-Token'];
    if (!validateCrmPayToken(crmPayToken, CRM_PAY_TOKEN_EXPECTED)) {
      logger.warn('Invalid crm-pay-token', { 
        requestId, 
        token: crmPayToken ? 'provided' : 'missing' 
      });
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }

    // Validate request body
    const validation = validatePayUrlRequest(req.body);
    if (!validation.isValid) {
      logger.warn('Validation failed', { 
        requestId, 
        error: validation.error 
      });
      return res.status(validation.statusCode).json({ error: validation.error });
    }

    const { amount, currency, client_id, return_url, metadata } = req.body;

    // Generate unique order ID
    const order_id = uuidv4();

    logger.info('Creating payment URL', {
      requestId,
      orderId: order_id,
      clientId: client_id,
      amount,
      currency,
      returnUrl: return_url,
      metadata: sanitizeData(metadata)
    });

    // Create payment URL using PSP client
    const paymentResult = await createPaymentUrl({
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      order_id,
      client_id,
      return_url,
      metadata
    });

    const duration = timer.end();
    logger.info('Payment URL generated successfully', {
      requestId,
      orderId: order_id,
      provider: paymentResult.provider,
      duration: `${duration}ms`
    });
    
    return res.status(200).json({
      payment_url: paymentResult.payment_url,
      order_id: paymentResult.order_id,
      provider: paymentResult.provider
    });

  } catch (err) {
    const duration = timer.end();
    logger.error('Error generating payment url', {
      requestId,
      error: err?.message,
      stack: err?.stack,
      duration: `${duration}ms`
    });
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
}

module.exports = handlePayUrl;
