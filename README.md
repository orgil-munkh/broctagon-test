# Broctagon CRM Deposit Integration

A production-ready Express.js server for handling Broctagon CRM deposit processing with Coinsbuy PSP integration and multi-currency support.

## Features

- **Payment URL Generation**: Creates Coinsbuy deposit invoices for Broctagon CRM
- **Webhook Handling**: Processes Coinsbuy webhooks and forwards to CRM
- **Multi-Currency Support**: Handles multiple currencies with exchange rate support
- **Security**: Token validation and signature verification
- **Sandbox Mode**: Mock implementation for testing
- **Error Handling**: Comprehensive error handling and logging

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server**:
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `CRM_PAY_TOKEN` | Token for Broctagon CRM authentication | Yes | - |
| `CRM_CALLBACK_URL` | Broctagon CRM callback endpoint | Yes | - |
| `COINSBUY_URL` | Coinsbuy API base URL | Yes | - |
| `COINSBUY_AUTH_TOKEN` | Coinsbuy API authentication token | Yes | - |
| `COINSBUY_WALLET_ID` | Coinsbuy wallet ID | Yes | 1 |
| `PORT` | Server port | No | 3000 |
| `BASE_URL` | Base URL for webhook callbacks | No | http://localhost:3000 |
| `PSP_SANDBOX_MODE` | Enable sandbox mode | No | true |
| `PSP_PAYMENT_BASE_URL` | Mock PSP URL for sandbox | No | https://mock-psp.pay/url/ |

## API Endpoints

### POST /api/pay/url

Creates a payment URL for deposit processing.

**Headers:**
```
crm-pay-token: your_crm_token
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 100.50,
  "currency": "USD",
  "client_id": "broker123",
  "return_url": "https://my.itrader.global/dashboard",
  "metadata": {
    "order_note": "Deposit for account"
  }
}
```

**Response:**
```json
{
  "payment_url": "https://coinsbuy.com/pay/abc123",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "provider": "coinsbuy"
}
```

### POST /api/pay/callback

Handles Coinsbuy webhook callbacks and forwards to Broctagon CRM.

**Headers:**
```
Content-Type: application/json
x-coinsbuy-signature: webhook_signature
```

**Request Body (Coinsbuy webhook):**
```json
{
  "data": {
    "id": "deposit_123",
    "type": "deposit",
    "attributes": {
      "status": "confirmed",
      "target_amount_requested": "100.50",
      "currency": "USD",
      "tracking_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Response:**
```json
{
  "status": "success",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "crm_response": {...}
}
```

## Testing

### Test Payment URL Generation

```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H 'Content-Type: application/json' \
  -H 'crm-pay-token: changeme' \
  -d '{
    "amount": 100,
    "currency": "USD",
    "client_id": "broker123",
    "return_url": "https://my.itrader.global/dashboard",
    "metadata": {
      "order_note": "Test deposit"
    }
  }'
```

### Test Webhook Callback

```bash
curl -X POST http://localhost:3000/api/pay/callback \
  -H 'Content-Type: application/json' \
  -H 'x-coinsbuy-signature: test_signature' \
  -d '{
    "data": {
      "id": "deposit_test_001",
      "type": "deposit",
      "attributes": {
        "status": "confirmed",
        "target_amount_requested": "100",
        "currency": "USD",
        "tracking_id": "test-order-123",
        "client_id": "broker123"
      }
    }
  }'
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Project Structure

```
├── routes/
│   ├── pay-url.js          # Payment URL generation endpoint
│   └── pay-callback.js     # Webhook callback handler
├── lib/
│   ├── psp-client.js       # Coinsbuy PSP integration
│   └── validators.js       # Request validation utilities
├── server.js               # Express server configuration
├── package.json            # Dependencies and scripts
├── env.example             # Environment variable template
└── README.md              # This file
```

## Security Features

- **Token Validation**: Validates `crm-pay-token` on all requests
- **Signature Verification**: Verifies Coinsbuy webhook signatures (placeholder)
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses without sensitive data exposure

## Multi-Currency Support

- Supports all currencies accepted by Coinsbuy
- Exchange rates provided by Coinsbuy in webhook payloads
- Currency validation ensures proper format (3-4 character codes)

## Development

### Running in Development Mode

```bash
npm run dev
```

### Running in Production

```bash
npm start
```

### Environment Setup

1. Copy `env.example` to `.env`
2. Configure your Coinsbuy credentials
3. Set up your Broctagon CRM callback URL
4. Configure the CRM pay token

## Error Handling

The server includes comprehensive error handling:

- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Invalid or missing tokens
- **405 Method Not Allowed**: Wrong HTTP method
- **500 Internal Server Error**: Server errors
- **502 Bad Gateway**: CRM notification failures

All errors are logged with detailed information for debugging.

## Logging

The server provides detailed logging with prefixes:
- `[pay/url]`: Payment URL generation logs
- `[pay/callback]`: Webhook callback logs
- `[psp-client]`: PSP integration logs

## Production Deployment

1. Set `PSP_SANDBOX_MODE=false`
2. Configure real Coinsbuy credentials
3. Set up proper webhook signature verification
4. Use HTTPS in production
5. Configure proper logging and monitoring

## Support

For issues or questions, please check the logs and ensure all environment variables are properly configured.
