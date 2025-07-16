import dotenv from 'dotenv';
import { 
  generateJWT, 
  generateSessionToken, 
  formatAddressesForToken,
  generateOnrampURL,
  getTransactionStatus
} from './session';

dotenv.config();

const keySecret = process.env.KEY_SECRET;
const keyName = process.env.KEY_NAME;

const walletAddress = '0x1234567890123456789012345678901234567890';
const networks = ['ethereum', 'base'];
const assets = ['ETH', 'USDC'];

const partnerUserId = `user_${Date.now()}`;

async function runOnrampDemo() {
  try {
    if (!keySecret || !keyName) {
      throw new Error('Missing required environment variables: KEY_SECRET or KEY_NAME');
    }

    console.log('Starting Coinbase Onramp Demo with Secure Init...');
    console.log('------------------------------------------------');
    
    console.log('Step 1: Generating JWT token...');
    const jwt = await generateJWT(keyName, keySecret);
    console.log('JWT token generated successfully');
    
    console.log('\nStep 2: Formatting addresses for session token request...');
    const formattedAddresses = formatAddressesForToken(walletAddress, networks);
    console.log('Using wallet address:', walletAddress);
    console.log('With networks:', networks.join(', '));
    
    console.log('\nStep 3: Generating session token...');
    const sessionToken = await generateSessionToken(jwt, {
      addresses: formattedAddresses,
      assets: assets
    });
    
    if (!sessionToken) {
      throw new Error('Failed to generate session token');
    }
    
    console.log('Session token generated successfully');
    
    console.log('\nStep 4: Generating onramp URL with Secure Init...');
    const onrampUrl = generateOnrampURL({
      sessionToken: sessionToken,
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
    
    
    console.log('\nStep 5: Transaction Status API Demo');
    console.log(`Partner User ID: ${partnerUserId}`);
    console.log('Checking transaction status with proper JWT authentication...');
    
    try {
      const requestPath = `/onramp/v1/buy/user/${partnerUserId}/transactions`;
      const requestMethod = 'GET';
      const requestHost = 'api.developer.coinbase.com';
      
      console.log('Generating JWT for transaction status API...');
      const statusJwt = await generateJWT(keyName, keySecret, requestMethod, requestHost, requestPath);
      
      const transactionStatus = await getTransactionStatus(statusJwt, partnerUserId);
      console.log('Transaction Status Response:', JSON.stringify(transactionStatus, null, 2));
    } catch (error: any) {
      console.log('Error checking transaction status:', error.message || 'Unknown error');
      console.log('Note: This is expected if no transactions exist for this partner user ID yet.');
    }
    
  } catch (error) {
    console.error('Error in Onramp demo:', error);
  }
}

runOnrampDemo();
