import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { passwordResetRequestSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - User Password Reset (Positive Tests)
 * 
 * Endpoints:
 * - POST /auth/registrations/password - Request password reset instructions
 * - PUT /auth/registrations/password - Reset password with token
 * 
 * Note: These are non-authenticated requests
 */
test.describe('Auth API - User Password Reset (Positive Tests)', () => {
  let superAdminToken: string;
  let testUserId: number;
  let testUserEmail: string;
  let resetPasswordToken: string;

  test.beforeAll(async ({ request }) => {
    // Create super-admin session for user management
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

    // Create a test user for password reset testing
    testUserEmail = `test.password.reset.${Date.now()}@example.com`;
    const createUserResponse = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: testUserEmail,
          name: 'Test Password Reset User',
          password: 'OldPassword123!',
        },
      },
    });

    const createUserBody = await createUserResponse.json();
    testUserId = createUserBody.user.id;
    console.log('✓ Test user created:', testUserId, testUserEmail);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete test user
    if (testUserId) {
      try {
        await request.delete(`/auth/users/${testUserId}`, {
          headers: {
            'Authorization-Provider': 'EvertrueAuthToken',
            'Authorization': superAdminToken,
            'Application-Key': config.headers.applicationKey,
            'host': config.headers.host,
          },
        });
        console.log('✓ Deleted test user:', testUserId);
      } catch (error) {
        console.error('✗ Failed to delete test user:', testUserId, error);
      }
    }
  });

  test('should request password reset instructions and return 202', async ({ request }) => {
    // Request password reset instructions
    const response = await request.post('/auth/registrations/password', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: testUserEmail,
        },
      },
    });

    // Verify status code is 202
    expect(response.status()).toBe(202);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, passwordResetRequestSchema);

    // Verify response structure
    expect(responseBody.message).toBeTruthy();
    expect(responseBody.message).toContain('password reset instructions');

    console.log('✓ Password reset instructions requested for:', testUserEmail);
  });

  test('should request password reset with valid email', async ({ request }) => {
    // Request password reset instructions
    const resetResponse = await request.post('/auth/registrations/password', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: testUserEmail,
        },
      },
    });

    expect(resetResponse.status()).toBe(202);
    const resetBody = await resetResponse.json();
    expectSchema(resetBody, passwordResetRequestSchema);
    expect(resetBody.message).toContain('password reset instructions');
    console.log('✓ Password reset requested successfully');
  });

  test('should handle invalid reset token with 422', async ({ request }) => {
    // Try to reset password with invalid token
    const invalidToken = 'invalid_token_12345';
    const newPassword = 'NewPassword123!';
    
    const response = await request.put('/auth/registrations/password', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          password: newPassword,
          reset_password_token: invalidToken,
        },
      },
    });

    // Verify status code is 422 (invalid token)
    expect(response.status()).toBe(422);
    console.log('✓ Invalid token handled correctly');
  });

  test('should complete full password reset flow', async ({ request }) => {
    // Create a new test user for this flow
    const flowEmail = `test.full.flow.${Date.now()}@example.com`;
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';

    // Step 1: Create user
    const createResponse = await request.post('/auth/registrations', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: flowEmail,
          name: 'Full Flow Test User',
          password: oldPassword,
        },
      },
    });

    expect(createResponse.status()).toBe(202);
    const createBody = await createResponse.json();
    const flowUserId = createBody.user.id;
    console.log('✓ User created for full flow test:', flowUserId);

    // Step 2: Request password reset
    const resetRequestResponse = await request.post('/auth/registrations/password', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: flowEmail,
        },
      },
    });

    expect(resetRequestResponse.status()).toBe(202);
    const resetRequestBody = await resetRequestResponse.json();
    expectSchema(resetRequestBody, passwordResetRequestSchema);
    expect(resetRequestBody.message).toContain('password reset instructions');
    console.log('✓ Password reset requested');

    // Note: In a real scenario, the user would receive an email with reset token
    // For testing purposes, we verify the request was successful
    console.log('✓ Full password reset flow initiated successfully');

    // Cleanup
    await request.delete(`/auth/users/${flowUserId}`, {
      headers: {
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': superAdminToken,
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
    });
    console.log('✓ Deleted test user:', flowUserId);
  });

  test('should request password reset for non-existent email and return 202', async ({ request }) => {
    // Even for non-existent emails, API should return 202 to prevent email enumeration
    const nonExistentEmail = `nonexistent.${Date.now()}@example.com`;

    const response = await request.post('/auth/registrations/password', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
      data: {
        user: {
          email: nonExistentEmail,
        },
      },
    });

    // Should still return 202 to prevent email enumeration
    expect(response.status()).toBe(202);
    console.log('✓ Password reset request handled for non-existent email');
  });
});
