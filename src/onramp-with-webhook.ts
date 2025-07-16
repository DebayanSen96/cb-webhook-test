import dotenv from 'dotenv';
import express from 'express';
import {
  generateJWT,
  generateSessionToken,
  formatAddressesForToken,
  generateOnrampURL,
  getTransactionStatus
} from './session';

// -------------------- CONFIG --------------------
dotenv.config();

const KEY_SECRET = process.env.KEY_SECRET as string;
const KEY_NAME = process.env.KEY_NAME as string; // required for SDK init, set in .env

if (!KEY_SECRET || !KEY_NAME) {
  console.error('Missing KEY_SECRET or KEY_NAME in .env');
  process.exit(1);
}

const WALLET_ADDRESS = '0x1234567890123456789012345678901234567890';
const NETWORKS = ['ethereum'];
const ASSETS = ['ETH'];
const PORT = 3000;

// -------------------- HELPERS --------------------
async function createOnrampWebhook(notificationUri: string, signatureHeader: string) {
  const requestPath = '/onramp/v1/webhooks';
  const jwt = await generateJWT(KEY_NAME, KEY_SECRET, 'POST', 'api.developer.coinbase.com', requestPath);
  const resp = await fetch(`https://api.developer.coinbase.com${requestPath}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ notification_uri: notificationUri, signature_header: signatureHeader })
  });
  if (!resp.ok) throw new Error(`Create webhook failed: ${resp.status} ${await resp.text()}`);
  return await resp.json();
}

async function listOnrampWebhooks() {
  const requestPath = '/onramp/v1/webhooks';
  const jwt = await generateJWT(KEY_NAME, KEY_SECRET, 'GET', 'api.developer.coinbase.com', requestPath);
  const resp = await fetch(`https://api.developer.coinbase.com${requestPath}`, {
    headers: { 'Authorization': `Bearer ${jwt}` }
  });
  if (!resp.ok) throw new Error(`List webhooks failed: ${resp.status} ${await resp.text()}`);
  return await resp.json();
}

async function deleteOnrampWebhook(id: string) {
  const requestPath = `/onramp/v1/webhooks/${id}`;
  const jwt = await generateJWT(KEY_NAME, KEY_SECRET, 'DELETE', 'api.developer.coinbase.com', requestPath);
  const resp = await fetch(`https://api.developer.coinbase.com${requestPath}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${jwt}` }
  });
  if (!resp.ok) throw new Error(`Delete webhook failed: ${resp.status} ${await resp.text()}`);
} 

// -------------------- MAIN FLOW --------------------
(async () => {
  

  // 1. Start webhook server
  const app = express();
  app.use(express.json());
  app.post('/webhook/cb', (req, res) => {
    console.log('Received webhook:', JSON.stringify(req.body));
    res.sendStatus(200);
  });
  app.listen(PORT, () => console.log(`Webhook server listening on ${PORT}`));

  // 2. Generate session token & URL
  const jwt = await generateJWT(KEY_NAME, KEY_SECRET);
  const sessionToken = await generateSessionToken(jwt, {
    addresses: formatAddressesForToken(WALLET_ADDRESS, NETWORKS),
    assets: ASSETS
  });
  if (!sessionToken) {
    console.error('Failed to create session token');
    process.exit(1);
  }
  const partnerUserId = `user_${Date.now()}`;
  const onrampUrl = generateOnrampURL({
    sessionToken,
    defaultNetwork: NETWORKS[0],
    defaultAsset: ASSETS[0],
    partnerUserId,
    redirectUrl: 'https://example.com/success'
  });
  console.log('Onramp URL:', onrampUrl);

  // 3. Poll transaction status until terminal state (success | failed | canceled)
  console.log('Polling transaction status (max 5 attempts)...');
  for (let i = 0; i < 5; i++) {
    const path = `/onramp/v1/buy/user/${partnerUserId}/transactions`;
    const statusJwt = await generateJWT(KEY_NAME, KEY_SECRET, 'GET', 'api.developer.coinbase.com', path);
    const resp = await getTransactionStatus(statusJwt, partnerUserId);
    const latest = resp?.data?.[0];
    if (latest) {
      console.log(`Attempt ${i+1}: status = ${latest.status}`);
      if (['success', 'failed', 'canceled'].includes(latest.status)) break;
    } else {
      console.log(`Attempt ${i+1}: no transaction yet`);
    }
    await new Promise(r => setTimeout(r, 5000)); // wait 5s
  }

  process.exit(0);
})();
