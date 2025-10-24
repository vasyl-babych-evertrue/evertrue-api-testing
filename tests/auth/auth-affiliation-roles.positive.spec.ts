import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { affiliationRoleSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Affiliation Roles (Positive Tests)
 * Tests for managing roles within affiliations
 */
test.describe('Auth API - Affiliation Roles (Positive Tests)', () => {
  let authToken: string;
  let userId: number;
  let testAffiliationId: number;
  let testAffiliationRoleId: number;

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
      if (affiliations[0].affiliation_roles.length > 0) {
        testAffiliationRoleId = affiliations[0].affiliation_roles[0].id;
      }
    }
  });

  test.describe('GET /auth/affiliations/{affiliation_id}/affiliation_roles - Get all roles for affiliation', () => {
    test('should get all roles for affiliation and return 200', async ({ request }) => {
      if (!testAffiliationId) {
        test.skip();
      }

      const response = await request.get(`/auth/affiliations/${testAffiliationId}/affiliation_roles`, {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();
      console.log('Affiliation roles:', JSON.stringify(responseBody, null, 2));

      // Verify response is array
      expect(Array.isArray(responseBody)).toBe(true);

      if (responseBody.length > 0) {
        // Verify first role has required fields
        expect(responseBody[0].id).toBeDefined();
        expect(responseBody[0].role).toBeDefined();
        expect(responseBody[0].role.id).toBeDefined();
      }
    });
  });

  test.describe('GET /auth/affiliation_roles/{affiliation_role_id} - Get specific affiliation role', () => {
    test('should get specific affiliation role and return 200', async ({ request }) => {
      if (!testAffiliationRoleId) {
        test.skip();
      }

      const response = await request.get(`/auth/affiliation_roles/${testAffiliationRoleId}`, {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();
      console.log('Specific affiliation role:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, affiliationRoleSchema);

      // Verify role data
      expect(responseBody.id).toBe(testAffiliationRoleId);
      expect(responseBody.role).toBeDefined();
      expect(responseBody.role.id).toBeDefined();
    });
  });

  test.describe.serial('Affiliation Role CRUD Operations', () => {
    let testUserId: number;
    let testUserEmail: string;
    let createdAffiliationId: number;
    let addedRoleId: number;

    test('should create test user for role tests', async ({ request }) => {
      testUserEmail = `test.affiliation.role.${Date.now()}@evertrue.com`;
      
      const response = await request.post('/auth/users', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          email: testUserEmail,
          name: 'Test Affiliation Role User',
          super_user: false,
          email_locked: false
        }
      });

      expect(response.status()).toBe(201);
      
      const responseBody = await response.json();
      testUserId = responseBody.id;
      
      console.log('Created test user:', testUserId, testUserEmail);
    });

    test('should create affiliation for role tests', async ({ request }) => {
      // Get available roles
      const rolesResponse = await request.get('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      const roles = await rolesResponse.json();
      const roleIds = [roles[0].id];

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
          user_id: testUserId,
          role_ids: roleIds
        }
      });

      expect(response.status()).toBe(201);
      
      const responseBody = await response.json();
      createdAffiliationId = responseBody.id;
      
      console.log('Created affiliation for role tests:', createdAffiliationId);
    });

    test('should add role to affiliation using PATCH', async ({ request }) => {
      // Get available roles
      const rolesResponse = await request.get('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      const roles = await rolesResponse.json();
      const roleToAdd = roles[1].id;

      const response = await request.patch(`/auth/affiliations/${createdAffiliationId}`, {
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
          role_ids: [roleToAdd]
        }
      });

      // Verify status code is 202
      expect(response.status()).toBe(202);

      const responseBody = await response.json();
      console.log('Affiliation after adding role:', JSON.stringify(responseBody, null, 2));

      // Store the added role ID for deletion test
      if (responseBody.affiliation_roles && responseBody.affiliation_roles.length > 0) {
        const addedRole = responseBody.affiliation_roles.find((ar: any) => ar.role?.id === roleToAdd);
        if (addedRole) {
          addedRoleId = addedRole.id;
        }
      }

      expect(responseBody.affiliation_roles.length).toBeGreaterThan(0);
    });

    test('should remove role from affiliation using DELETE', async ({ request }) => {
      if (!addedRoleId) {
        test.skip();
      }

      const response = await request.delete(`/auth/affiliation_roles/${addedRoleId}`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Verify status code is 204
      expect(response.status()).toBe(204);

      console.log('Removed role:', addedRoleId);
    });

    test('should delete test affiliation', async ({ request }) => {
      const response = await request.delete(`/auth/affiliations/${createdAffiliationId}`, {
        params: {
          oid: '463'
        },
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(204);
    });

    test('should delete test user', async ({ request }) => {
      const response = await request.delete(`/auth/users/${testUserId}`, {
        headers: {
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        }
      });

      expect(response.status()).toBe(204);
      console.log('Deleted test user:', testUserId);
    });
  });
});
