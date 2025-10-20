import { test, expect } from '@playwright/test';
import { config, getAppKey } from '../../config/env.config';

/**
 * Auth API Tests - Affiliation Roles (Negative Tests)
 * Tests for error handling in affiliation roles endpoints
 */
test.describe('Auth API - Affiliation Roles (Negative Tests)', () => {
  let authToken: string;
  let testAffiliationId: number;

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin user
    const superAdminAuth = Buffer.from('vasyl.babych@evertrue.com:p0o9P)O(p0o9P)O(').toString('base64');
    
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Device-ID': config.headers.deviceId,
        'host': config.headers.host,
        'Authorization': `Basic ${superAdminAuth}`,
      },
    });

    const session = await response.json();
    authToken = session.token;

    // Get user affiliations to have test data
    const affiliationsResponse = await request.get(`/auth/users/${session.user.id}/affiliations`, {
      headers: {
        'Accept': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
      },
    });

    const affiliations = await affiliationsResponse.json();
    if (affiliations.length > 0) {
      testAffiliationId = affiliations[0].id;
    }
  });

  test.describe('GET /auth/affiliations/{affiliation_id}/affiliation_roles - Get roles errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get(`/auth/affiliations/${testAffiliationId}/affiliation_roles`, {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 404 with non-existent affiliation ID', async ({ request }) => {
      const response = await request.get('/auth/affiliations/999999/affiliation_roles', {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Verify status code is 404
      expect(response.status()).toBe(404);
    });
  });

  test.describe('GET /auth/affiliation_roles/{affiliation_role_id} - Get specific role errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/auth/affiliation_roles/1', {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 404 with non-existent affiliation role ID', async ({ request }) => {
      const response = await request.get('/auth/affiliation_roles/999999', {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Verify status code is 404
      expect(response.status()).toBe(404);
    });
  });

  test.describe('DELETE /auth/affiliation_roles/{affiliation_role_id} - Remove role errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.delete('/auth/affiliation_roles/1', {
        headers: {
          'Application-Key': config.headers.applicationKey,
        },
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 404 with non-existent affiliation role ID', async ({ request }) => {
      const response = await request.delete('/auth/affiliation_roles/999999', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Verify status code is 404
      expect(response.status()).toBe(404);
    });
  });
});
