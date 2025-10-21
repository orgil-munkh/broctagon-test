const { verifyPspSignature, mapCoinsbuyToCrmPayload } = require('../lib/psp-client');
const { validatePayCallbackRequest } = require('../lib/validators');
const axios = require('axios');

const CRM_CALLBACK_URL = process.env.CRM_CALLBACK_URL;
const CRM_PAY_TOKEN = process.env.CRM_PAY_TOKEN;
const LOG_PREFIX_CB = '[pay/callback]';

// Utility to log output
const log = (...args) => console.log(LOG_PREFIX_CB, ...args);

/**
 * POST /api/pay/callback
 * Handles PSP webhook callbacks and forwards to Broctagon CRM
 */
function handlePayCallback(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Wrap in async function to handle promises
  (async () => {
    try {
      // Validate request body
      const validation = validatePayCallbackRequest(req.body);
      if (!validation.isValid) {
        log('Validation failed:', validation.error);
        return res.status(validation.statusCode).json({ error: validation.error });
      }

      // Verify PSP signature (Coinsbuy webhook signature)
      if (!verifyPspSignature(req)) {
        log('Invalid PSP signature');
        return res.status(401).json({ error: 'Invalid PSP signature.' });
      }

      const pspPayload = req.body;
      log('Received PSP webhook:', JSON.stringify(pspPayload, null, 2));

      // Map PSP payload to CRM format
      const crmPayload = mapCoinsbuyToCrmPayload(pspPayload);
      log('Mapped to CRM format:', JSON.stringify(crmPayload, null, 2));

      // Validate CRM callback URL is configured
      if (!CRM_CALLBACK_URL) {
        log('CRM_CALLBACK_URL not configured - simulating successful callback');
        return res.status(200).json({ 
          status: 'success',
          order_id: crmPayload.merchant_reference,
          message: 'CRM callback URL not configured - simulated success'
        });
      }

      // POST to Broctagon CRM callback endpoint
      const crmCallbackEndpoint = `${CRM_CALLBACK_URL}/pay/callback`;
      log(`Notifying CRM at: ${crmCallbackEndpoint}`);

      try {
        const crmResponse = await axios.post(crmCallbackEndpoint, crmPayload, {
          headers: {
            'Content-Type': 'application/json',
            'crm-pay-token': CRM_PAY_TOKEN,
          },
          timeout: 10000
        });

        log('Successfully notified CRM for order_id:', crmPayload.merchant_reference, 'Response:', crmResponse.data);
        
        return res.status(200).json({ 
          status: 'success',
          order_id: crmPayload.merchant_reference,
          crm_response: crmResponse.data
        });
      } catch (axiosError) {
        if (axiosError.response) {
          log('CRM callback failed:', crmCallbackEndpoint, 'Status:', axiosError.response.status, 'Error:', axiosError.response.data);
          return res.status(502).json({ 
            error: 'Failed to notify CRM', 
            detail: axiosError.response.data,
            status: axiosError.response.status
          });
        } else {
          log('CRM callback network error:', axiosError.message);
          return res.status(502).json({ 
            error: 'Failed to notify CRM - network error', 
            detail: axiosError.message
          });
        }
      }

    } catch (err) {
      log('Error handling PSP callback:', err?.message, err);
      return res.status(500).json({ error: 'Internal Server Error.' });
    }
  })().catch(err => {
    log('Unhandled error in callback:', err?.message, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error.' });
    }
  });
}

module.exports = handlePayCallback;
