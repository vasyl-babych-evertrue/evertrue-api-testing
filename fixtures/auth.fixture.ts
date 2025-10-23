/**
 * Playwright fixtures for authentication
 * Provides authenticated request context with tokens
 */

import { test as base, APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { config } from '../config/env.config';

type AuthFixtures = {
  authToken: string;
  primeToken: string;
  authenticatedRequest: APIRequestContext;
};

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  // Get auth token by creating a session
  authToken: async ({ request }, use) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Device-ID': config.headers.deviceId,
        'host': config.headers.host,
        'Authorization': `Basic ${config.auth.basicToken}`,
      },
    });

    const body = await response.json();
    await use(body.token);
  },

  // Get prime token from session creation
  primeToken: async ({ request }, use) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Device-ID': config.headers.deviceId,
        'host': config.headers.host,
        'Authorization': `Basic ${config.auth.basicToken}`,
      },
    });

    const body = await response.json();
    await use(body.prime_token || body.token);
  },

  // Authenticated request context with token
  authenticatedRequest: async ({ authToken }, use) => {
    const context = await playwrightRequest.newContext({
      baseURL: process.env.API_BASE_URL || 'https://stage-api.evertrue.com',
      extraHTTPHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
      },
    });

    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
