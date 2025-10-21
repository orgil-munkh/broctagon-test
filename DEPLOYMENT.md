# Vercel Deployment Guide

This guide walks you through deploying the Broctagon CRM Integration to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm i -g vercel`
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Quick Deployment

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project directory**:
   ```bash
   cd /path/to/your/project
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Set up project settings
   - Deploy to preview

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Project**:
   - Framework Preset: "Other"
   - Build Command: `npm run vercel-build`
   - Output Directory: Leave empty
   - Install Command: `npm install`

3. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

## Environment Variables

### Required Environment Variables

Set these in your Vercel project dashboard or via CLI:

```bash
# CRM Configuration
CRM_PAY_TOKEN=your_secure_token_here
CRM_CALLBACK_URL=https://your-crm.com/api

# Coinsbuy Configuration
COINSBUY_URL=https://api.coinsbuy.com
COINSBUY_AUTH_TOKEN=your_coinsbuy_token
COINSBUY_WALLET_ID=1

# Server Configuration
NODE_ENV=production
PSP_SANDBOX_MODE=false

# Optional
ALLOWED_ORIGINS=https://yourdomain.com
LOG_LEVEL=info
```

### Setting Environment Variables

#### Via Vercel CLI:
```bash
vercel env add CRM_PAY_TOKEN
vercel env add CRM_CALLBACK_URL
vercel env add COINSBUY_URL
vercel env add COINSBUY_AUTH_TOKEN
vercel env add COINSBUY_WALLET_ID
vercel env add NODE_ENV
vercel env add PSP_SANDBOX_MODE
```

#### Via Vercel Dashboard:
1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable with appropriate values
4. Set environment scope (Production, Preview, Development)

## Project Structure for Vercel

```
your-project/
├── api/
│   ├── health.js          # Health check endpoint
│   └── pay/
│       ├── url.js         # Payment URL generation
│       └── callback.js    # Webhook callback handler
├── lib/
│   ├── logger.js          # Logging utility
│   ├── psp-client.js      # Coinsbuy integration
│   ├── validators.js      # Request validation
│   └── serverless-handler.js # Vercel wrapper
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies
└── .vercelignore          # Files to exclude
```

## API Endpoints

After deployment, your endpoints will be available at:

- **Health Check**: `https://your-project.vercel.app/health`
- **Payment URL**: `https://your-project.vercel.app/api/pay/url`
- **Webhook Callback**: `https://your-project.vercel.app/api/pay/callback`

## Testing Deployed Endpoints

### 1. Health Check
```bash
curl https://your-project.vercel.app/health
```

### 2. Payment URL Generation
```bash
curl -X POST https://your-project.vercel.app/api/pay/url \
  -H "Content-Type: application/json" \
  -H "crm-pay-token: your_token" \
  -d '{
    "amount": 100,
    "currency": "USD",
    "client_id": "test_client"
  }'
```

### 3. Webhook Callback
```bash
curl -X POST https://your-project.vercel.app/api/pay/callback \
  -H "Content-Type: application/json" \
  -H "x-coinsbuy-signature: test_sig" \
  -d '{
    "data": {
      "id": "deposit_001",
      "attributes": {
        "status": "confirmed",
        "target_amount_requested": "100",
        "currency": "USD",
        "tracking_id": "order-001",
        "client_id": "test_client"
      }
    }
  }'
```

## Webhook Configuration

### Update Coinsbuy Dashboard

1. **Login to Coinsbuy Dashboard**
2. **Go to Webhook Settings**
3. **Set Callback URL**: `https://your-project.vercel.app/api/pay/callback`
4. **Configure Events**: Select deposit-related events
5. **Test Webhook**: Use Coinsbuy's test feature

### Update Broctagon CRM

1. **Login to Broctagon CRM**
2. **Go to Integration Settings**
3. **Set Payment URL Endpoint**: `https://your-project.vercel.app/api/pay/url`
4. **Set CRM Pay Token**: Use the same token as `CRM_PAY_TOKEN`
5. **Test Integration**: Create a test deposit

## Monitoring and Logs

### Vercel Function Logs

1. **Via Vercel Dashboard**:
   - Go to your project
   - Click "Functions" tab
   - View real-time logs

2. **Via Vercel CLI**:
   ```bash
   vercel logs your-project-url
   ```

### Custom Logging

The application uses Winston for structured logging. In Vercel, logs are sent to stdout/stderr and captured by Vercel's logging system.

For persistent logs, consider integrating:
- **LogDNA**: `npm install logdna-winston`
- **Datadog**: `npm install winston-datadog-logs`
- **Sentry**: `npm install @sentry/node`

## Performance Considerations

### Vercel Limits

- **Hobby Plan**: 10-second function timeout
- **Pro Plan**: 60-second function timeout
- **Cold Starts**: First request may be slower
- **Memory**: 1024MB per function

### Optimization Tips

1. **Keep Functions Lightweight**:
   - Minimize dependencies
   - Use connection pooling
   - Cache frequently used data

2. **Handle Cold Starts**:
   - Implement health checks
   - Use warm-up requests
   - Consider Vercel Edge Functions

3. **Monitor Performance**:
   - Use Vercel Analytics
   - Set up alerts
   - Monitor function duration

## Troubleshooting

### Common Issues

1. **Function Timeout**:
   - Check function duration in logs
   - Optimize slow operations
   - Consider upgrading plan

2. **Environment Variables**:
   - Verify all required variables are set
   - Check variable names (case-sensitive)
   - Redeploy after adding variables

3. **CORS Issues**:
   - Check `ALLOWED_ORIGINS` setting
   - Verify request headers
   - Test with different origins

4. **Webhook Failures**:
   - Check webhook URL is correct
   - Verify signature validation
   - Check CRM callback URL

### Debug Steps

1. **Check Function Logs**:
   ```bash
   vercel logs --follow
   ```

2. **Test Locally with Vercel**:
   ```bash
   vercel dev
   ```

3. **Verify Environment Variables**:
   ```bash
   vercel env ls
   ```

4. **Check Function Status**:
   ```bash
   vercel inspect your-project-url
   ```

## Security Best Practices

1. **Environment Variables**:
   - Never commit secrets to Git
   - Use Vercel's environment variable system
   - Rotate tokens regularly

2. **API Security**:
   - Validate all inputs
   - Use HTTPS only
   - Implement rate limiting

3. **Webhook Security**:
   - Verify webhook signatures
   - Use secure tokens
   - Log security events

## Scaling Considerations

### Auto-scaling

Vercel automatically scales your functions based on demand. No manual configuration needed.

### High Traffic

For high-traffic applications:
- Consider Vercel Pro plan
- Use Edge Functions for better performance
- Implement caching strategies
- Monitor function concurrency

### Database Connections

If using databases:
- Use connection pooling
- Consider serverless databases (PlanetScale, Neon)
- Implement connection limits
- Monitor connection usage

## Support

### Vercel Support

- **Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Support**: Available on Pro plans

### Project Support

- Check logs for error details
- Verify environment configuration
- Test endpoints individually
- Review webhook configuration

## Next Steps

After successful deployment:

1. **Test all endpoints** with real data
2. **Configure monitoring** and alerts
3. **Set up CI/CD** for automatic deployments
4. **Document API** for your team
5. **Plan for scaling** based on usage

---

**Note**: This deployment guide assumes you're using the standard Vercel Node.js runtime. For advanced configurations or custom runtimes, refer to the [Vercel documentation](https://vercel.com/docs).
