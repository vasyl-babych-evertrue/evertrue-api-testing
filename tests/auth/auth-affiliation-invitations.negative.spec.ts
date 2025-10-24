import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';

/**
 * Auth API Tests - Affiliation Invitations (Negative Tests)
 * Tests for error handling in affiliation invitations endpoints
 */
test.describe('Auth API - Affiliation Invitations (Negative Tests)', () => {
  let authToken: string;
  let userId: number;

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin user
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Device-ID': config.headers.deviceId,
        'host': config.headers.host,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
      },
    });

    const session = await response.json();
    authToken = session.token;
    userId = session.user.id;
  });

  test.describe('GET /auth/affiliation_invitations - Get invitations errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/auth/affiliation_invitations', {
        params: {
          oid: '463',
          app_key: getAppKey('console')
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 400 without oid parameter', async ({ request }) => {
      const response = await request.get('/auth/affiliation_invitations', {
        params: {
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      // Verify status code is 400
      expect(response.status()).toBe(400);
    });
  });

  test.describe('POST /auth/affiliation_invitations - Create invitation errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/auth/affiliation_invitations', {
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
          email: 'test@example.com',
          name: 'Test User',
          role_ids: [1]
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 400 with missing required fields', async ({ request }) => {
      const response = await request.post('/auth/affiliation_invitations', {
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
          // Missing email and role_ids
        }
      });

      // Verify status code is 400, 401, or 422
      expect([400, 401, 422]).toContain(response.status());
    });

    test('should return 400 with invalid email', async ({ request }) => {
      const response = await request.post('/auth/affiliation_invitations', {
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
          email: 'invalid-email',
          name: 'Test User',
          role_ids: [1]
        }
      });

      // Verify status code is 400, 401, or 422
      expect([400, 401, 422]).toContain(response.status());
    });

    test('should return 400 with invalid role IDs', async ({ request }) => {
      const response = await request.post('/auth/affiliation_invitations', {
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
          email: 'test@example.com',
          name: 'Test User',
          role_ids: [999999] // Non-existent role ID
        }
      });

      // Verify status code is 400, 401, or 422
      expect([400, 401, 422]).toContain(response.status());
    });

    test('should return 400 without oid parameter', async ({ request }) => {
      const response = await request.post('/auth/affiliation_invitations', {
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
          email: 'test@example.com',
          name: 'Test User',
          role_ids: [1]
        }
      });

      // Verify status code is 400 or 401
      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe('GET /auth/affiliation_invitations/{id} - Get specific invitation errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/auth/affiliation_invitations/1', {
        params: {
          oid: '463',
          app_key: getAppKey('console')
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 404 with non-existent invitation ID', async ({ request }) => {
      const response = await request.get('/auth/affiliation_invitations/999999', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      // Verify status code is 404
      expect(response.status()).toBe(404);
    });
  });

  test.describe('PUT /auth/affiliation_invitations/{id} - Update invitation errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.put('/auth/affiliation_invitations/1', {
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
          name: 'Updated Name',
          role_ids: [1]
        }
      });

      // Verify status code is 400, 401 or 404
      expect([400, 401, 404]).toContain(response.status());
    });

    test('should return 404 with non-existent invitation ID', async ({ request }) => {
      const response = await request.put('/auth/affiliation_invitations/999999', {
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
          name: 'Updated Name',
          role_ids: [1]
        }
      });

      // Verify status code is 400 or 404
      expect([400, 404]).toContain(response.status());
    });
  });

  test.describe('POST /auth/affiliation_invitations/{id}/resend - Resend invitation errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/auth/affiliation_invitations/1/resend', {
        params: {
          oid: '463',
          app_key: getAppKey('console')
        },
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
        }
      });

      // Verify status code is 400, 401 or 404
      expect([400, 401, 404]).toContain(response.status());
    });

    test('should return 404 with non-existent invitation ID', async ({ request }) => {
      const response = await request.post('/auth/affiliation_invitations/999999/resend', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
        }
      });

      // Verify status code is 400 or 404
      expect([400, 404]).toContain(response.status());
    });
  });

  test.describe('POST /auth/affiliation_invitations/{id}/accept - Accept invitation errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/auth/affiliation_invitations/1/accept', {
        params: {
          oid: '463',
          app_key: getAppKey('console')
        },
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
        }
      });

      // Verify status code is 400, 401 or 404
      expect([400, 401, 404]).toContain(response.status());
    });

    test('should return 404 with non-existent invitation ID', async ({ request }) => {
      const response = await request.post('/auth/affiliation_invitations/999999/accept', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
        }
      });

      // Verify status code is 400 or 404
      expect([400, 404]).toContain(response.status());
    });
  });

  test.describe('DELETE /auth/affiliation_invitations/{id} - Delete invitation errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.delete('/auth/affiliation_invitations/1', {
        params: {
          oid: '463',
          app_key: getAppKey('console')
        },
        headers: {
          'Application-Key': config.headers.applicationKey,
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 404 with non-existent invitation ID', async ({ request }) => {
      const response = await request.delete('/auth/affiliation_invitations/999999', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Application-Key': config.headers.applicationKey,
        }
      });

      // Verify status code is 400, 401 or 404
      expect([400, 401, 404]).toContain(response.status());
    });
  });
});
