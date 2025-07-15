import dotenv from 'dotenv';
import { 
  generateJWT, 
  generateSessionToken, 
  formatAddressesForToken,
  generateOnrampURL,
  getTransactionStatus
} from './session';

// Load environment variables
dotenv.config();

// Get API credentials from environment variables
const keySecret = process.env.KEY_SECRET;
const keyName = process.env.KEY_NAME;

// Sample wallet address and networks
const walletAddress = '0x1234567890123456789012345678901234567890';
const networks = ['ethereum', 'base'];
const assets = ['ETH', 'USDC'];

// Generate a unique partner user ID (for transaction tracking)
const partnerUserId = `user_${Date.now()}`;

async function runOnrampDemo() {
  try {
    if (!keySecret || !keyName) {
      throw new Error('Missing required environment variables: KEY_SECRET or KEY_NAME');
    }

    console.log('Starting Coinbase Onramp Demo with Secure Init...');
    console.log('------------------------------------------------');
    
    // Step 1: Generate JWT token
    console.log('Step 1: Generating JWT token...');
    const jwt = await generateJWT(keyName, keySecret);
    console.log('JWT token generated successfully');
    
    // Step 2: Format addresses for token request
    console.log('\nStep 2: Formatting addresses for session token request...');
    const formattedAddresses = formatAddressesForToken(walletAddress, networks);
    console.log('Using wallet address:', walletAddress);
    console.log('With networks:', networks.join(', '));
    
    // Step 3: Generate session token
    console.log('\nStep 3: Generating session token...');
    const sessionToken = await generateSessionToken(jwt, {
      addresses: formattedAddresses,
      assets: assets
    });
    
    if (!sessionToken) {
      throw new Error('Failed to generate session token');
    }
    
    console.log('Session token generated successfully');
    
    // Step 4: Generate onramp URL with Secure Init
    console.log('\nStep 4: Generating onramp URL with Secure Init...');
    const onrampUrl = generateOnrampURL({
      sessionToken: sessionToken,
      // Note: appId and addresses are no longer included in URL params with Secure Init
      defaultNetwork: 'ethereum',
      defaultAsset: 'ETH',
      presetFiatAmount: 100,
      defaultExperience: 'buy',
      fiatCurrency: 'USD',
      partnerUserId: partnerUserId,
      redirectUrl: 'https://example.com/success'
    });
    
    console.log('\nCoinbase Onramp URL generated successfully:');
    console.log(onrampUrl);
    console.log('\nThis URL can be used to:');
    console.log('1. Direct users to the Coinbase Onramp flow');
    console.log('2. Allow users to purchase crypto with fiat currency');
    console.log('3. Send purchased crypto directly to the specified wallet address');
    
    // Step 5: Demonstrate transaction status check (optional)
    console.log('\nStep 5: Transaction Status API Demo');
    console.log(`Partner User ID: ${partnerUserId}`);
    console.log('In a real application, after the user completes a transaction, you can check its status using:');
    
    // This is a demonstration of how to use the Transaction Status API
    // In a real application, you would call this after the user completes a transaction
    console.log('\nExample of checking transaction status:');
    console.log(`GET https://api.developer.coinbase.com/onramp/v1/buy/user/${partnerUserId}/transactions?page_size=1`);
    
    // Uncomment the following code to actually check transaction status
    // Note: This will return no transactions until a user completes a transaction with this partnerUserId
    /*
    console.log('\nChecking for transactions...');
    const transactionStatus = await getTransactionStatus(jwt, partnerUserId, 1);
    
    if (transactionStatus && transactionStatus.transactions && transactionStatus.transactions.length > 0) {
      console.log('Transaction found:');
      console.log(JSON.stringify(transactionStatus.transactions[0], null, 2));
    } else {
      console.log('No transactions found for this partner user ID yet.');
    }
    */
    
    // Summary
    console.log('\n------------------------------------------------');
    console.log('SUMMARY: Coinbase Onramp with Secure Init');
    console.log('------------------------------------------------');
    console.log('1. Generated JWT token using CDP API key');
    console.log('2. Created session token with wallet address and networks');
    console.log('3. Generated onramp URL with session token (Secure Init)');
    console.log('4. Demonstrated how to track transactions');
    console.log('\nTo use this in production:');
    console.log('- Replace the sample wallet address with your user\'s actual address');
    console.log('- Implement proper error handling and retries');
    console.log('- Consider implementing webhooks for transaction notifications');
    console.log('------------------------------------------------');
    
  } catch (error) {
    console.error('Error in Onramp demo:', error);
  }
}

// Run the demo
runOnrampDemo();
