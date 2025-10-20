import { test, expect } from '@playwright/test';
import { config, getAppKey, getAppToken } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { userSchema, userByIdSchema, userByContactIdSchema, userSearchSchema, bulkFetchUsersSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Users Management (Positive Tests)
 * Based on documentation: Users endpoints
 * 
 * Test Users:
 * - Super Admin: vasyl.babych@evertrue.com (for admin endpoints)
 * - Regular User: vasyl.babych+3@swanteams.com (for regular user tests)
 * - Test User: 021e981a-b23a-41dc-99b6-c2bbb200d43b@mailslurp.xyz (for basic tests)
 */
test.describe('Auth API - Users Management (Positive Tests)', () => {
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

  test.describe('GET /auth/users/me - Get logged in user', () => {
    test('should get current user with valid token and return 200', async ({ request }) => {
      const response = await request.get('/auth/users/me', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      })

      const responseBody = await response.json();
      console.log('All roles:', JSON.stringify(responseBody, null, 2));


      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      //const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, userSchema);

      // Verify user has required fields
      expect(responseBody.id).toBeDefined();
      expect(responseBody.email).toBeDefined();
      expect(responseBody.name).toBeDefined();
      expect(responseBody.email).toBe('vasyl.babych@evertrue.com');
    });
  });

  test.describe('GET /auth/users/{id} - Get user by ID', () => {
    test('should get user by ID with valid token and return 200', async ({ request }) => {
      const userId = 2308; // Known user ID from the environment
      
      const response = await request.get(`/auth/users/${userId}`, {
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

      // Verify response schema
      expectSchema(responseBody, userByIdSchema);

      // Verify user ID matches
      expect(responseBody.id).toBe(userId);
    });
  });

  test.describe('GET /auth/users/email/{email} - Get user by email', () => {
    test('should get user by email with valid token and return 200', async ({ request }) => {
      const userEmail = 'vasyl.babych@evertrue.com'; // Known email from environment
      
      const response = await request.get(`/auth/users/email/${encodeURIComponent(userEmail)}`, {
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

      // Verify response schema
      expectSchema(responseBody, userSchema);

      // Verify user email matches
      expect(responseBody.email).toBe(userEmail);
    });
  });

  test.describe('POST /auth/users/search - Search users', () => {
    test('should search users with basic query and return 200', async ({ request }) => {
      const response = await request.post('/auth/users/search', {
        params: {
          app_key: getAppKey('console'),
          auth: authToken
        },
        data: {
          q: 'vasyl'
        }
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, userSearchSchema);

      // Verify search results structure
      expect(responseBody.total).toBeGreaterThanOrEqual(0);
      expect(responseBody.users).toBeDefined();
      expect(Array.isArray(responseBody.users)).toBe(true);
    });

    test('should search users with email query and return 200', async ({ request }) => {
      const searchEmail = 'platform+auth_api@evertrue.com'; // Use an email we know exists
      
      const response = await request.post('/auth/users/search', {
        params: {
          app_key: getAppKey('console'),
          auth: authToken
        },
        data: {
          email: searchEmail
        }
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, userSearchSchema);

      // Should find at least one user
      expect(responseBody.total).toBeGreaterThan(0);
      if (responseBody.users.length > 0) {
        // Verify that the search actually worked by checking if any user has the searched email
        const foundUser = responseBody.users.find(user => user.email === searchEmail);
        expect(foundUser).toBeDefined();
        expect(foundUser.email).toBe(searchEmail);
      }
    });
  });

  test.describe('GET /auth/users/id/{user_id} - Get user by ID (super-user version)', () => {
    test('should get full user by ID with super-user token', async ({ request }) => {
      const userId = 2308; // Known user ID
      
      const response = await request.get(`/auth/users/id/${userId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        }
      });

      // Should return 200 with super-admin privileges
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();

      expectSchema(responseBody, userSchema);
      expect(responseBody.id).toBe(userId);
    });
  });

  test.describe('GET /auth/users/contact_id/{contact_id} - Get user by contact ID', () => {
    test('should get user by contact ID with oid filter', async ({ request }) => {
      const contactId = 14623853; // Use existing contact ID that should return 200
      const oid = 463;
      
      const response = await request.get(`/auth/users/contact_id/${contactId}`, {
        params: {
          oid: oid
        },
        headers: {
          'Accept': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        }
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();

      expectSchema(responseBody, userByContactIdSchema);
    });
  });

  test.describe('GET /auth/users?role={role_id}&oid={oid} - List users by role', () => {
    test('should get users by role with organization context', async ({ request }) => {
      const roleId = 1619; // Use existing role ID that should return 200
      const oid = 463;
      
      const response = await request.get('/auth/users', {
        params: {
          role: roleId,
          oid: oid
        },
        headers: {
          'Accept': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        }
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });

  test.describe('POST /auth/users/bulk_fetch - Bulk fetch users', () => {
    test('should bulk fetch users by IDs with oid', async ({ request }) => {
      const oid = 463;
      
      const response = await request.post('/auth/users/bulk_fetch', {
        params: {
          oid: oid
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          id: [2308],
          name_or_email: 'vasyl'
        }
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();

      expectSchema(responseBody, bulkFetchUsersSchema);
      expect(responseBody.users).toBeDefined();
      expect(Array.isArray(responseBody.users)).toBe(true);
      expect(responseBody.meta).toBeDefined();
      expect(responseBody.meta.total).toBeDefined();
    });
  });

  test.describe.serial('User CRUD Operations (super-admin endpoints)', () => {
    let createdUserId: number;
    let createdUserEmail: string;

    test('should create user with super-admin privileges (CREATE)', async ({ request }) => {
      // Using super-admin credentials to create a test user
      createdUserEmail = `test.user.${Date.now()}@evertrue.com`;
      
      const response = await request.post('/auth/users', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          email: createdUserEmail,
          name: 'Test User CRUD',
          super_user: false,
          email_locked: false,
          affiliations: [
            {
              organization_id: 463,
              contact_id: null,
              role_ids: [1619]
            }
          ]
        }
      });

      expect(response.status()).toBe(201);
      
      const responseBody = await response.json();
      // Store created user ID for subsequent tests
      createdUserId = responseBody.id;
      
      expectSchema(responseBody, userSchema);
      expect(responseBody.email).toBe(createdUserEmail);
      expect(responseBody.name).toBe('Test User CRUD');
      expect(responseBody.super_user).toBe(false);
    });

    test('should update created user with super-admin privileges (UPDATE)', async ({ request }) => {
      // Using super-admin credentials to update the created user
      const response = await request.put(`/auth/users/${createdUserId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          name: 'Updated Test User CRUD'
        }
      });

      expect(response.status()).toBe(202);
      
      const responseBody = await response.json();

      expectSchema(responseBody, userSchema);
      expect(responseBody.name).toBe('Updated Test User CRUD');
      expect(responseBody.id).toBe(createdUserId);
      expect(responseBody.email).toBe(createdUserEmail);
    });

    test('should delete created user with super-admin privileges (DELETE)', async ({ request }) => {
      // Using super-admin credentials to delete the created user
      const response = await request.delete(`/auth/users/${createdUserId}`, {
        headers: {
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        }
      });

      expect(response.status()).toBe(204);
    });
  });
});
