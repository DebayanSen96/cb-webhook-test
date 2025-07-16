import dotenv from 'dotenv';
import express from 'express';
import { Coinbase, Webhook } from '@coinbase/coinbase-sdk';
import {
  generateJWT,
  generateSessionToken,
  formatAddressesForToken,
  generateOnrampURL
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
async function initSDK() {
  Coinbase.configure({ apiKeyName: KEY_NAME, privateKey: KEY_SECRET });
}

async function createWebhook(notificationUri: string) {
  return await Webhook.create({
    networkId: 'base-mainnet',
    notificationUri,
    eventType: 'wallet_activity',
    eventTypeFilter: {
      addresses: [WALLET_ADDRESS],
      wallet_id: ''
    }
  });
}

// -------------------- MAIN FLOW --------------------
(async () => {
  await initSDK();

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

  // 3. Create webhook
  const publicWebhookUrl = 'https://example.com/callback'; // dummy URL because Coinbase rejects localhost
  const webhook = await createWebhook(publicWebhookUrl);
  console.log('Created webhook:', webhook.toString());

  // 4. Verify webhook exists
  const list = await Webhook.list();
  console.log('Total webhooks:', list.data.length);

  // 5. Delete webhook
  await webhook.delete();
  console.log('Webhook deleted.');

  process.exit(0);
})();
