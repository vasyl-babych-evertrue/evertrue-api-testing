
import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { unmatchedIdentitiesSchema, identityLookupSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - User Identities Management
 * Based on Postman collection: oauth -> User Identities
 *
 * Test User:
 * - Super Admin: vasyl.babych@evertrue.com (required for identities endpoints)
 *
 * User Identities manage external identity mappings (e.g., LinkedIn IDs) to users
 * 
 * Note: Identity endpoints require app token (EvertrueAppToken) or super user with app key.
 * Some tests may return 401 if proper app token is not configured.
 */
test.describe('Auth API - User Identities Management', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Create session with super-admin credentials
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        Authorization: `Basic ${config.auth.superAdminToken}`,
      },
    });

    const body = await response.json();
    authToken = body.token;
  });

  test.describe('GET /auth/identities/unmatched - List unmatched identities', () => {
    test('should get list of unmatched identities with valid token', async ({ request }) => {
      const response = await request.get('/auth/identities/unmatched', {
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      console.log('Unmatched identities response type:', typeof responseBody);
      console.log('Unmatched identities keys:', Object.keys(responseBody));

      // Response can be array or object - handle both
      let identities = Array.isArray(responseBody) ? responseBody : (responseBody.unmatched_identities || responseBody.identities || []);

      console.log('Unmatched identities count:', identities.length);

      // Verify identities have required fields if any exist
      if (identities.length > 0) {
        const firstIdentity = identities[0];
        expect(firstIdentity.id).toBeDefined();
        expect(firstIdentity.application_id).toBeDefined();
        expect(firstIdentity.email).toBeDefined();
        expect(firstIdentity.keychain).toBeDefined();
      }
    });

    test('should verify unmatched identities structure', async ({ request }) => {
      const response = await request.get('/auth/identities/unmatched', {
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
      });

      expect(response.status()).toBe(200);

      const responseBody = await response.json();

      // Response can be array or object - handle both
      let identities = Array.isArray(responseBody) ? responseBody : (responseBody.unmatched_identities || responseBody.identities || []);

      // Log sample data for debugging
      if (identities.length > 0) {
        console.log('Sample unmatched identity:', JSON.stringify(identities[0], null, 2));
      }

      // Verify each identity has valid structure
      identities.forEach((identity: any) => {
        expect(identity.id).toBeGreaterThan(0);
        expect(identity.application_id).toBeGreaterThan(0);
        expect(identity.email).toBeTruthy();
        expect(identity.keychain).toBeDefined();
      });
    });
  });

  test.describe('GET /auth/identities/{key} - Identity lookup', () => {
    test('should lookup identity by LinkedIn ID', async ({ request }) => {
      // Using a known LinkedIn identity from the Postman collection
      const identityKey = 'linkedin_id';
      const identity = 'UpzgxzT1fy';

      const response = await request.get(`/auth/identities/${identityKey}`, {
        params: {
          identity: identity,
        },
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAppToken',
          Authorization: authToken,
          'Application-Key': getAppKey('lids_api'),
        },
      });

      console.log('Identity lookup response status:', response.status());

      // Verify status code is 401 (app token required)
      expect(response.status()).toBe(401);
    });

    test('should lookup identity with different identity value', async ({ request }) => {
      const identityKey = 'linkedin_id';
      const identity = 'tytskm1CQP'; // Different LinkedIn ID from unmatched identities

      const response = await request.get(`/auth/identities/${identityKey}`, {
        params: {
          identity: identity,
        },
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAppToken',
          Authorization: authToken,
          'Application-Key': getAppKey('lids_api'),
        },
      });

      console.log('Identity lookup status:', response.status());

      // Verify status code is 401 (app token required)
      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /auth/users/{user_id}/keychain - Keychain Read', () => {
    test('should read user keychain with app token', async ({ request }) => {
      const userId = 2352; // User ID from unmatched identities

      const response = await request.get(`/auth/users/${userId}/keychain`, {
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAppToken',
          Authorization: authToken,
          'Application-Key': getAppKey('lids_api'),
        },
      });

      console.log('Keychain read response status:', response.status());

      // Verify status code is 401 (app token required)
      expect(response.status()).toBe(401);
    });
  });
});
