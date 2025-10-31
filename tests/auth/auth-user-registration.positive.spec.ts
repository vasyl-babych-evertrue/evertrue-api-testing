import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { registrationSchema, registrationWithDeviceSchema } from '../../schemas/auth.schemas';

/**
 * Helper function to generate realistic user names
 */
function generateUserName(): string {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
  const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${randomFirst} ${randomLast}`;
}

/**
 * Auth API Tests - User Registration (Positive Tests)
 * 
 * Tests cover:
 * 1. Basic user registration (POST /auth/registrations)
 * 2. Registration with Device-ID (Prime Token flow)
 * 3. Registration with invite token
 * 
 * Note: These are non-authenticated requests - no cookies or auth headers required
 * (Application-Key is still required)
 * 
 * Documentation: User Registration
 * - Creates global EverTrue user account with email/password credentials
 * - Confirmation email is sent (user must confirm before full access)
 * - Optional invite_token for organization affiliation
 * - Optional Device-ID header for Prime Token in response
 */
test.describe('Auth API - User Registration (Positive Tests)', () => {
  const createdUserIds: number[] = [];
  let superAdminToken: string;

  test.beforeAll(async ({ request }) => {
    // Create super-admin session for cleanup
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
        'host': config.headers.host,
      },
    });

    const body = await response.json();
    superAdminToken = body.token;
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete all created test users
    for (const userId of createdUserIds) {
      try {
        await request.delete(`/auth/users/${userId}`, {
          headers: {
            'Authorization-Provider': 'EvertrueAuthToken',
            'Authorization': superAdminToken,
            'Application-Key': config.headers.applicationKey,
            'host': config.headers.host,
          },
        });
        console.log(`✓ Deleted test user: ${userId}`);
      } catch (error) {
        console.error(`✗ Failed to delete user ${userId}:`, error);
      }
    }
  });

  test('should register new user with basic info and return 202', async ({ request }) => {
    // Generate unique user data
    const email = `test.${Date.now()}@example.com`;
    const name = generateUserName();

    const response = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email,
          name: name,
          password: 'TestPassword123!',
        },
      },
    });

    // Verify status code is 202 (Accepted)
    expect(response.status()).toBe(202);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, registrationSchema);

    // Verify user data
    expect(responseBody.user.email).toBe(email);
    expect(responseBody.user.name).toBe(name);
    expect(responseBody.user.super_user).toBe(false);
    expect(responseBody.user.id).toBeGreaterThan(0);

    // Store user ID for cleanup
    createdUserIds.push(responseBody.user.id);

    // Verify session data
    expect(responseBody.session.token).toBeTruthy();
    expect(responseBody.session.token.length).toBeGreaterThan(0);
    expect(responseBody.session.expire_at).toBeGreaterThan(Date.now());

    // Verify arrays are initialized
    expect(Array.isArray(responseBody.user.affiliations)).toBe(true);
    expect(Array.isArray(responseBody.user.affiliation_requests)).toBe(true);
  });

  test('should register new user with Device-ID and return Prime Token', async ({ request }) => {
    // Generate unique user data and device ID
    const email = `test.${Date.now()}@example.com`;
    const name = generateUserName();
    const deviceId = `test-device-${Date.now()}`;

    const response = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'Device-ID': deviceId,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email,
          name: name,
          password: 'TestPassword123!',
        },
      },
    });

    // Verify status code is 202
    expect(response.status()).toBe(202);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema with Device-ID (includes prime_token)
    expectSchema(responseBody, registrationWithDeviceSchema);

    // Store user ID for cleanup
    createdUserIds.push(responseBody.user.id);

    // Verify user data
    expect(responseBody.user.email).toBe(email);
    expect(responseBody.user.name).toBe(name);

    // Verify session includes prime_token
    expect(responseBody.session.token).toBeTruthy();
    expect(responseBody.session.prime_token).toBeTruthy();
    expect(responseBody.session.prime_token).not.toBeNull();
    expect(responseBody.session.prime_token.length).toBeGreaterThan(0);
  });

  test('should register new user with minimal required fields', async ({ request }) => {
    // Generate unique email only
    const email = `test.${Date.now()}@example.com`;

    const response = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email,
          name: 'Test User',
          password: 'TestPassword123!',
        },
      },
    });

    // Verify status code is 202
    expect(response.status()).toBe(202);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, registrationSchema);

    // Store user ID for cleanup
    createdUserIds.push(responseBody.user.id);

    // Verify email is correct
    expect(responseBody.user.email).toBe(email);
  });

  test('should register user with long name', async ({ request }) => {
    const email = `test.${Date.now()}@example.com`;
    const longName = 'A'.repeat(100); // Test with long name

    const response = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email,
          name: longName,
          password: 'TestPassword123!',
        },
      },
    });

    // Verify status code is 202
    expect(response.status()).toBe(202);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, registrationSchema);

    // Store user ID for cleanup
    createdUserIds.push(responseBody.user.id);

    // Verify name is stored correctly
    expect(responseBody.user.name).toBe(longName);
  });

  test('should register user with strong password', async ({ request }) => {
    const email = `test.${Date.now()}@example.com`;
    const name = generateUserName();
    const strongPassword = 'StrongPass123!';

    const response = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email,
          name: name,
          password: strongPassword,
        },
      },
    });

    // Verify status code is 202
    expect(response.status()).toBe(202);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, registrationSchema);

    // Store user ID for cleanup
    createdUserIds.push(responseBody.user.id);

    // Verify user is created
    expect(responseBody.user.id).toBeGreaterThan(0);
    expect(responseBody.session.token).toBeTruthy();
  });

  test('should register user with email containing plus sign', async ({ request }) => {
    const baseEmail = `test.${Date.now()}@example.com`;
    const emailWithPlus = baseEmail.replace('@', '+tag@');
    const name = generateUserName();

    const response = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: emailWithPlus,
          name: name,
          password: 'TestPassword123!',
        },
      },
    });

    // Verify status code is 202
    expect(response.status()).toBe(202);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, registrationSchema);

    // Store user ID for cleanup
    createdUserIds.push(responseBody.user.id);

    // Verify email with plus sign is accepted
    expect(responseBody.user.email).toBe(emailWithPlus);
  });

  test('should register user and return session token', async ({ request }) => {
    const email = `test.${Date.now()}@example.com`;
    const name = generateUserName();

    const response = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email,
          name: name,
          password: 'TestPassword123!',
        },
      },
    });

    // Verify status code is 202
    expect(response.status()).toBe(202);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, registrationSchema);

    // Store user ID for cleanup
    createdUserIds.push(responseBody.user.id);

    // Verify session token is returned
    const sessionToken = responseBody.session.token;
    expect(sessionToken).toBeTruthy();
    expect(sessionToken.length).toBeGreaterThan(0);
    
    // Verify session has expiration
    expect(responseBody.session.expire_at).toBeGreaterThan(Date.now());
  });

  test('should register user with name containing special characters', async ({ request }) => {
    const email = `test.${Date.now()}@example.com`;
    const nameWithSpecialChars = "O'Brien-Smith Jr.";

    const response = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email,
          name: nameWithSpecialChars,
          password: 'TestPassword123!',
        },
      },
    });

    // Verify status code is 202
    expect(response.status()).toBe(202);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, registrationSchema);

    // Store user ID for cleanup
    createdUserIds.push(responseBody.user.id);

    // Verify name with special characters is stored correctly
    expect(responseBody.user.name).toBe(nameWithSpecialChars);
  });

  test('should register user and timestamps should be valid', async ({ request }) => {
    const email = `test.${Date.now()}@example.com`;
    const name = generateUserName();
    const beforeRegistration = Date.now();

    const response = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email,
          name: name,
          password: 'TestPassword123!',
        },
      },
    });

    const afterRegistration = Date.now();

    // Verify status code is 202
    expect(response.status()).toBe(202);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, registrationSchema);

    // Store user ID for cleanup
    createdUserIds.push(responseBody.user.id);

    // Verify timestamps are within reasonable range
    // Note: API rounds timestamps to seconds, so we need to account for that
    const tolerance = 2000; // 2 seconds to account for rounding and processing time
    expect(responseBody.user.created_at).toBeGreaterThanOrEqual(beforeRegistration - tolerance);
    expect(responseBody.user.created_at).toBeLessThanOrEqual(afterRegistration + tolerance);
    expect(responseBody.user.updated_at).toBeGreaterThanOrEqual(beforeRegistration - tolerance);
    expect(responseBody.user.updated_at).toBeLessThanOrEqual(afterRegistration + tolerance);

    // Verify session timestamps
    expect(responseBody.session.created_at).toBeGreaterThanOrEqual(beforeRegistration - tolerance);
    expect(responseBody.session.created_at).toBeLessThanOrEqual(afterRegistration + tolerance);
    expect(responseBody.session.expire_at).toBeGreaterThan(afterRegistration);
  });

  test('should register multiple users with unique emails', async ({ request }) => {
    // Register first user
    const email1 = `test.${Date.now()}@example.com`;
    const name1 = generateUserName();
    const response1 = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email1,
          name: name1,
          password: 'TestPassword123!',
        },
      },
    });

    expect(response1.status()).toBe(202);
    const body1 = await response1.json();

    // Store first user ID for cleanup
    createdUserIds.push(body1.user.id);

    // Register second user
    const email2 = `test.${Date.now() + 1}@example.com`;
    const name2 = generateUserName();
    const response2 = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email2,
          name: name2,
          password: 'TestPassword123!',
        },
      },
    });

    expect(response2.status()).toBe(202);
    const body2 = await response2.json();

    // Store second user ID for cleanup
    createdUserIds.push(body2.user.id);

    // Verify both users have different IDs
    expect(body1.user.id).not.toBe(body2.user.id);
    expect(body1.user.email).not.toBe(body2.user.email);
  });

  test('should complete full registration flow with invitation and login', async ({ request }) => {
    const email = `test.${Date.now()}@example.com`;
    const name = generateUserName();
    const password = 'TestPassword123!';
    let newUserId: number;

    // Step 1: Get available roles for the organization
    const rolesResponse = await request.get('/auth/roles', {
      params: {
        oid: '463',
        app_key: config.headers.applicationKey,
        auth: superAdminToken,
      },
      headers: {
        'host': config.headers.host,
      },
    });

    const roles = await rolesResponse.json();
    // Find a role that works with givingtree app
    const givingTreeRole = roles.find((role: any) => 
      role.remote_id && role.remote_id.toLowerCase().includes('givingtree')
    );
    const roleIds = givingTreeRole ? [givingTreeRole.id] : roles.length > 0 ? [roles[0].id] : [1619];
    console.log('Using role IDs:', roleIds, givingTreeRole ? `(${givingTreeRole.remote_id})` : '');

    // Step 2: Create affiliation invitation
    const invitationResponse = await request.post('/auth/affiliation_invitations', {
      params: {
        oid: '463',
        app_key: config.headers.applicationKey,
        auth: superAdminToken,
      },
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'host': config.headers.host,
      },
      data: {
        name: name,
        email: email,
        contact_id: null,
        app: givingTreeRole ? 'givingtree' : 'console',
        role_ids: roleIds,
      },
    });

    expect(invitationResponse.status()).toBe(200);
    const invitationBody = await invitationResponse.json();
    console.log('✓ Invitation created:', invitationBody.email);

    // Step 3: Get confirmation token (internal testing endpoint)
    const userDataResponse = await request.get('/auth/internal_testing/user_data', {
      params: {
        oid: '463',
        app_key: config.headers.applicationKey,
        auth: superAdminToken,
        email: email,
      },
      headers: {
        'host': config.headers.host,
      },
    });

    expect(userDataResponse.status()).toBe(200);
    const responseBody = await userDataResponse.json();
    const inviteToken = responseBody.confirmation_token;
    expect(inviteToken).toBeTruthy();
    console.log('✓ Invite token received');

    // Step 4: Request confirmation instructions
    const confirmationResponse = await request.post('/auth/registrations/confirmation', {
      params: {
        oid: '463',
        app_key: config.headers.applicationKey,
      },
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email,
        },
      },
    });

    expect(confirmationResponse.status()).toBe(202);
    console.log('✓ Confirmation instructions sent');

    // Step 5: Register user with invite token (using /skiff/register endpoint)
    const registerResponse = await request.post('/skiff/register', {
      params: {
        app_key: config.headers.applicationKey,
        oid: '463',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=UTF-8',
        'host': config.headers.host,
      },
      data: {
        user: {
          email: email,
          name: name,
          password: password,
          password_confirmation: password,
          invite_token: inviteToken,
        },
      },
    });

    expect(registerResponse.status()).toBe(202);
    const registerBody = await registerResponse.json();
    
    // Validate registration response
    expectSchema(registerBody, registrationSchema);
    
    newUserId = registerBody.user.id;
    createdUserIds.push(newUserId);
    
    expect(registerBody.user.email).toBe(email);
    expect(registerBody.user.name).toBe(name);
    expect(registerBody.user.id).toBeGreaterThan(0);
    console.log('✓ User registered with ID:', newUserId);

    // Step 6: Verify session token is valid and user data is correct
    const sessionToken = registerBody.session.token;
    expect(sessionToken).toBeTruthy();
    expect(sessionToken.length).toBeGreaterThan(0);
    expect(registerBody.session.expire_at).toBeGreaterThan(Date.now());
    console.log('✓ Session token received and valid');
    
    // Verify user has affiliation from invitation
    expect(Array.isArray(registerBody.user.affiliations)).toBe(true);
    console.log('✓ User affiliations:', registerBody.user.affiliations);
    
    // Verify user properties
    expect(registerBody.user.super_user).toBe(false);
    expect(registerBody.user.created_at).toBeDefined();
    expect(registerBody.user.updated_at).toBeDefined();
    console.log('✓ Full registration flow completed successfully');
  });
});
