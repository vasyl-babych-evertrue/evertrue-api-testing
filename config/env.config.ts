/**
 * Environment configuration for API testing
 * Store sensitive data in .env file (not committed to git)
 */

import { DEFAULT_APP_KEY, getAppKey } from './app-keys.config';

export const config = {
  baseURL: process.env.API_BASE_URL || 'https://stage-api.evertrue.com',
  
  // API Headers
  headers: {
    applicationKey: process.env.APPLICATION_KEY || DEFAULT_APP_KEY,
    deviceId: process.env.DEVICE_ID || 'a4ffbd49f46914ab81c1b8262c8a246ce6c303870752493c439f715a0a20c4a1',
    authorizationProvider: 'EvertrueBasicAuth',
    host: 'stage-api.evertrue.com',
  },
  
  // User credentials (Base64 encoded)
  auth: {
    // Super Admin (GivingTree Owner) - vasyl.babych@evertrue.com:p0o9P)O(p0o9P)O(
    superAdminToken: process.env.SUPER_ADMIN_TOKEN || 'dmFzeWwuYmFieWNoQGV2ZXJ0cnVlLmNvbTpwMG85UClPKHAwbzlQKU8o',
    
    // Regular User (GivingTree User) - vasyl.babych+3@swanteams.com:p0o9P)O(
    regularUserToken: process.env.REGULAR_USER_TOKEN || 'dmFzeWwuYmFieWNoKzNAc3dhbnRlYW1zLmNvbTpwMG85UClPKA==',
    
    // Test User - 021e981a-b23a-41dc-99b6-c2bbb200d43b@mailslurp.xyz:12341234
    testUserToken: process.env.TEST_USER_TOKEN || 'MDIxZTk4MWEtYjIzYS00MWRjLTk5YjYtYzJiYmIyMDBkNDNiQG1haWxzbHVycC54eXo6MTIzNDEyMzQ=',
    
    // Backward compatibility
    basicToken: process.env.BASIC_AUTH_TOKEN || 'dmFzeWwuYmFieWNoQGV2ZXJ0cnVlLmNvbTpwMG85UClPKHAwbzlQKU8o',
  },
  
  // Test configuration
  test: {
    timeout: 30000,
    retries: 2,
  }
};

// Export helper functions to get specific app keys and tokens
export { getAppKey, DEFAULT_APP_KEY } from './app-keys.config';
export { getAppToken, DEFAULT_APP_TOKEN } from './app-tokens.config';
