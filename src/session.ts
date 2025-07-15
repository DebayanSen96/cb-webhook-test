import { generateJwt } from '@coinbase/cdp-sdk/auth';

interface SessionTokenRequest {
  addresses: Array<{
    address: string;
    blockchains: string[];
  }>;
  assets?: string[];
}

interface SessionTokenResponse {
  token: string;
  channel_id?: string;
}

/**
 * Generates a JWT token for CDP API authentication
 * @param keyName - The CDP API key name (KEY_NAME)
 * @param keySecret - The CDP API private key (KEY_SECRET)
 * @param requestMethod - HTTP method for the request (default: 'POST')
 * @param requestHost - Host for the request (default: 'api.developer.coinbase.com')
 * @param requestPath - Path for the request (default: '/onramp/v1/token')
 * @returns Promise of signed JWT token
 */
export async function generateJWT(
  keyName: string, 
  keySecret: string, 
  requestMethod: string = 'POST',
  requestHost: string = 'api.developer.coinbase.com',
  requestPath: string = '/onramp/v1/token'
): Promise<string> {
  try {
    console.log('Generating JWT with:');
    console.log('- API Key ID:', keyName.substring(0, 8) + '...');
    console.log('- Request Method:', requestMethod);
    console.log('- Request Host:', requestHost);
    console.log('- Request Path:', requestPath);
    
    const token = await generateJwt({
      apiKeyId: keyName,
      apiKeySecret: keySecret,
      requestMethod: requestMethod,
      requestHost: requestHost,
      requestPath: requestPath,
      expiresIn: 120 // 2 minutes expiry
    });
    
    return token;
  } catch (error) {
    console.error('Error generating JWT:', error);
    throw error;
  }
}

/**
 * Generates a session token for secure onramp initialization
 * @param jwt - JWT Bearer token for authentication
 * @param params - Parameters for session token generation
 * @returns The session token or null if generation fails
 */
export async function generateSessionToken(
  jwt: string,
  params: SessionTokenRequest
): Promise<string | null> {
  try {
    console.log('Sending request with params:', JSON.stringify(params, null, 2));
    
    const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(params),
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      throw new Error(`Failed to generate session token: ${response.status} ${responseText}`);
    }
    
    try {
      const data: SessionTokenResponse = JSON.parse(responseText);
      return data.token;
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
  } catch (error) {
    console.error('Error generating session token:', error);
    throw new Error('Failed to generate session token');
  }
}

/**
 * Helper function to format addresses for session token request
 * @param address - The wallet address
 * @param networks - Array of blockchain networks
 * @returns Formatted addresses array
 */
export function formatAddressesForToken(
  address: string,
  networks: string[]
): Array<{ address: string; blockchains: string[] }> {
  return [
    {
      address,
      blockchains: networks,
    },
  ];
}

/**
 * Generates a Coinbase Onramp URL with Secure Init
 * @param params - Parameters for the Onramp URL
 * @returns Formatted Onramp URL
 */
export function generateOnrampURL(params: {
  sessionToken: string;
  defaultNetwork?: string;
  defaultAsset?: string;
  presetCryptoAmount?: number;
  presetFiatAmount?: number;
  defaultExperience?: 'send' | 'buy';
  defaultPaymentMethod?: string;
  fiatCurrency?: string;
  partnerUserId?: string;
  redirectUrl?: string;
  endPartnerName?: string;
}): string {
  const baseUrl = 'https://pay.coinbase.com/buy/select-asset';
  
  const queryParams = new URLSearchParams();
  queryParams.append('sessionToken', params.sessionToken);
  
  // With Secure Init, appId and addresses are no longer included in the URL
  // as they are encoded in the session token
  
  if (params.defaultNetwork) {
    queryParams.append('defaultNetwork', params.defaultNetwork);
  }
  
  if (params.defaultAsset) {
    queryParams.append('defaultAsset', params.defaultAsset);
  }
  
  if (params.presetCryptoAmount !== undefined) {
    queryParams.append('presetCryptoAmount', params.presetCryptoAmount.toString());
  }
  
  if (params.presetFiatAmount !== undefined && params.presetCryptoAmount === undefined) {
    queryParams.append('presetFiatAmount', params.presetFiatAmount.toString());
  }
  
  if (params.defaultExperience) {
    queryParams.append('defaultExperience', params.defaultExperience);
  }
  
  if (params.defaultPaymentMethod) {
    queryParams.append('defaultPaymentMethod', params.defaultPaymentMethod);
  }
  
  if (params.fiatCurrency) {
    queryParams.append('fiatCurrency', params.fiatCurrency);
  }
  
  if (params.partnerUserId) {
    queryParams.append('partnerUserId', params.partnerUserId);
  }
  
  if (params.redirectUrl) {
    queryParams.append('redirectUrl', params.redirectUrl);
  }
  
  if (params.endPartnerName) {
    queryParams.append('endPartnerName', params.endPartnerName);
  }
  
  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Get transaction status for a partner user ID
 * @param jwt - JWT token for authentication
 * @param partnerUserId - Partner user ID to check transactions for
 * @param pageSize - Number of transactions to return (default: 1)
 * @returns Promise of transaction status response
 */
export async function getTransactionStatus(
  jwt: string,
  partnerUserId: string,
  pageSize: number = 1
): Promise<any> {
  try {
    // Important: This API requires server-side authentication with JWT
    // It cannot be accessed directly from a browser without authorization
    const url = `https://api.developer.coinbase.com/onramp/v1/buy/user/${partnerUserId}/transactions?page_size=${pageSize}`;
    
    console.log(`Checking transaction status for partner user ID: ${partnerUserId}`);
    console.log(`API URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/json'
      }
    });
    
    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response body: ${responseText}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get transaction status: ${response.status} ${responseText}`);
    }
    
    try {
      return JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw error;
  }
}
