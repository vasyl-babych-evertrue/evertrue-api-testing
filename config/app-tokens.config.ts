/**
 * Application Tokens Configuration
 * 
 * App Tokens are "godmode" passwords for backend services that don't expire.
 * These tokens are only available for backend applications ("services").
 * 
 * IMPORTANT: These are STAGING ONLY tokens!
 * Production tokens are stored securely in Vault.
 * 
 * Usage:
 * import { getAppToken } from './app-tokens.config';
 * const token = getAppToken('volunteers_api');
 */

/**
 * Application Tokens for STAGING environment
 * Based on Auth API documentation
 */
export const APP_TOKENS = {
  auth_api: 'MTpiY2VWZTRNU3pGV3M3dkZwQThEcg==',
  contacts_api: 'MjpyMmlqbWhnV0hRb0J4MlFueWFIcA==',
  lids_api: 'Mzpmd0hTbUtTeTlrNGlFWThiNUc4cg==',
  capi_migrator: 'NzppRm9RLWRudV9FQWZudkdFOXZoRA==',
  csv_importer: 'ODp2X1NIY1EzY3pNelNKaVAtd3NURA==',
  reds_api: 'OTpTLW14U2ViczFvOVhDZTJyblB0Sg==',
  reporting_api: 'MTE6WnktLUZ5WUwzb1RXRVc1cmJRY20=',
  search_api: 'MTI6eDY2WThILUxKMWJ6ajN2Y19oQTE=',
  storm: 'MTM6cXlXeWFyVk5YSmRXdDVXWnlHNnA=',
  ems_api: 'MTQ6NTdDQzVXQVBTeUMzbko1Z29kekM=',
  dna_api: 'MTU6aVpzWU1SRUNmazdIcWUxb2JLanM=',
  hadoop: 'MTY6VUtFNndXNFVTV1Z2ZUctN1pidHk=',
  upload: 'MTc6bmIxQ2g1UXlBeWNTeHhGcUVxdXg=',
  scout_auth_api: 'MTg6YXN6V25uWGNyV2pRcDZ5bVl5YUE=',
  scout_contacts_api: 'MTk6OHFRc3Q4UmZ6cC1SUnpzcGItdTc=',
  scout_lids_api: 'MjA6LUhzN0h6NWJNN1J5ekVUdGRYeTk=',
  scout_importer: 'MjE6dEFfR3ZDbVluU0sxZU5kTlI1YXo=',
  scout_ems_api: 'MjI6dTlnNDZ6X1JweFFwRzUtbUVhQm4=',
  scout_dna_api: 'MjQ6X25feDliQ2haUmZfTmd3ekNNVTg=',
  soda_fountain: 'MjU6dFI4TVl5emJFZGZTV19vbng5d1Y=',
  buoys: 'MjY6dWc3d3prbVJNVmV6ellDdXg5Nlk=',
  ugc_api: 'Mjc6RDNHUVZSODFRdWZ6aFlIY2hnTXM=',
  harbormaster: 'Mjg6eDNEM3hjc0p1N0d6OC1NZlZtazY=',
  payments_api: 'Mjk6WXcxM0RlMllBcFdXeXFnRHM5SFE=',
  salesforce_syncer: 'MzE6ZzREcG5HemgxVEpkcjNYdXFoQkI=',
  volunteers_api: 'MzI6X0ZrcW9mWktZS2YzelZHc01FRXc=',
} as const;

/**
 * Helper function to get App Token by service name
 * @param serviceName - Name of the service (e.g., 'volunteers_api')
 * @returns App Token for the specified service
 * @throws Error if service name is not found
 */
export function getAppToken(serviceName: keyof typeof APP_TOKENS): string {
  const token = APP_TOKENS[serviceName];
  if (!token) {
    throw new Error(`App Token not found for service: ${serviceName}`);
  }
  return token;
}

/**
 * Get all available service names
 * @returns Array of service names that have App Tokens
 */
export function getAvailableServices(): Array<keyof typeof APP_TOKENS> {
  return Object.keys(APP_TOKENS) as Array<keyof typeof APP_TOKENS>;
}

/**
 * Check if a service has an App Token
 * @param serviceName - Name of the service to check
 * @returns True if service has an App Token
 */
export function hasAppToken(serviceName: string): serviceName is keyof typeof APP_TOKENS {
  return serviceName in APP_TOKENS;
}

/**
 * Default App Token (volunteers_api) for convenience
 */
export const DEFAULT_APP_TOKEN = APP_TOKENS.volunteers_api;
