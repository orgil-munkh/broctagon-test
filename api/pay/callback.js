const { verifyPspSignature, mapCoinsbuyToCrmPayload } = require('../../lib/psp-client');
const { validatePayCallbackRequest } = require('../../lib/validators');
const { createModuleServerlessHandler } = require('../../lib/serverless-handler');
const { createModuleLogger, generateRequestId, sanitizeData, createTimer } = require('../../lib/logger');
const axios = require('axios');

const CRM_CALLBACK_URL = process.env.CRM_CALLBACK_URL;
const CRM_PAY_TOKEN = process.env.CRM_PAY_TOKEN;

// Create module logger
const moduleLogger = createModuleLogger('pay-callback');

/**
 * POST /api/pay/callback
 * Handles PSP webhook callbacks and forwards to Broctagon CRM
 */
async function handlePayCallback(req, res) {
  const requestId = generateRequestId();
  const timer = createTimer();
  
  if (req.method !== 'POST') {
    moduleLogger.warn('Invalid method', { requestId, method: req.method });
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Validate request body
    const validation = validatePayCallbackRequest(req.body);
    if (!validation.isValid) {
      moduleLogger.warn('Validation failed', { 
        requestId, 
        error: validation.error 
      });
      return res.status(validation.statusCode).json({ error: validation.error });
    }

    // Verify PSP signature (Coinsbuy webhook signature)
    if (!verifyPspSignature(req)) {
      moduleLogger.warn('Invalid PSP signature', { requestId });
      return res.status(401).json({ error: 'Invalid PSP signature.' });
    }

    const pspPayload = req.body;
    moduleLogger.info('Received PSP webhook', {
      requestId,
      payload: sanitizeData(pspPayload)
    });

    // Map PSP payload to CRM format
    const crmPayload = mapCoinsbuyToCrmPayload(pspPayload);
    moduleLogger.info('Mapped to CRM format', {
      requestId,
      crmPayload: sanitizeData(crmPayload)
    });

    // Validate CRM callback URL is configured
    if (!CRM_CALLBACK_URL) {
      moduleLogger.info('CRM_CALLBACK_URL not configured - simulating successful callback', {
        requestId,
        orderId: crmPayload.merchant_reference
      });
      return res.status(200).json({ 
        status: 'success',
        order_id: crmPayload.merchant_reference,
        message: 'CRM callback URL not configured - simulated success'
      });
    }

    // POST to Broctagon CRM callback endpoint
    const crmCallbackEndpoint = `${CRM_CALLBACK_URL}/pay/callback`;
    moduleLogger.info('Notifying CRM', {
      requestId,
      endpoint: crmCallbackEndpoint,
      orderId: crmPayload.merchant_reference
    });

    try {
      const crmResponse = await axios.post(crmCallbackEndpoint, crmPayload, {
        headers: {
          'Content-Type': 'application/json',
          'crm-pay-token': CRM_PAY_TOKEN,
        },
        timeout: 10000
      });

      const duration = timer.end();
      moduleLogger.info('Successfully notified CRM', {
        requestId,
        orderId: crmPayload.merchant_reference,
        crmStatus: crmResponse.status,
        duration: `${duration}ms`
      });
      
      return res.status(200).json({ 
        status: 'success',
        order_id: crmPayload.merchant_reference,
        crm_response: crmResponse.data
      });
    } catch (axiosError) {
      const duration = timer.end();
      if (axiosError.response) {
        moduleLogger.error('CRM callback failed', {
          requestId,
          endpoint: crmCallbackEndpoint,
          status: axiosError.response.status,
          error: axiosError.response.data,
          duration: `${duration}ms`
        });
        return res.status(502).json({ 
          error: 'Failed to notify CRM', 
          detail: axiosError.response.data,
          status: axiosError.response.status
        });
      } else {
        moduleLogger.error('CRM callback network error', {
          requestId,
          endpoint: crmCallbackEndpoint,
          error: axiosError.message,
          duration: `${duration}ms`
        });
        return res.status(502).json({ 
          error: 'Failed to notify CRM - network error', 
          detail: axiosError.message
        });
      }
    }

  } catch (err) {
    const duration = timer.end();
    moduleLogger.error('Error handling PSP callback', {
      requestId,
      error: err?.message,
      stack: err?.stack,
      duration: `${duration}ms`
    });
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
}

// Export Vercel serverless function
module.exports = createModuleServerlessHandler(handlePayCallback, 'pay-callback');
