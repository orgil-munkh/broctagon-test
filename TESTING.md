# Broctagon CRM Integration - cURL Testing Guide

This guide provides comprehensive cURL commands to test all API endpoints.

## Prerequisites

- Server running on `http://localhost:3000` (or your configured port)
- Environment variables configured in `.env`
- `CRM_PAY_TOKEN` set to `changeme` (or your configured token)

## Quick Start

Start the server:
```bash
npm run dev
```

---

## 1. Health Check Endpoint

### Basic Health Check
```bash
curl -X GET http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T05:52:45.624Z",
  "version": "1.0.0"
}
```

### Health Check with Headers
```bash
curl -X GET http://localhost:3000/health \
  -H "Accept: application/json" \
  -v
```

---

## 2. Payment URL Generation (`/api/pay/url`)

### Basic Payment URL Request
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "client_id": "broker123"
  }'
```

**Expected Response:**
```json
{
  "payment_url": "https://mock-psp.pay/url/?order_id=550e8400-e29b-41d4-a716-446655440000&amount=100&currency=USD&client_id=broker123",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "provider": "mock"
}
```

### Payment URL with All Parameters
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{
    "amount": 250.50,
    "currency": "EUR",
    "client_id": "broker_456",
    "return_url": "https://my.itrader.global/dashboard",
    "metadata": {
      "order_note": "VIP Deposit",
      "customer_type": "premium",
      "campaign_id": "SUMMER2025"
    }
  }'
```

### Multi-Currency Examples

**USD Payment:**
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 100, "currency": "USD", "client_id": "client001"}'
```

**EUR Payment:**
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 100, "currency": "EUR", "client_id": "client002"}'
```

**GBP Payment:**
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 100, "currency": "GBP", "client_id": "client003"}'
```

**BTC Payment:**
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 0.001, "currency": "BTC", "client_id": "client004"}'
```

### Error Testing - Missing Token
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "USD", "client_id": "broker123"}'
```

**Expected Response (401):**
```json
{
  "error": "Unauthorized: Invalid token."
}
```

### Error Testing - Invalid Token
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: wrongtoken" \
  -d '{"amount": 100, "currency": "USD", "client_id": "broker123"}'
```

### Error Testing - Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 100}'
```

**Expected Response (400):**
```json
{
  "error": "Missing required fields: currency, client_id"
}
```

### Error Testing - Invalid Amount
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": -100, "currency": "USD", "client_id": "broker123"}'
```

### Error Testing - Invalid Currency Format
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 100, "currency": "us", "client_id": "broker123"}'
```

### Error Testing - Wrong HTTP Method
```bash
curl -X GET http://localhost:3000/api/pay/url \
  -H "crm-pay-token: changeme"
```

**Expected Response (405):**
```json
{
  "error": "Method Not Allowed"
}
```

---

## 3. Webhook Callback (`/api/pay/callback`)

### Basic Webhook Callback (Coinsbuy Format)
```bash
curl -X POST http://localhost:3000/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: test_signature_abc123" \
  -d '{
    "data": {
      "id": "deposit_12345",
      "type": "deposit",
      "attributes": {
        "status": "confirmed",
        "target_amount_requested": "100.00",
        "currency": "USD",
        "tracking_id": "550e8400-e29b-41d4-a716-446655440000",
        "client_id": "broker123"
      }
    }
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Callback processed successfully"
}
```

### Webhook with Complete Coinsbuy Payload
```bash
curl -X POST http://localhost:3000/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: signature_hash_here" \
  -d '{
    "data": {
      "id": "deposit_67890",
      "type": "deposit",
      "attributes": {
        "label": "BROCTAGON_CRM_DEPOSIT",
        "tracking_id": "order-2025-001",
        "target_amount_requested": "250.50",
        "amount_received": "250.50",
        "currency": "EUR",
        "status": "completed",
        "confirmations_needed": 2,
        "confirmations_received": 3,
        "created_at": "2025-10-21T10:30:00Z",
        "updated_at": "2025-10-21T10:35:00Z",
        "client_id": "broker_premium_001",
        "exchange_rate": 1.1
      },
      "relationships": {
        "wallet": {
          "data": {
            "type": "wallet",
            "id": 1
          }
        }
      }
    }
  }'
