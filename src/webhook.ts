import express from 'express';
import bodyParser from 'body-parser';
import { Coinbase, Webhook } from '@coinbase/coinbase-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get API credentials from environment variables
const keySecret = process.env.KEY_SECRET;
const keyName = process.env.KEY_NAME;

// Port for the webhook server
const PORT = process.env.PORT || 3000;

/**
 * Initialize the Coinbase SDK with API credentials
 */
const initializeCoinbaseSDK = () => {
  try {
    // Configure Coinbase SDK directly with API key and secret
    Coinbase.configure({
      apiKeyName: keyName || '',
      privateKey: keySecret || ''
    });
    console.log('Coinbase SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Coinbase SDK:', error);
    return false;
  }
};

/**
 * Create a webhook for Coinbase Onramp transaction notifications
 * @param notificationUri - The URI where webhook notifications will be sent
 * @param addresses - Optional array of addresses to track
 * @returns The created webhook object
 */
export const createOnrampWebhook = async (notificationUri: string, addresses: string[] = []): Promise<any> => {
  try {
    // Initialize the SDK
    const initialized = initializeCoinbaseSDK();
    if (!initialized) {
      throw new Error('Failed to initialize Coinbase SDK');
    }
    
    // Create a webhook for transaction notifications
    // For Onramp transactions, we'll use the erc20_transfer event type
    // This will notify us of any ERC20 token transfers related to the addresses
    const webhook = await Webhook.create({
      networkId: "base-mainnet", // You can change this to the appropriate network
      notificationUri: notificationUri,
      eventType: "erc20_transfer",
      // If you have specific contract addresses to track, add them here
      eventFilters: []
    });
    
    console.log(`Webhook successfully created: ${webhook.toString()}`);
    return webhook;
  } catch (error) {
    console.error('Error creating webhook:', error);
    throw error;
  }
};

/**
 * List all webhooks
 * @returns Array of webhook objects
 */
export const listWebhooks = async (): Promise<any[]> => {
  try {
    // Initialize the SDK
    const initialized = initializeCoinbaseSDK();
    if (!initialized) {
      throw new Error('Failed to initialize Coinbase SDK');
    }
    
    // List all webhooks
    const response = await Webhook.list();
    const webhooks = response.data;
    
    console.log(`Found ${webhooks.length} webhooks`);
    return webhooks;
  } catch (error) {
    console.error('Error listing webhooks:', error);
    throw error;
  }
};

/**
 * Delete a webhook
 * @param webhookId - ID of the webhook to delete
 */
export const deleteWebhook = async (webhookId: string): Promise<void> => {
  try {
    // Initialize the SDK
    const initialized = initializeCoinbaseSDK();
    if (!initialized) {
      throw new Error('Failed to initialize Coinbase SDK');
    }
    
    // List all webhooks to find the one to delete
    const webhooks = await listWebhooks();
    const webhook = webhooks.find(wh => wh.id === webhookId);
    
    if (webhook) {
      await webhook.delete();
      console.log(`Webhook ${webhookId} deleted successfully`);
    } else {
      throw new Error(`Webhook ${webhookId} not found`);
    }
  } catch (error) {
    console.error('Error deleting webhook:', error);
    throw error;
  }
};

/**
 * Create an Express server to handle webhook notifications
 * @returns Express app
 */
export const createWebhookServer = () => {
  const app = express();
  
  // Parse JSON request bodies
  app.use(bodyParser.json());
  
  // Endpoint to receive webhook notifications
  app.post('/webhook/coinbase', (req, res) => {
    try {
      // Get the webhook signature from headers
      const signature = req.headers['x-webhook-signature'];
      
      // Log the received webhook event
      console.log('Received webhook notification:');
      console.log('Signature:', signature);
      console.log('Payload:', JSON.stringify(req.body, null, 2));
      
      // TODO: Verify the webhook signature
      // This would require implementing signature verification logic
      
      // Process the webhook event based on its type
      const event = req.body;
      
      switch (event.type) {
        case 'transaction.created':
          console.log('New transaction created:', event.data.id);
          // Handle new transaction
          break;
        case 'transaction.completed':
          console.log('Transaction completed:', event.data.id);
          // Update transaction status
          break;
        case 'transaction.failed':
          console.log('Transaction failed:', event.data.id, event.data.error);
          // Handle failed transaction
          break;
        default:
          console.log('Unknown event type:', event.type);
      }
      
      // Always respond with 200 OK to acknowledge receipt
      res.status(200).send('Webhook received');
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error processing webhook');
    }
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('Webhook server is running');
  });
  
  return app;
};

/**
 * Start the webhook server
 */
export const startWebhookServer = () => {
  const app = createWebhookServer();
  
  app.listen(PORT, () => {
    console.log(`Webhook server running on port ${PORT}`);
    console.log(`Webhook URL: http://localhost:${PORT}/webhook/coinbase`);
  });
  
  return app;
};

// If this file is run directly, start the webhook server
if (require.main === module) {
  startWebhookServer();
}
