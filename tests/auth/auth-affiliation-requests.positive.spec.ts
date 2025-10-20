import { test, expect } from '@playwright/test';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { affiliationRequestSchema, affiliationRequestsArraySchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Affiliation Requests (Positive Tests)
 * Tests for affiliation request moderation and management
 */
test.describe('Auth API - Affiliation Requests (Positive Tests)', () => {
  let authToken: string;
  let userId: number;

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin user for moderation endpoints
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

  test.describe('GET /auth/affiliation_requests - Get moderation requests (for admins)', () => {
    test('should get moderation requests with admin privileges and return 200', async ({ request }) => {
      const response = await request.get('/auth/affiliation_requests', {
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
      console.log('Affiliation requests:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, affiliationRequestsArraySchema);

      // Verify array structure
      expect(Array.isArray(responseBody)).toBe(true);

      if (responseBody.length > 0) {
        // Verify first request has required fields
        expect(responseBody[0].id).toBeDefined();
        expect(responseBody[0].status).toBeDefined();
        expect(['PENDING', 'APPROVED', 'DENIED']).toContain(responseBody[0].status);
        expect(responseBody[0].organization).toBeDefined();
      }
    });
  });

  test.describe.serial('Affiliation Request Flow (full user registration)', () => {
    let invitationEmail: string;
    let confirmationToken: string;
    let newUserId: number;
    let newUserToken: string;
    let affiliationRequestId: number;

    test('should create affiliation invitation for org 464', async ({ request }) => {
      invitationEmail = `test.registration.${Date.now()}@evertrue.com`;
      
      // First, get available roles for org 464
      const rolesResponse = await request.get('/auth/roles', {
        params: {
          oid: '464',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });
      
      const roles = await rolesResponse.json();
      console.log('Available roles for org 464:', JSON.stringify(roles, null, 2));
      
      // Find GivingTree User role for givingtree app
      const givingTreeRole = roles.find((role: any) => role.remote_id === 'GivingTree User');
      const roleIds = givingTreeRole ? [givingTreeRole.id] : (roles.length > 0 ? [roles[0].id] : []);
      
      // Create invitation for org 464 (NOT 463)
      const response = await request.post('/auth/affiliation_invitations', {
        params: {
          oid: '464',  // Different organization
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        },
        data: {
          name: `Test User ${Date.now()}`,
          email: invitationEmail,
          contact_id: null,
          app: 'givingtree',
          role_ids: roleIds
        }
      });

      console.log('Invitation response status:', response.status());
      const responseBody = await response.json();
      console.log('Invitation created for org 464:', JSON.stringify(responseBody, null, 2));

      expect(response.status()).toBe(200);
      expect(responseBody.email).toBe(invitationEmail);
    });

    test('should receive confirmation token (internal testing endpoint)', async ({ request }) => {
      // This is a special testing endpoint that returns user data including confirmation_token
      const response = await request.get('/auth/internal_testing/user_data', {
        params: {
          oid: '464',  // Use org 464 where invitation was created
          app_key: getAppKey('console'),
          auth: authToken,
          email: invitationEmail
        }
      });

      console.log('User data response status:', response.status());
      const responseBody = await response.json();
      console.log('User data:', JSON.stringify(responseBody, null, 2));

      expect(response.status()).toBe(200);
      expect(responseBody.confirmation_token).toBeDefined();
      
      confirmationToken = responseBody.confirmation_token;
    });

    test('should request confirmation instructions', async ({ request }) => {
      const response = await request.post('/auth/registrations/confirmation', {
        params: {
          oid: '464',  // Use org 464
          app_key: getAppKey('console')
        },
        headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        },
        data: {
          user: {
            email: invitationEmail
          }
        }
      });

      console.log('Confirmation instructions response status:', response.status());
      expect(response.status()).toBe(202);
    });

    test('should register user with password in org 464', async ({ request }) => {
      const response = await request.post('/skiff/register', {
        params: {
          app_key: getAppKey('console'),
          oid: '464'  // Register in org 464
        },
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json'
        },
        data: {
          user: {
            email: invitationEmail,
            name: `Test User ${Date.now()}`,
            password: '12341234',
            password_confirmation: '12341234',
            invite_token: confirmationToken
          }
        }
      });

      console.log('Registration response status:', response.status());
      const responseBody = await response.json();
      console.log('Registration response:', JSON.stringify(responseBody, null, 2));

      expect(response.status()).toBe(202);
      expect(responseBody.user).toBeDefined();
      expect(responseBody.user.id).toBeDefined();
      expect(responseBody.session).toBeDefined();
      expect(responseBody.session.token).toBeDefined();
      
      newUserId = responseBody.user.id;
      newUserToken = responseBody.session.token;
      
      console.log('User registered with ID:', newUserId);
      console.log('Session token received:', newUserToken);
      console.log('User has affiliation with org 464, will request access to org 463');
    });

    test('should request access to org 463 (user is affiliated with org 464)', async ({ request }) => {
      // User has affiliation with org 464, now requesting access to org 463
      // Note: User has GivingTree User role, so must use givingtree app_key
      const response = await request.post('/auth/affiliation_requests', {
        params: {
          oid: '463'  // Request access to org 463
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': newUserToken,
          'Application-Key': getAppKey('givingtree'),  // Use givingtree app key
        },
        data: {
          commit: true,
          data: {
            class_year: 2020,
            reason: 'Test request for automated testing - requesting access from org 464 to org 463'
          }
        }
      });

      console.log('Request response status:', response.status());
      const responseBody = await response.json();
      console.log('Request response body:', JSON.stringify(responseBody, null, 2));

      // Verify status code is 201
      expect(response.status()).toBe(201);

      affiliationRequestId = responseBody.id;

      // Verify response schema
      expectSchema(responseBody, affiliationRequestSchema);

      // Verify request data
      expect(responseBody.status).toBe('PENDING');
      expect(responseBody.organization).toBeDefined();
      expect(responseBody.organization.id).toBe(463);
      
      console.log('Created affiliation request:', affiliationRequestId);
    });

    test('should moderate affiliation request - Approve (using Super Admin)', async ({ request }) => {
      if (!affiliationRequestId) {
        test.skip();
      }

      // Use Super Admin token for moderation (admins moderate requests)
      const response = await request.post(`/auth/affiliation_requests/${affiliationRequestId}/moderate`, {
        params: {
          oid: '463'
        },
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          approve: true
        }
      });

      console.log('Moderation response status:', response.status());
      const responseBody = await response.json();
      console.log('Moderated request (approved):', JSON.stringify(responseBody, null, 2));

      // Verify status code is 202
      expect(response.status()).toBe(202);

      // Verify response schema
      expectSchema(responseBody, affiliationRequestSchema);
      
      // Verify request was approved
      expect(responseBody.status).toBe('APPROVED');
      expect(responseBody.affiliation).toBeDefined();
    });

    test('should cleanup - delete created affiliations (both org 463 and 464)', async ({ request }) => {
      // Get user affiliations to find all created ones
      const affiliationsResponse = await request.get(`/auth/users/${newUserId}/affiliations`, {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      const affiliations = await affiliationsResponse.json();
      
      if (Array.isArray(affiliations) && affiliations.length > 0) {
        // Delete affiliation with org 463
        const affiliation463 = affiliations.find((aff: any) => aff.organization_id === 463);
        if (affiliation463) {
          const deleteResponse = await request.delete(`/auth/affiliations/${affiliation463.id}`, {
            params: {
              oid: '463'
            },
            headers: {
              'Application-Key': config.headers.applicationKey,
              'Authorization-Provider': 'EvertrueAuthToken',
              'Authorization': authToken,
            },
          });
          expect(deleteResponse.status()).toBe(204);
          console.log('Deleted affiliation with org 463:', affiliation463.id);
        }

        // Delete affiliation with org 464
        const affiliation464 = affiliations.find((aff: any) => aff.organization_id === 464);
        if (affiliation464) {
          const deleteResponse = await request.delete(`/auth/affiliations/${affiliation464.id}`, {
            params: {
              oid: '464'
            },
            headers: {
              'Application-Key': config.headers.applicationKey,
              'Authorization-Provider': 'EvertrueAuthToken',
              'Authorization': authToken,
            },
          });
          expect(deleteResponse.status()).toBe(204);
          console.log('Deleted affiliation with org 464:', affiliation464.id);
        }
      }
    });

    test('should cleanup - delete test user', async ({ request }) => {
      const response = await request.delete(`/auth/users/${newUserId}`, {
        headers: {
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Application-Key': getAppKey('console'),
        }
      });

      expect(response.status()).toBe(204);
      console.log('Deleted test user:', newUserId);
    });
  });
});
