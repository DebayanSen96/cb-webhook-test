import dotenv from 'dotenv';
import { createOnrampWebhook, listWebhooks, startWebhookServer } from './webhook';

// Load environment variables
dotenv.config();

/**
 * Demo function to showcase webhook functionality
 */
async function runWebhookDemo() {
  try {
    console.log('Starting Coinbase Onramp Webhook Demo...');
    console.log('------------------------------------------------');
    
    // Step 1: Start the webhook server
    console.log('Step 1: Starting webhook server...');
    const server = startWebhookServer();
    
    // Step 2: Explain how webhooks work with Coinbase Onramp
    console.log('\nStep 2: Understanding Coinbase Onramp Webhooks');
    console.log('Webhooks provide real-time transaction status updates without polling.');
    console.log('When a transaction status changes, Coinbase will send a POST request');
    console.log('to your webhook endpoint with details about the transaction.');
    
    // Step 3: List existing webhooks
    console.log('\nStep 3: Listing existing webhooks...');
    try {
      const webhooks = await listWebhooks();
      
      if (webhooks && webhooks.length > 0) {
        console.log(`Found ${webhooks.length} existing webhooks:`);
        webhooks.forEach((webhook, index) => {
          console.log(`Webhook ${index + 1}:`);
          console.log(`- ID: ${webhook.id}`);
          console.log(`- URI: ${webhook.notificationUri}`);
          console.log(`- Event Type: ${webhook.eventType}`);
        });
      } else {
        console.log('No existing webhooks found');
      }
    } catch (error: any) {
      console.log('Error listing webhooks:', error.message);
      console.log('This is expected if you haven\'t set up the Coinbase SDK with a valid API key.');
      console.log('Continuing with demo...');
    }
    
    // Step 4: Create a new webhook (commented out to avoid creating multiple webhooks)
    console.log('\nStep 4: Creating a new webhook...');
    console.log('Note: This step is commented out to avoid creating multiple webhooks.');
    console.log('To create a new webhook, uncomment the code in webhook-demo.ts');
    
    /*
    try {
      // Replace with your actual webhook URL in production
      // For local testing, you can use a service like ngrok to expose your local server
      const webhookUrl = 'https://your-webhook-url.com/webhook/coinbase';
      
      // You can also specify addresses to track
      const addresses = ['0x1234567890123456789012345678901234567890'];
      
      const webhook = await createOnrampWebhook(webhookUrl, addresses);
      console.log('New webhook created:');
      console.log(`- ID: ${webhook.id}`);
      console.log(`- URI: ${webhook.notificationUri}`);
      console.log(`- Event Type: ${webhook.eventType}`);
    } catch (error: any) {
      console.log('Error creating webhook:', error.message);
    }
    */
    
    // Step 5: Explain how to integrate with the onramp flow
    console.log('\nStep 5: Integrating Webhooks with Onramp Flow');
    console.log('1. Generate a session token and onramp URL as before');
    console.log('2. Include a unique partnerUserId in the onramp URL');
    console.log('3. Store this partnerUserId in your database');
    console.log('4. When webhook events arrive, match them to the partnerUserId');
    console.log('5. Update your UI based on transaction status changes');
    
    // Summary
    console.log('\n------------------------------------------------');
    console.log('SUMMARY: Coinbase Onramp Webhook Integration');
    console.log('------------------------------------------------');
    console.log('1. Started a webhook server to receive transaction notifications');
    console.log('2. Explained how webhooks work with Coinbase Onramp');
    console.log('3. Listed existing webhooks (if any)');
    console.log('4. Demonstrated how to create a new webhook (commented out)');
    console.log('5. Explained how to integrate webhooks with the onramp flow');
    console.log('\nTo use webhooks in production:');
    console.log('- Deploy your webhook server to a publicly accessible URL');
    console.log('- Create a webhook with that URL using the createOnrampWebhook function');
    console.log('- Implement proper signature verification for security');
    console.log('- Process incoming webhook events based on their type');
    console.log('- Update your database and UI based on transaction status changes');
    console.log('------------------------------------------------');
    
    console.log('\nWebhook server is now running. Press Ctrl+C to stop.');
  } catch (error: any) {
    console.error('Error in webhook demo:', error.message);
  }
}

// Run the demo
runWebhookDemo();
