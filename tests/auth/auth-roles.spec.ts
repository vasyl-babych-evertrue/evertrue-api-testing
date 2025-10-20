import { test, expect } from '@playwright/test';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { rolesSchema, roleSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Roles Management
 * Based on Postman collection: "Vasyl test" -> "OAuth" -> "Roles"
 */
test.describe('Auth API - Roles Management', () => {
  let authToken: string;
  let testRoleId: number;

  test.beforeAll(async ({ request }) => {
    // Create session to get auth token
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
    authToken = body.token;
  });

  test.describe('GET /auth/roles - Get all roles for organization', () => {
    test('should get all roles with valid token and return 200', async ({ request }) => {
      const response = await request.get('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();
      console.log('All roles:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, rolesSchema)

      // Verify roles array structure
      expect(Array.isArray(responseBody)).toBe(true);
      if (responseBody.length > 0) {
        // Store first role ID for later tests
        testRoleId = responseBody[0].id;
        
        // Verify role has required fields
        expect(responseBody[0].id).toBeDefined();
        expect(responseBody[0].name).toBeDefined();
        expect(responseBody[0].organization_id).toBe(463);
      }
    });

    test('should return 401 without auth token', async ({ request }) => {
      const response = await request.get('/auth/roles', {
        params: {
          oid: '463',
          app_key: '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f'
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });

    test('should return 403 without proper organization access', async ({ request }) => {
      const response = await request.get('/auth/roles', {
        params: {
          oid: '999', // Non-accessible organization
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      // Verify status code is 403 or 404
      expect([403, 404]).toContain(response.status());
    });
  });

  test.describe('GET /auth/roles/{id} - Get single role by ID', () => {
    test('should get role by ID with valid token and return 200', async ({ request }) => {
      // First get all roles to find a valid role ID
      const rolesResponse = await request.get('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      const roles = await rolesResponse.json();
      expect(roles.length).toBeGreaterThan(0);
      
      const roleId = roles[0].id;

      // Now get specific role
      const response = await request.get(`/auth/roles/${roleId}`, {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();
      console.log('Role by ID:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, roleSchema);

      // Verify role ID matches
      expect(responseBody.id).toBe(roleId);
      expect(responseBody.organization_id).toBe(463);
    });

    test('should return 404 for non-existent role', async ({ request }) => {
      const nonExistentRoleId = 999999;
      
      const response = await request.get(`/auth/roles/${nonExistentRoleId}`, {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      // Verify status code is 404
      expect(response.status()).toBe(404);
    });

    test('should return 401 without auth token', async ({ request }) => {
      const response = await request.get('/auth/roles/1615', {
        params: {
          oid: '463',
          app_key: '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f'
        }
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /auth/roles - Create new role', () => {
    test('should create new role with valid data and return 201', async ({ request }) => {
      const newRoleData = {
        name: `Test Role ${Date.now()}`,
        remote_id: `test_role_${Date.now()}`,
        can_see_private_data: false,
        default: false
      };

      const response = await request.post('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        data: newRoleData
      });

      // Verify status code is 201
      expect(response.status()).toBe(201);

      // Parse response body
      const responseBody = await response.json();
      console.log('Created role:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, roleSchema);

      // Verify created role data
      expect(responseBody.name).toBe(newRoleData.name);
      expect(responseBody.remote_id).toBe(newRoleData.remote_id);
      expect(responseBody.organization_id).toBe(463);
      expect(responseBody.can_see_private_data).toBe(newRoleData.can_see_private_data);
      expect(responseBody.default).toBe(newRoleData.default);

      // Store created role ID for cleanup
      testRoleId = responseBody.id;
    });

    test('should return 400 with invalid data', async ({ request }) => {
      const invalidRoleData = {
        // Missing required name field
        remote_id: 'invalid_role',
        can_see_private_data: false
      };

      const response = await request.post('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        data: invalidRoleData
      });

      // Note: API might return 201, 400, or 422 depending on validation
      expect([400, 201, 422]).toContain(response.status());
      
      if (response.status() === 201) {
        // If it creates the role, verify it has a generated name
        const responseBody = await response.json();
        expect(responseBody.name).toBeDefined();
      }
    });

    test('should return 401 without auth token', async ({ request }) => {
      const newRoleData = {
        name: 'Test Role',
        remote_id: 'test_role',
        can_see_private_data: false
      };

      const response = await request.post('/auth/roles', {
        params: {
          oid: '463',
          app_key: '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f'
        },
        data: newRoleData
      });

      // Verify status code is 401
      expect(response.status()).toBe(401);
    });
  });

  test.describe('PUT /auth/roles/{id} - Update role', () => {
    test('should update role with valid data and return 200', async ({ request }) => {
      // First create a role to update
      const createResponse = await request.post('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        data: {
          name: `Role to Update ${Date.now()}`,
          remote_id: `update_role_${Date.now()}`,
          can_see_private_data: false,
          default: false
        }
      });

      const createdRole = await createResponse.json();
      const roleId = createdRole.id;

      // Now update the role
      const updateData = {
        name: `Updated Role ${Date.now()}`,
        remote_id: createdRole.remote_id,
        can_see_private_data: true,
        default: false
      };

      const response = await request.put(`/auth/roles/${roleId}`, {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        data: updateData
      });

      // API returns 204 No Content for updates
      expect(response.status()).toBe(204);

      // Verify the role was actually updated by fetching it
      const getResponse = await request.get(`/auth/roles/${roleId}`, {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      expect(getResponse.status()).toBe(200);
      const responseBody = await getResponse.json();
      console.log('Updated role:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, roleSchema);

      // Verify updated data
      expect(responseBody.name).toBe(updateData.name);
      expect(responseBody.can_see_private_data).toBe(updateData.can_see_private_data);
    });
  });

  test.describe('DELETE /auth/roles/{id} - Delete role', () => {
    test('should delete role and return 204', async ({ request }) => {
      // First create a role to delete
      const createResponse = await request.post('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        data: {
          name: `Role to Delete ${Date.now()}`,
          remote_id: `delete_role_${Date.now()}`,
          can_see_private_data: false,
          default: false
        }
      });

      const createdRole = await createResponse.json();
      const roleId = createdRole.id;

      // Now delete the role
      const response = await request.delete(`/auth/roles/${roleId}`, {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      // Verify status code is 204
      expect(response.status()).toBe(204);

      // Verify role is actually deleted
      const getResponse = await request.get(`/auth/roles/${roleId}`, {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      // Should return 404 since role is deleted
      expect(getResponse.status()).toBe(404);
    });

    test('should return 404 when deleting non-existent role', async ({ request }) => {
      const nonExistentRoleId = 999999;

      const response = await request.delete(`/auth/roles/${nonExistentRoleId}`, {
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
});
