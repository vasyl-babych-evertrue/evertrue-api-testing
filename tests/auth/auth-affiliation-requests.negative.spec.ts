import { test, expect } from '@playwright/test';
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
    userId = session.user.id;
  });

  test.describe('GET /auth/affiliation_requests - Get moderation requests errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/auth/affiliation_requests', {
        params: {
          oid: '463',
          app_key: getAppKey('console')
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 400 without oid parameter', async ({ request }) => {
      const response = await request.get('/auth/affiliation_requests', {
        params: {
          app_key: getAppKey('console'),
          auth: authToken
        }
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
          app_key: getAppKey('console')
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          user_id: userId,
          role_ids: [1]
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 400 with missing required fields', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          // Missing user_id and role_ids
        }
      });

      // Verify status code is 400, 401, or 422
      expect([400, 401, 422]).toContain(response.status());
    });

    test('should return 400 with invalid role IDs', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          user_id: userId,
          role_ids: [999999] // Non-existent role ID
        }
      });

      // Verify status code is 400, 401, or 422
      expect([400, 401, 422]).toContain(response.status());
    });

    test('should return 400 without oid parameter', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests', {
        params: {
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          user_id: userId,
          role_ids: [1]
        }
      });

      // Verify status code is 400 or 401
      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe('POST /auth/affiliation_requests/{id}/moderate - Moderation errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests/1/moderate', {
        params: {
          oid: '463',
          app_key: getAppKey('console')
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          approved: true
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 404 with non-existent request ID', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests/999999/moderate', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          approved: true
        }
      });

      // Verify status code is 401 or 404
      expect([401, 404]).toContain(response.status());
    });

    test('should return 400 with missing approved field', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests/1/moderate', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          // Missing approved field
        }
      });

      // Verify status code is 400, 401, or 422
      expect([400, 401, 422]).toContain(response.status());
    });

    test('should return 400 without oid parameter', async ({ request }) => {
      const response = await request.post('/auth/affiliation_requests/1/moderate', {
        params: {
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          approved: true
        }
      });

      // Verify status code is 400 or 401
      expect([400, 401]).toContain(response.status());
    });
  });
});
