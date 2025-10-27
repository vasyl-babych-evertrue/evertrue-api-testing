import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';

/**
 * Auth API Tests - Affiliation Requests (Negative Tests)
 * Tests for error handling in affiliation requests endpoints
 */
test.describe('Auth API - Affiliation Requests (Negative Tests)', () => {
  let authToken: string;
  let userId: number;

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin user
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        Authorization: `Basic ${config.auth.superAdminToken}`,
        host: config.headers.host,
      },
    });

    const session = await response.json();
    authToken = session.token;
    userId = session.user.id;
  });

  test.describe('GET /auth/affiliation_requests - Get moderation requests errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/auth/affiliation_requests', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
        },
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 400 without oid parameter', async ({ request }) => {
      const response = await request.get('/auth/affiliation_requests', {
        params: {
          app_key: getAppKey('console'),
          auth: authToken,
        },
      });

      // Verify status code is 400
      expect(response.status()).toBe(400);
    });
  });

  test.describe('POST /auth/affiliation_requests - Request access errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          user_id: userId,
          role_ids: [1],
        },
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 401 with missing required fields (ambiguous app key)', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken,
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          // Missing user_id and role_ids
        },
      });

      // Verify status code is 401 (ambiguous application key)
      expect(response.status()).toBe(401);
    });

    test('should return 401 with invalid role IDs (ambiguous app key)', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken,
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          user_id: userId,
          role_ids: [999999], // Non-existent role ID
        },
      });

      // Verify status code is 401 (ambiguous application key)
      expect(response.status()).toBe(401);
    });

    test('should return 401 without oid parameter (ambiguous app key)', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests', {
        params: {
          app_key: getAppKey('console'),
          auth: authToken,
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          user_id: userId,
          role_ids: [1],
        },
      });

      // Verify status code is 401 (ambiguous application key)
      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /auth/affiliation_requests/{id}/moderate - Moderation errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests/1/moderate', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          approved: true,
        },
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 401 with non-existent request ID (ambiguous app key)', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests/999999/moderate', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken,
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          approved: true,
        },
      });

      // Verify status code is 401 (ambiguous application key)
      expect(response.status()).toBe(401);
    });

    test('should return 401 with missing approved field (ambiguous app key)', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests/1/moderate', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken,
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          // Missing approved field
        },
      });

      // Verify status code is 401 (ambiguous application key)
      expect(response.status()).toBe(401);
    });

    test('should return 401 without oid parameter (ambiguous app key)', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests/1/moderate', {
        params: {
          app_key: getAppKey('console'),
          auth: authToken,
        },
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          approved: true,
        },
      });

      // Verify status code is 401 (ambiguous application key)
      expect(response.status()).toBe(401);
    });
  });
});
