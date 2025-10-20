import { test, expect } from '@playwright/test';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  affiliationsArraySchema,
  affiliationSchema
} from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Affiliations Management (Positive Tests)
 * Tests for managing user affiliations and roles
 */
test.describe('Auth API - Affiliations (Positive Tests)', () => {
  let authToken: string;
  let userId: number;
  let testAffiliationId: number;

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin user for admin endpoints
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

  test.describe('GET /auth/users/{user_id}/affiliations - Get user affiliations', () => {
    test('should get user affiliations with valid token and return 200', async ({ request }) => {
      const response = await request.get(`/auth/users/${userId}/affiliations`, {
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
      console.log('User affiliations:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, affiliationsArraySchema);

      // Verify array structure
      expect(Array.isArray(responseBody)).toBe(true);
      
      if (responseBody.length > 0) {
        // Store first affiliation for later tests
        testAffiliationId = responseBody[0].id;
        
        // Verify affiliation has required fields
        expect(responseBody[0].id).toBeDefined();
        expect(responseBody[0].organization_id).toBeDefined();
        expect(responseBody[0].organization).toBeDefined();
        expect(responseBody[0].affiliation_roles).toBeDefined();
        expect(Array.isArray(responseBody[0].affiliation_roles)).toBe(true);
      }
    });
  });

  test.describe.serial('Affiliation CRUD Operations (admin endpoints)', () => {
    let testUserId: number;
    let testUserEmail: string;
    let createdAffiliationId: number;

    test('should create test user for affiliation tests', async ({ request }) => {
      testUserEmail = `test.affiliation.${Date.now()}@evertrue.com`;
      
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
          name: 'Test Affiliation User',
          super_user: false,
          email_locked: false
        }
      });

      expect(response.status()).toBe(201);
      
      const responseBody = await response.json();
      testUserId = responseBody.id;
      
      console.log('Created test user:', testUserId, testUserEmail);
    });

    test('should create new affiliation with valid data and return 201', async ({ request }) => {
      // Get available roles first
      const rolesResponse = await request.get('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      const roles = await rolesResponse.json();
      const roleIds = roles.slice(0, 2).map((role: any) => role.id);

      const newAffiliationData = {
        user_id: testUserId,
        role_ids: roleIds
      };

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
        data: newAffiliationData
      });

      // Verify status code is 201
      expect(response.status()).toBe(201);

      // Parse response body
      const responseBody = await response.json();
      console.log('Created affiliation:', JSON.stringify(responseBody, null, 2));

      // Store created affiliation ID
      createdAffiliationId = responseBody.id;

      // Verify response schema
      expectSchema(responseBody, affiliationSchema);

      // Verify created affiliation data
      expect(responseBody.id).toBeDefined();
      expect(responseBody.affiliation_roles).toBeDefined();
      expect(Array.isArray(responseBody.affiliation_roles)).toBe(true);
      expect(responseBody.affiliation_roles.length).toBeGreaterThan(0);
    });

    test('should update affiliation roles', async ({ request }) => {
      // Get available roles
      const rolesResponse = await request.get('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      const roles = await rolesResponse.json();
      const newRoleIds = roles.slice(0, 1).map((role: any) => role.id);

      const updateData = {
        role_ids: newRoleIds
      };

      const response = await request.put(`/auth/affiliations/${createdAffiliationId}`, {
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
        data: updateData
      });

      // Verify status code is 202
      expect(response.status()).toBe(202);

      // Parse response body
      const responseBody = await response.json();
      console.log('Updated affiliation:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, affiliationSchema);

      // Verify affiliation was updated
      expect(responseBody.id).toBe(createdAffiliationId);
      expect(responseBody.affiliation_roles).toBeDefined();
    });

    test('should add role to affiliation', async ({ request }) => {
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

      const patchData = {
        role_ids: [roleToAdd]
      };

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
        data: patchData
      });

      // Verify status code is 202
      expect(response.status()).toBe(202);

      // Parse response body
      const responseBody = await response.json();
      console.log('Affiliation after adding role:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, affiliationSchema);

      // Verify role was added
      expect(responseBody.id).toBe(createdAffiliationId);
      expect(responseBody.affiliation_roles.length).toBeGreaterThan(0);
    });

    test('should get all roles for affiliation', async ({ request }) => {
      const response = await request.get(`/auth/affiliations/${createdAffiliationId}/affiliation_roles`, {
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

    test('should delete created affiliation', async ({ request }) => {
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

      // Verify status code is 204
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
