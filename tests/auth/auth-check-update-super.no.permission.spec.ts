import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';

/**
 * Auth API Tests - ET-29960, ET-29962
 * Tests for checking that non-super users cannot update super_user/super_admin flags
 * 
 * Bug Context:
 * - ET-29960: Non-super users should not be able to set super_user flag
 * - ET-29962: Non-super users should not be able to set super_admin flag
 * 
 * Test Flow:
 * 1. Login as regular user (vasyl.babych+3@swanteams.com)
 * 2. Attempt to update user with super_user and super_admin flags (should fail with 422)
 */
test.describe('Auth API - Check Update Super User Permissions (ET-29960, ET-29962)', () => {
  let regularUserToken: string;
  let regularUserId: number;
  let superAdminToken: string;

  test.beforeAll(async ({ request }) => {
    // Login as Super Admin
    const superAdminSession = await request.post('/auth/session', {
      headers: {
        'Application-Key': getAppKey('console'),
        'Authorization-Provider': 'EvertrueBasicAuth',
        'Device-ID': config.headers.deviceId,
        'host': config.headers.host,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
      },
    });

    const superSession = await superAdminSession.json();
    superAdminToken = superSession.token;

    console.log('Super admin authenticated');

    // Login as Regular User (non-super) using givingtree app key
    const regularUserSession = await request.post('/auth/session', {
      headers: {
        'Application-Key': getAppKey('givingtree'),
        'Authorization-Provider': 'EvertrueBasicAuth',
        'Device-ID': config.headers.deviceId,
        'host': config.headers.host,
        'Authorization': `Basic ${config.auth.regularUserToken}`,
      },
    });

    const session = await regularUserSession.json();
    regularUserToken = session.token;
    regularUserId = session.user.id;

    console.log('Regular user authenticated:', session.user.email);
    console.log('User ID:', regularUserId);
    console.log('User super_user:', session.user.super_user);
    console.log('User super_admin:', session.user.super_admin);
  });

  test('ET-29960, ET-29962: should NOT allow regular user to update their own super_user and super_admin flags', async ({ request }) => {
    // Regular user attempts to update themselves with super flags
    const response = await request.put(`/auth/users/${regularUserId}`, {
      params: {
        oid: '463'
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': getAppKey('givingtree'),
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': regularUserToken,
      },
      data: {
        super_user: true,
        super_admin: true
      }
    });

    console.log('Update user with super flags status:', response.status());

    const responseBody = await response.json();
    console.log('Update response:', JSON.stringify(responseBody, null, 2));

    // Expected: 422 with error message containing both super_user and super_admin
    // This validates that the API correctly prevents regular users from elevating their privileges
    expect(response.status()).toBe(422);
    expect(responseBody.message).toContain('Cannot update super_user and super_admin');
    
    console.log('✓ API correctly rejected regular user attempt to set super_user and super_admin flags');
  });

  test('should NOT allow non-@evertrue.com email to become super admin', async ({ request }) => {
    // Super admin creates a new user with non-@evertrue.com email
    const testUserEmail = `test.super.nonevertrue.${Date.now()}@swanteams.com`;
    
    const createUserResponse = await request.post('/auth/users', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': superAdminToken,
        'Application-Key': getAppKey('console'),
      },
      data: {
        email: testUserEmail,
        name: 'Test Non-EverTrue User',
        super_user: false,
        super_admin: false,
        email_locked: false
      }
    });

    expect(createUserResponse.status()).toBe(201);

    const createdUser = await createUserResponse.json();
    const testUserId = createdUser.id;
    
    console.log('Created test user:', testUserId, testUserEmail);
    console.log('User email domain:', testUserEmail.split('@')[1]);

    // Super admin attempts to update the non-@evertrue.com user with super flags
    const updateResponse = await request.put(`/auth/users/${testUserId}`, {
      params: {
        oid: '463'
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': getAppKey('console'),
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': superAdminToken,
      },
      data: {
        super_user: true
      }
    });

    console.log('Update non-@evertrue.com user with super flags status:', updateResponse.status());

    const updateBody = await updateResponse.json();
    console.log('Update response:', JSON.stringify(updateBody, null, 2));

    // Expected: 422 with error message "Super users must use an EverTrue email address"
    // Actual: API returns "Invalid user keys provided. Cannot update super_admin"
    // This test documents the bug - API should check email domain before allowing super user/admin flags
    expect(updateResponse.status()).toBe(422);
    
    // TODO: Once bug is fixed, this should be the expected message:
    // expect(updateBody.message).toContain('Super users must use an EverTrue email address');
    
    // Current behavior (bug):
    expect(updateBody.message).toContain('Super users must use an EverTrue email address');
    
    console.log('✓ API rejected update, but with generic message instead of email domain validation');
  });
});
