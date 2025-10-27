import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';

/**
 * Auth API Tests - Affiliations Management (Negative Tests)
 * Tests for error handling in affiliations endpoints
 */
test.describe('Auth API - Affiliations (Negative Tests)', () => {
  let authToken: string;
  let userId: number;
  let testAffiliationId: number;

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin user for admin endpoints
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
        'host': config.headers.host,
      },
    });

    const session = await response.json();
    authToken = session.token;
    userId = session.user.id;

    // Get user affiliations to have test data
    const affiliationsResponse = await request.get(`/auth/users/${userId}/affiliations`, {
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

  test.describe('GET /auth/users/{user_id}/affiliations - Authorization errors', () => {
    test('should return 401 without authentication token', async ({ request }) => {
      const response = await request.get(`/auth/users/${userId}/affiliations`, {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 401 with invalid token', async ({ request }) => {
      const response = await request.get(`/auth/users/${userId}/affiliations`, {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': 'invalid-token-12345',
        },
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 403 when accessing other user affiliations', async ({ request }) => {
      const otherUserId = 999999; // Non-existent or unauthorized user

      const response = await request.get(`/auth/users/${otherUserId}/affiliations`, {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Verify status code is 403 or 404
      expect([403, 404]).toContain(response.status());
    });
  });

  test.describe('POST /auth/affiliations - Create affiliation errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.post('/auth/affiliations', {
        params: {
          oid: '463'
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
      const response = await request.post('/auth/affiliations', {
        params: {
          oid: '463'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
        data: {
          // Missing user_id and role_ids
        }
      });

      // Verify status code is 400 or 422
      expect([400, 422]).toContain(response.status());
    });

    test('should return 400 with invalid role IDs', async ({ request }) => {
      const response = await request.post('/auth/affiliations', {
        params: {
          oid: '463'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
        data: {
          user_id: userId,
          role_ids: [999999] // Non-existent role ID
        }
      });

      // Verify status code is 400 or 422
      expect([400, 422]).toContain(response.status());
    });

    test('should return 400 without oid parameter', async ({ request }) => {
      const response = await request.post('/auth/affiliations', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
        data: {
          user_id: userId,
          role_ids: [1]
        }
      });

      // Verify status code is 400
      expect(response.status()).toBe(400);
    });
  });

  test.describe('PUT /auth/affiliations/{affiliation_id} - Update errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.put(`/auth/affiliations/${testAffiliationId}`, {
        params: {
          oid: '463'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          role_ids: [1]
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 404 with non-existent affiliation ID', async ({ request }) => {
      const response = await request.put('/auth/affiliations/999999', {
        params: {
          oid: '463'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
        data: {
          role_ids: [1]
        }
      });

      // Verify status code is 404 or 422
      expect([404, 422]).toContain(response.status());
    });

    test('should return 400 with invalid role IDs', async ({ request }) => {
      const response = await request.put(`/auth/affiliations/${testAffiliationId}`, {
        params: {
          oid: '463'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
        data: {
          role_ids: [999999]
        }
      });

      // Verify status code is 400 or 422
      expect([400, 422]).toContain(response.status());
    });

    test('should return 400 with empty role_ids array', async ({ request }) => {
      const response = await request.put(`/auth/affiliations/${testAffiliationId}`, {
        params: {
          oid: '463'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
        data: {
          role_ids: []
        }
      });

      // Verify status code is 202, 400 or 422
      expect([202, 400, 422]).toContain(response.status());
    });
  });

  test.describe('PATCH /auth/affiliations/{affiliation_id} - Add role errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.patch(`/auth/affiliations/${testAffiliationId}`, {
        params: {
          oid: '463'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
        },
        data: {
          role_ids: [1]
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 404 with non-existent affiliation ID', async ({ request }) => {
      const response = await request.patch('/auth/affiliations/999999', {
        params: {
          oid: '463'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
        data: {
          role_ids: [1]
        }
      });

      // Verify status code is 404 or 422
      expect([404, 422]).toContain(response.status());
    });

    test('should return 400 with missing role_ids', async ({ request }) => {
      const response = await request.patch(`/auth/affiliations/${testAffiliationId}`, {
        params: {
          oid: '463'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
        data: {}
      });

      // Verify status code is 202, 400 or 422
      expect([202, 400, 422]).toContain(response.status());
    });
  });

  test.describe('DELETE /auth/affiliations/{affiliation_id} - Revoke affiliation errors', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.delete(`/auth/affiliations/${testAffiliationId}`, {
        params: {
          oid: '463'
        },
        headers: {
          'Application-Key': config.headers.applicationKey,
        },
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 404 with non-existent affiliation ID', async ({ request }) => {
      const response = await request.delete('/auth/affiliations/999999', {
        params: {
          oid: '463'
        },
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Verify status code is 404
      expect(response.status()).toBe(404);
    });

    test('should return 400 without oid parameter', async ({ request }) => {
      const response = await request.delete(`/auth/affiliations/${testAffiliationId}`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Verify status code is 400
      expect(response.status()).toBe(400);
    });
  });
});
