import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey, getAppToken } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { userSchema, userSearchSchema, bulkFetchUsersSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Users Management (Negative Tests)
 * Based on documentation: Users endpoints
 * 
 * Test Users:
 * - Super Admin: vasyl.babych@evertrue.com (for admin endpoints)
 * - Regular User: vasyl.babych+3@swanteams.com (for regular user tests)
 * - Test User: 021e981a-b23a-41dc-99b6-c2bbb200d43b@mailslurp.xyz (for basic tests)
 */
test.describe('Auth API - Users Management (Negative Tests)', () => {
  let authToken: string;
  let regularUserToken: string;

  test.beforeAll(async ({ request }) => {
    // Create session with working credentials (Super Admin)
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.basicToken}`,
      },
    });

    const body = await response.json();
    authToken = body.token;

    // Create session with regular user credentials
    const regularResponse = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.regularUserToken}`,
      },
    });

    const regularBody = await regularResponse.json();
    regularUserToken = regularBody.token;
  });

  test.describe('GET /auth/users/me - Get logged in user (Error Cases)', () => {
    test('should return 401 without auth token', async ({ request }) => {
      const response = await request.get('/auth/users/me', {
        params: {
          oid: '463',
          app_key: '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f'
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /auth/users/{id} - Get user by ID (Error Cases)', () => {
    test('should return 404 for non-existent user', async ({ request }) => {
      const nonExistentUserId = 999999;
      
      const response = await request.get(`/auth/users/${nonExistentUserId}`, {
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

  test.describe('GET /auth/users/email/{email} - Get user by email (Error Cases)', () => {
    test('should return 404 for non-existent email', async ({ request }) => {
      const nonExistentEmail = 'nonexistent@example.com';
      
      const response = await request.get(`/auth/users/email/${encodeURIComponent(nonExistentEmail)}`, {
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

  test.describe('POST /auth/users/search - Search users (Error Cases)', () => {
    test('should return 401 without auth token', async ({ request }) => {
      const response = await request.post('/auth/users/search', {
        params: {
          app_key: '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f'
        },
        data: {
          q: 'test'
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /auth/users/id/{user_id} - Get user by ID (super-user version) (Error Cases)', () => {
    test('should return 401 without auth token', async ({ request }) => {
      const userId = 2308;
      
      const response = await request.get(`/auth/users/id/${userId}`);

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /auth/users/contact_id/{contact_id} - Get user by contact ID (Error Cases)', () => {
    test('should return 422 without oid parameter', async ({ request }) => {
      const contactId = 12345;
      
      const response = await request.get(`/auth/users/contact_id/${contactId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        }
      });

      expect([400, 422]).toContain(response.status());
    });
  });

  test.describe('GET /auth/users?role={role_id}&oid={oid} - List users by role (Error Cases)', () => {
    test('should return 403 without admin privileges', async ({ request }) => {
      const roleId = 838;
      const oid = 463;
      
      const response = await request.get('/auth/users', {
        params: {
          role: roleId,
          oid: oid
        },
        headers: {
          'Accept': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': 'invalid_token',
          'Application-Key': getAppKey('console'),
        }
      });

      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('POST /auth/users/bulk_fetch - Bulk fetch users (Error Cases)', () => {
    test('should return 422 without oid parameter', async ({ request }) => {
      const response = await request.post('/auth/users/bulk_fetch', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          id: [2308]
        }
      });

      expect([400, 422]).toContain(response.status());
    });
  });

  test.describe('User Operations - Permission Tests (Error Cases)', () => {
    test('should return 403 when creating user without super-admin privileges', async ({ request }) => {
      const response = await request.post('/auth/users', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': regularUserToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          email: 'test.user@example.com',
          name: 'Test User'
        }
      });

      expect([401, 403]).toContain(response.status());
    });

    test('should return 403 when updating user without super-admin privileges', async ({ request }) => {
      const userId = 2308;
      
      const response = await request.put(`/auth/users/${userId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': regularUserToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          name: 'Updated Test Name'
        }
      });

      expect([401, 403]).toContain(response.status());
    });

    test('should return 403 when deleting user without super-admin privileges', async ({ request }) => {
      const userId = 999999;
      
      const response = await request.delete(`/auth/users/${userId}`, {
        headers: {
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': regularUserToken,
          'Application-Key': getAppKey('console'),
        }
      });

      expect([401, 403]).toContain(response.status());
    });
  });
});