```

### Webhook - Different Status Examples

**Pending Status:**
```bash
curl -X POST http://localhost:3000/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: test_sig" \
  -d '{
    "data": {
      "id": "deposit_pending_001",
      "type": "deposit",
      "attributes": {
        "status": "pending",
        "target_amount_requested": "100",
        "currency": "USD",
        "tracking_id": "order-pending-001",
        "client_id": "broker123"
      }
    }
  }'
```

**Confirmed Status:**
```bash
curl -X POST http://localhost:3000/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: test_sig" \
  -d '{
    "data": {
      "id": "deposit_confirmed_001",
      "type": "deposit",
      "attributes": {
        "status": "confirmed",
        "target_amount_requested": "100",
        "currency": "USD",
        "tracking_id": "order-confirmed-001",
        "client_id": "broker123"
      }
    }
  }'
```

**Failed Status:**
```bash
curl -X POST http://localhost:3000/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: test_sig" \
  -d '{
    "data": {
      "id": "deposit_failed_001",
      "type": "deposit",
      "attributes": {
        "status": "failed",
        "target_amount_requested": "100",
        "currency": "USD",
        "tracking_id": "order-failed-001",
        "client_id": "broker123",
        "failure_reason": "Insufficient funds"
      }
    }
  }'
```

### Multi-Currency Webhook Examples

**Bitcoin Deposit:**
```bash
curl -X POST http://localhost:3000/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: test_sig" \
  -d '{
    "data": {
      "id": "deposit_btc_001",
      "type": "deposit",
      "attributes": {
        "status": "confirmed",
        "target_amount_requested": "0.001",
        "currency": "BTC",
        "tracking_id": "order-btc-001",
        "client_id": "broker123",
        "exchange_rate": 45000.00
      }
    }
  }'
```

**Ethereum Deposit:**
```bash
curl -X POST http://localhost:3000/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: test_sig" \
  -d '{
    "data": {
      "id": "deposit_eth_001",
      "type": "deposit",
      "attributes": {
        "status": "confirmed",
        "target_amount_requested": "0.05",
        "currency": "ETH",
        "tracking_id": "order-eth-001",
        "client_id": "broker123",
        "exchange_rate": 2500.00
      }
    }
  }'
```

### Error Testing - Wrong HTTP Method
```bash
curl -X GET http://localhost:3000/api/pay/callback
```

**Expected Response (405):**
```json
{
  "error": "Method Not Allowed"
}
```

### Error Testing - Invalid JSON
```bash
curl -X POST http://localhost:3000/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: test_sig" \
  -d 'invalid json'
```

---

## 4. Complete Integration Flow Test

### Step 1: Create Payment URL
```bash
# Save the response to extract order_id
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{
    "amount": 150,
    "currency": "USD",
    "client_id": "integration_test_001",
    "return_url": "https://my.itrader.global/dashboard"
  }' > payment_response.json

# Display the response
cat payment_response.json | json_pp
```

### Step 2: Simulate Webhook Callback
```bash
# Extract order_id from previous response and use it here
ORDER_ID="your-order-id-from-step-1"

curl -X POST http://localhost:3000/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: test_signature" \
  -d "{
    \"data\": {
      \"id\": \"deposit_integration_test\",
      \"type\": \"deposit\",
      \"attributes\": {
        \"status\": \"confirmed\",
        \"target_amount_requested\": \"150\",
        \"currency\": \"USD\",
        \"tracking_id\": \"$ORDER_ID\",
        \"client_id\": \"integration_test_001\"
      }
    }
  }"
```

---

## 5. Batch Testing Script

Create a file `test-all-endpoints.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
TOKEN="changeme"

echo "=== Broctagon CRM Integration Tests ==="
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s -X GET $BASE_URL/health | json_pp
echo ""

# Test 2: Payment URL
echo "2. Testing Payment URL Generation..."
PAYMENT_RESPONSE=$(curl -s -X POST $BASE_URL/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: $TOKEN" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "client_id": "test_client_001"
  }')

echo $PAYMENT_RESPONSE | json_pp
ORDER_ID=$(echo $PAYMENT_RESPONSE | jq -r '.order_id')
echo "Generated Order ID: $ORDER_ID"
echo ""

# Test 3: Webhook Callback
echo "3. Testing Webhook Callback..."
curl -s -X POST $BASE_URL/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: test_sig" \
  -d "{
    \"data\": {
      \"id\": \"deposit_test_001\",
      \"type\": \"deposit\",
      \"attributes\": {
        \"status\": \"confirmed\",
        \"target_amount_requested\": \"100\",
        \"currency\": \"USD\",
        \"tracking_id\": \"$ORDER_ID\",
        \"client_id\": \"test_client_001\"
      }
    }
  }" | json_pp

