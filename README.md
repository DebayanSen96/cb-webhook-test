# Coinbase Onramp Integration Documentation

This project demonstrates integration with Coinbase's Onramp API for fiat-to-crypto transactions, including session token generation, URL creation, and transaction status monitoring.

## Project Structure

- `src/index.ts` - Main demo script showing JWT generation, session token creation, and onramp URL generation
- `src/session.ts` - Core helper functions for JWT, session tokens, and API calls
- `src/onramp-with-webhook.ts` - Express server with transaction status polling (webhook-ready)

## Setup Requirements

1. Create a `.env` file with your Coinbase Developer Platform credentials:
   ```
   KEY_NAME=your_api_key_id
   KEY_SECRET=your_api_key_secret
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Core Concepts

### Authentication Flow

1. **JWT Generation**
   - Creates a signed JWT using your API credentials
   - Required for all authenticated API calls
   - JWT includes request method, host, path, and expiration

2. **Session Token Generation**
   - Secure Init requires server-side session token generation
   - Tokens are single-use and expire after 5 minutes
   - Contains encoded wallet addresses and permissions

3. **Onramp URL Creation**
   - Combines session token with additional parameters
   - Uses a unique `partnerUserId` to track the session
   - Can include optional parameters like default asset/network

## Transaction Status Monitoring

### Current Implementation: Polling

Due to Coinbase API limitations, the project currently uses polling to check transaction status:

1. Generate a unique `partnerUserId` for each session
2. Include this ID in the onramp URL
3. Poll the transaction status endpoint:
   ```
   GET /onramp/v1/buy/user/{partnerUserId}/transactions
   ```
4. Check for status changes: `pending` → `processing` → `success`/`failed`/`canceled`

### Future Implementation: Webhooks

The code includes webhook helpers that will work once Coinbase exposes the public endpoint:

1. **Webhook Registration**
   - Create webhook with notification URI and signature header
   - Webhook will receive real-time transaction status updates

2. **Webhook Event Handling**
   - Express server to receive `onramp_session_updated` events
   - Events include transaction status and details
   - Signature verification for security (to be implemented)

3. **Webhook Management**
   - List existing webhooks
   - Delete webhooks when no longer needed

## Known Limitations

1. **Webhook API Unavailability**
   - The dedicated Onramp webhook endpoint (`/onramp/v1/webhooks`) is not yet publicly available
   - Returns 404 Not Found when called
   - Polling is required until Coinbase exposes this endpoint

2. **Localhost Restrictions**
   - Coinbase rejects localhost webhook URLs
   - Production requires a public HTTPS endpoint
   - For testing, use a dummy public URL

3. **Session Token Requirements**
   - Tokens are single-use only
   - Must be generated server-side
   - Cannot be reused across sessions

## Usage Examples

### Generate Onramp URL

```typescript
// Start the demo
npm run start

// Output includes:
// - JWT generation details
// - Session token request/response
// - Complete onramp URL for user checkout
```

### Monitor Transaction Status

```typescript
// Start the webhook server with polling
npm run onramp

// Output includes:
// - Express server startup
// - Session token generation
// - Onramp URL
// - Transaction status polling results
```

## Transaction Lifecycle

1. **Session Creation**
   - Generate session token
   - Create onramp URL with `partnerUserId`

2. **User Checkout**
   - User visits onramp URL
   - Selects asset, amount, and payment method
   - Completes payment

3. **Status Tracking**
   - Initial status: `pending`
   - During processing: `processing`
   - Final status: `success`, `failed`, or `canceled`
   - Status changes tracked via polling (or webhooks in future)

## Security Considerations

1. Store API credentials securely in environment variables
2. Generate session tokens server-side only
3. Implement webhook signature verification (when available)
4. Use HTTPS for all production endpoints
