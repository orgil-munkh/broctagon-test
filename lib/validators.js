/**
 * Validate required fields in request body
 * @param {Object} body - Request body
 * @param {Array<string>} requiredFields - Array of required field names
 * @returns {Object} Validation result with isValid and missingFields
 */
function validateRequiredFields(body, requiredFields) {
  const missingFields = requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Validate CRM pay token
 * @param {string} token - Token from request headers
 * @param {string} expectedToken - Expected token from environment
 * @returns {boolean} Whether token is valid
 */
function validateCrmPayToken(token, expectedToken) {
  if (!expectedToken) {
    console.warn('[validators] CRM_PAY_TOKEN not configured in environment');
    return false;
  }
  
  return token === expectedToken;
}

/**
 * Validate amount is a positive number
 * @param {any} amount - Amount to validate
 * @returns {boolean} Whether amount is valid
 */
function validateAmount(amount) {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0;
}

/**
 * Validate currency code format (basic validation)
 * @param {string} currency - Currency code to validate
 * @returns {boolean} Whether currency is valid
 */
function validateCurrency(currency) {
  return typeof currency === 'string' && 
         currency.length >= 3 && 
         currency.length <= 4 &&
         /^[A-Z]+$/.test(currency);
}

/**
 * Validate client ID format
 * @param {string} clientId - Client ID to validate
 * @returns {boolean} Whether client ID is valid
 */
function validateClientId(clientId) {
  return typeof clientId === 'string' && 
         clientId.length > 0 && 
         clientId.length <= 100;
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 */
function validateUrl(url) {
  if (!url) return true; // Optional field
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate pay/url request payload
 * @param {Object} body - Request body
 * @returns {Object} Validation result
 */
function validatePayUrlRequest(body) {
  const requiredFields = ['amount', 'currency', 'client_id'];
  const fieldValidation = validateRequiredFields(body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return {
      isValid: false,
      error: `Missing required fields: ${fieldValidation.missingFields.join(', ')}`,
      statusCode: 400
    };
  }

  // Validate individual fields
  if (!validateAmount(body.amount)) {
    return {
      isValid: false,
      error: 'Invalid amount: must be a positive number',
      statusCode: 400
    };
  }

  if (!validateCurrency(body.currency)) {
    return {
      isValid: false,
      error: 'Invalid currency: must be a 3-4 character uppercase code',
      statusCode: 400
    };
  }

  if (!validateClientId(body.client_id)) {
    return {
      isValid: false,
      error: 'Invalid client_id: must be a non-empty string (max 100 characters)',
      statusCode: 400
    };
  }

  if (body.return_url && !validateUrl(body.return_url)) {
    return {
      isValid: false,
      error: 'Invalid return_url: must be a valid URL',
      statusCode: 400
    };
  }

  return {
    isValid: true
  };
}

/**
 * Validate pay/callback request payload
 * @param {Object} body - Request body
 * @returns {Object} Validation result
 */
function validatePayCallbackRequest(body) {
  // For webhook callbacks, we're more lenient as we don't control the PSP payload
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: 'Invalid payload: must be a JSON object',
      statusCode: 400
    };
  }

  return {
    isValid: true
  };
}

module.exports = {
  validateRequiredFields,
  validateCrmPayToken,
  validateAmount,
  validateCurrency,
  validateClientId,
  validateUrl,
  validatePayUrlRequest,
  validatePayCallbackRequest
};
