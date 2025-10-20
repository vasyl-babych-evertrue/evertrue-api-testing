import { test, expect } from '@playwright/test';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { affiliationInvitationSchema, affiliationInvitationsArraySchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Affiliation Invitations (Positive Tests)
 * Tests for inviting users to organizations
 */
test.describe('Auth API - Affiliation Invitations (Positive Tests)', () => {
  let authToken: string;
  let userId: number;

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin user for invitation endpoints
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

  test.describe('GET /auth/affiliation_invitations - Get all invitations', () => {
    test('should get all affiliation invitations and return 200', async ({ request }) => {
      const response = await request.get('/auth/affiliation_invitations', {
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
      console.log('Affiliation invitations:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, affiliationInvitationsArraySchema);

      // Verify array structure
      expect(Array.isArray(responseBody)).toBe(true);

      if (responseBody.length > 0) {
        // Verify first invitation has required fields
        expect(responseBody[0].id).toBeDefined();
        expect(responseBody[0].email).toBeDefined();
        expect(responseBody[0].role_ids).toBeDefined();
        expect(Array.isArray(responseBody[0].role_ids)).toBe(true);
      }
    });
  });

  test.describe.serial('Affiliation Invitation Flow', () => {
    let invitationId: number;
    let inviteeEmail: string;

    test('should create affiliation invitation', async ({ request }) => {
      inviteeEmail = `test.invitation.${Date.now()}@evertrue.com`;

      // Get available roles
      const rolesResponse = await request.get('/auth/roles', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      const roles = await rolesResponse.json();
      console.log('Available roles for org 463:', JSON.stringify(roles, null, 2));
      
      // Find GivingTree User role for givingtree app
      const givingTreeRole = roles.find((role: any) => role.remote_id === 'GivingTree User');
      const roleIds = givingTreeRole ? [givingTreeRole.id] : (roles.length > 0 ? [roles[0].id] : []);

      const response = await request.post('/auth/affiliation_invitations', {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        },
        headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        },
        data: {
          name: 'Test Invitation User',
          email: inviteeEmail,
          contact_id: null,
          app: 'givingtree',
          role_ids: roleIds
        }
      });

      console.log('Create invitation response status:', response.status());
      const responseBody = await response.json();
      console.log('Create invitation response:', JSON.stringify(responseBody, null, 2));
      
      // Verify status code is 200
      expect(response.status()).toBe(200);

      invitationId = responseBody.id;

      // Verify response schema
      expectSchema(responseBody, affiliationInvitationSchema);

      // Verify invitation data
      expect(responseBody.email).toBe(inviteeEmail);
      expect(responseBody.name).toBe('Test Invitation User');
      // API returns role_ids as strings, convert for comparison
      expect(responseBody.role_ids).toEqual(roleIds.map(String));
      expect(responseBody.invited_by).toBe(userId);
    });

    test('should get specific affiliation invitation', async ({ request }) => {
      if (!invitationId) {
        test.skip();
      }

      const response = await request.get(`/auth/affiliation_invitations/${invitationId}`, {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      console.log('Specific invitation:', JSON.stringify(responseBody, null, 2));

      // Verify response schema
      expectSchema(responseBody, affiliationInvitationSchema);

      // Verify invitation data
      expect(responseBody.id).toBe(invitationId);
      expect(responseBody.name).toBe('Test Invitation User');
    });

    test('should delete affiliation invitation', async ({ request }) => {
      if (!invitationId) {
        test.skip();
      }

      const response = await request.delete(`/auth/affiliation_invitations/${invitationId}`, {
        params: {
          oid: '463',
          app_key: getAppKey('console'),
          auth: authToken
        }
      });

      // Verify status code is 204
      expect(response.status()).toBe(204);

      console.log('Deleted invitation:', invitationId);
    });
  });

});
