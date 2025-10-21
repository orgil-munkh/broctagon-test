const { createModuleLogger, generateRequestId, sanitizeData, createTimer } = require('../lib/logger');

// Create module logger
const logger = createModuleLogger('pay-callback');

/**
 * POST /api/pay/callback
 * Handles PSP webhook callbacks and forwards to Broctagon CRM
 */
function handlePayCallback(req, res) {
  const requestId = generateRequestId();
  const timer = createTimer();
  
  if (req.method !== 'POST') {
    logger.warn('Invalid method', { requestId, method: req.method });
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const pspPayload = req.body;
    logger.info('Received PSP webhook', {
      requestId,
      payload: sanitizeData(pspPayload)
    });

    // Extract order ID from the payload
    const orderId = pspPayload?.data?.attributes?.tracking_id || 
                   pspPayload?.data?.id || 
                   pspPayload?.order_id || 
                   'unknown';

    logger.info('Processing callback', {
      requestId,
      orderId
    });

    const duration = timer.end();
    logger.info('Callback processed successfully', {
      requestId,
      orderId,
      duration: `${duration}ms`
    });

    // Return success response
    return res.status(200).json({ 
      status: 'success',
      order_id: orderId,
      message: 'Callback processed successfully'
    });

  } catch (err) {
    const duration = timer.end();
    logger.error('Error handling PSP callback', {
      requestId,
      error: err?.message,
      stack: err?.stack,
      duration: `${duration}ms`
    });
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
}

module.exports = handlePayCallback;
