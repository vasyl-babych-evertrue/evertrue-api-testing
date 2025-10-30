import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { 
  registrationSchema
} from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Account Update (Positive Tests)
 * 
 * Full flow for user registration and account update via invitation:
 * 1. Admin login (get session token)
 * 2. Create affiliation invitation
 * 3. Get confirmation token (invite_token)
 * 4. Request confirmation instructions
 * 5. Register user with invite_token
 * 6. Login as new user
 * 7. Update user account (name, email, password)
 * 8. Cleanup - delete user
 * 
 * Endpoints:
 * - POST /auth/session - Admin/User login
 * - POST /auth/affiliation_invitations - Create invitation
 * - GET /auth/internal_testing/user_data - Get confirmation token
 * - POST /auth/registrations/confirmation - Request confirmation
 * - POST /skiff/register - Register user with invite_token
 * - PUT /auth/registrations - Update user account
 * - DELETE /auth/users/{id} - Delete user (cleanup)
 */
test.describe.configure({ mode: 'serial' });

test.describe('Auth API - Account Update (Positive Tests)', () => {
  let adminAuthToken: string;
  let userAuthToken: string;
  let confirmationToken: string;
  let inviteToken: string;
  let registeredEmail: string;
  let userId: number;
  const testOid = '463';
  const password = '12341234';
  const newPassword = 'MyNewPassword1!';

  test('Step 1: Admin login and get session token', async ({ request }) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': getAppKey('auth_api'),
        'Authorization-Provider': 'EvertrueBasicAuth',
        'Authorization': `Basic ${config.auth.superAdminToken}`,
        'host': config.headers.host,
        'Device-ID': 'null',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    adminAuthToken = body.token;
    console.log('✓ Admin session created');
  });

  test('Step 2: Create affiliation invitation', async ({ request }) => {
    registeredEmail = `test.${Date.now()}@evertrue.com`;
    const name = `Test ${Date.now()}`;

    const response = await request.post('/auth/affiliation_invitations', {
      params: {
        oid: testOid,
        app_key: getAppKey('givingtree'),
        auth: adminAuthToken,
      },
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      },
    data: {
        
        email: registeredEmail,
        app: 'givingtree',
        role_ids: [1616, 1618],
      },
    });

    const responseBody = await response.json();

    expect(response.status()).toBe(200);
    expect(responseBody.email).toBe(registeredEmail);

    console.log('✓ Affiliation invitation created:', registeredEmail);
  });

  test('Step 3: Get confirmation token (invite_token)', async ({ request }) => {
    const response = await request.get('/auth/internal_testing/user_data', {
      params: {
        oid: testOid,
        app_key: getAppKey('givingtree'),
        auth: adminAuthToken,
        email: registeredEmail,
      },
      headers: {
        'host': config.headers.host,
      },
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    
    confirmationToken = responseBody.confirmation_token;
    inviteToken = confirmationToken;
    expect(inviteToken).toBeTruthy();

    console.log('✓ Confirmation token (invite_token) received');
  });

  test('Step 4: Request confirmation instructions', async ({ request }) => {
    const response = await request.post('/auth/registrations/confirmation', {
      params: {
        oid: testOid,
        app_key: getAppKey('givingtree'),
      },
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'host': config.headers.host,
      },
      data: {
        user: {
          email: registeredEmail,
        },
      },
    });

    expect(response.status()).toBe(202);
    console.log('✓ Confirmation instructions sent');
  });

  test('Step 5: Register user with invite_token', async ({ request }) => {
    const name = `Test User ${Date.now()}`;

    const response = await request.post('/auth/registrations', {
      params: {
        app_key: getAppKey('givingtree'),
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=UTF-8',
        'host': config.headers.host,
      },
      data: {
        user: {
          email: registeredEmail,
          name: name,
          password: password,
          password_confirmation: password,
          invite_token: inviteToken,
        },
      },
    });

    const responseBody = await response.json();
 
    expect(response.status()).toBe(202);
    
    expectSchema(responseBody, registrationSchema);

    userId = responseBody.user.id;
    expect(responseBody.user.email).toBe(registeredEmail);

    console.log('✓ User registered with ID:', userId);
  });

  test('Step 6: Login as new user', async ({ request }) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': getAppKey('auth_api'),
        'Authorization-Provider': 'EvertrueBasicAuth',
        'Authorization': `Basic ${Buffer.from(`${registeredEmail}:${password}`).toString('base64')}`,
        'host': config.headers.host,
        'Device-ID': 'null',
      },
    });

    const responseBody = await response.json();

    expect(response.status()).toBe(201);
    userAuthToken = responseBody.token;

    expect(userAuthToken).toBeTruthy();
    console.log('✓ User logged in successfully');
  });

  test('Step 7: Update user account (name and password)', async ({ request }) => {
    const newName = 'Test new user name';

    const response = await request.put('/auth/registrations', {
      params: {
        oid: testOid,
        app_key: getAppKey('givingtree'),
        auth: userAuthToken,
      },
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'host': config.headers.host,
      },
      data: {
        name: newName,
        email: registeredEmail.toLowerCase(),
        password: newPassword,
      },
    });

    const responseBody = await response.json();
   
    expect(response.status()).toBe(200);

    expect(responseBody.user).toBeDefined();
    expect(responseBody.user.name).toBe(newName);

    console.log('✓ User account updated successfully');
  });

  test('Step 8: Cleanup - Delete user', async ({ request }) => {
    const response = await request.delete(`/auth/users/${userId}`, {
      params: {
        oid: testOid,
        app_key: config.headers.applicationKey,
        auth: adminAuthToken,
      },
      headers: {
        'host': config.headers.host,
      },
    });

    expect(response.status()).toBe(204);
    console.log('✓ User deleted:', userId);
  });
});