echo ""
echo "=== All Tests Completed ==="
```

Make it executable and run:
```bash
chmod +x test-all-endpoints.sh
./test-all-endpoints.sh
```

---

## 6. Advanced Testing

### Test with Verbose Output
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 100, "currency": "USD", "client_id": "broker123"}' \
  -v
```

### Test Response Time
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 100, "currency": "USD", "client_id": "broker123"}' \
  -w "\nTime Total: %{time_total}s\n"
```

### Test with Output to File
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 100, "currency": "USD", "client_id": "broker123"}' \
  -o response.json
```

### Pretty Print JSON Response (using jq)
```bash
curl -s -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 100, "currency": "USD", "client_id": "broker123"}' \
  | jq '.'
```

---

## 7. Load Testing with cURL

### Sequential Requests
```bash
for i in {1..10}; do
  echo "Request $i"
  curl -s -X POST http://localhost:3000/api/pay/url \
    -H "Content-Type: application/json" \
    -H "crm-pay-token: changeme" \
    -d "{\"amount\": 100, \"currency\": \"USD\", \"client_id\": \"client_$i\"}" \
    | jq '.order_id'
done
```

### Parallel Requests
```bash
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/api/pay/url \
    -H "Content-Type: application/json" \
    -H "crm-pay-token: changeme" \
    -d "{\"amount\": 100, \"currency\": \"USD\", \"client_id\": \"client_$i\"}" &
done
wait
```

---

## 8. Environment-Specific Testing

### Development
```bash
BASE_URL="http://localhost:3000"
```

### Staging
```bash
BASE_URL="https://staging-api.example.com"
```

### Production
```bash
BASE_URL="https://api.example.com"
```

---

## 9. Troubleshooting

### Check if Server is Running
```bash
curl -I http://localhost:3000/health
```

### Test with Different Content Types
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "crm-pay-token: changeme" \
  -d "amount=100&currency=USD&client_id=broker123"
```

### Check Response Headers
```bash
curl -X POST http://localhost:3000/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: changeme" \
  -d '{"amount": 100, "currency": "USD", "client_id": "broker123"}' \
  -i
```

---

## 10. Automated Test Suite

Create `automated-tests.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
TOKEN="changeme"
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local test_name="$1"
    local expected_status="$2"
    local actual_status="$3"
    
    if [ "$expected_status" -eq "$actual_status" ]; then
        echo -e "${GREEN}✓${NC} $test_name (Status: $actual_status)"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $test_name (Expected: $expected_status, Got: $actual_status)"
        ((FAILED++))
    fi
}

echo "Running Automated Tests..."
echo ""

# Test 1: Health Check
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
test_endpoint "Health Check" 200 $STATUS

# Test 2: Valid Payment URL
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: $TOKEN" \
  -d '{"amount": 100, "currency": "USD", "client_id": "test123"}')
test_endpoint "Valid Payment URL" 200 $STATUS

# Test 3: Missing Token
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/pay/url \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "USD", "client_id": "test123"}')
test_endpoint "Missing Token" 401 $STATUS

# Test 4: Invalid Method
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/api/pay/url)
test_endpoint "Invalid Method" 405 $STATUS

# Test 5: Missing Required Fields
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: $TOKEN" \
  -d '{"amount": 100}')
test_endpoint "Missing Required Fields" 400 $STATUS

# Test 6: Valid Webhook
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/api/pay/callback \
  -H "Content-Type: application/json" \
  -d '{"data": {"id": "test", "attributes": {"tracking_id": "order-001"}}}')
test_endpoint "Valid Webhook" 200 $STATUS

echo ""
echo "=============================="
echo "Tests Passed: $PASSED"
echo "Tests Failed: $FAILED"
echo "=============================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
```

Run the automated tests:
```bash
chmod +x automated-tests.sh
./automated-tests.sh
```

---

## Notes

- Replace `changeme` with your actual `CRM_PAY_TOKEN`
- Replace `http://localhost:3000` with your actual server URL
- For production testing, always use HTTPS
- Keep your API tokens secure and never commit them to version control
- Use environment variables for sensitive data

---

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify environment variables are correctly configured
3. Ensure the server is running and accessible
4. Check network connectivity and firewall rules
