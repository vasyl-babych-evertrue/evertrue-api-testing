import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { passwordPolicySchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Password Policy (Positive Tests)
 * 
 * Endpoint:
 * - GET /auth/users/password/policy - Get password policy for user
 * 
 * Note: Returns most restrictive policy if user belongs to multiple orgs
 */
test.describe('Auth API - Password Policy (Positive Tests)', () => {
  let authToken: string;
  let userEmail: string;

  test.beforeAll(async ({ request }) => {
    // Create session with super admin credentials
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
        'host': config.headers.host,
      },
    });

    const body = await response.json();
    authToken = body.token;
    userEmail = body.user.email;
    console.log('✓ Session created for user:', userEmail);
  });

  test('should get password policy for user and return 200', async ({ request }) => {
    const response = await request.get('/auth/users/password/policy', {
      params: {
        oid: '463',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
    });

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, passwordPolicySchema);

    // Verify response structure
    expect(responseBody.email).toBe(userEmail);
    expect(responseBody.display_text).toBeTruthy();
    expect(responseBody.display_text).toContain('Password');
    
    // Verify password_policy object
    expect(responseBody.password_policy).toBeDefined();
    expect(responseBody.password_policy.min_length).toBeGreaterThan(0);
    expect(responseBody.password_policy.max_length).toBeGreaterThan(responseBody.password_policy.min_length);

    console.log('✓ Password policy retrieved:', responseBody.display_text);
    console.log('  Min length:', responseBody.password_policy.min_length);
    console.log('  Max length:', responseBody.password_policy.max_length);
  });

  test('should get password policy with minimum length requirement', async ({ request }) => {
    const response = await request.get('/auth/users/password/policy', {
      params: {
        oid: '463',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();

    // Verify minimum length is at least 8 (common security standard)
    expect(responseBody.password_policy.min_length).toBeGreaterThanOrEqual(8);
    
    // Verify display text mentions minimum characters
    expect(responseBody.display_text.toLowerCase()).toContain('minimum');
    expect(responseBody.display_text).toContain(responseBody.password_policy.min_length.toString());

    console.log('✓ Minimum password length verified:', responseBody.password_policy.min_length);
  });

  test('should get password policy with maximum length requirement', async ({ request }) => {
    const response = await request.get('/auth/users/password/policy', {
      params: {
        oid: '463',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();

    // Verify maximum length is reasonable (typically 128 or more)
    expect(responseBody.password_policy.max_length).toBeGreaterThanOrEqual(128);
    
    // Verify max_length is greater than min_length
    expect(responseBody.password_policy.max_length).toBeGreaterThan(responseBody.password_policy.min_length);

    console.log('✓ Maximum password length verified:', responseBody.password_policy.max_length);
  });

  test('should get password policy for different organization', async ({ request }) => {
    const response = await request.get('/auth/users/password/policy', {
      params: {
        oid: '464',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, passwordPolicySchema);

    // Verify response contains valid policy
    expect(responseBody.email).toBe(userEmail);
    expect(responseBody.password_policy.min_length).toBeGreaterThan(0);
    expect(responseBody.password_policy.max_length).toBeGreaterThan(0);

    console.log('✓ Password policy retrieved for org 464');
  });

  test('should get consistent password policy structure', async ({ request }) => {
    const response = await request.get('/auth/users/password/policy', {
      params: {
        oid: '463',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();

    // Verify all required fields are present
    expect(responseBody).toHaveProperty('email');
    expect(responseBody).toHaveProperty('display_text');
    expect(responseBody).toHaveProperty('password_policy');
    expect(responseBody.password_policy).toHaveProperty('min_length');
    expect(responseBody.password_policy).toHaveProperty('max_length');

    // Verify data types
    expect(typeof responseBody.email).toBe('string');
    expect(typeof responseBody.display_text).toBe('string');
    expect(typeof responseBody.password_policy.min_length).toBe('number');
    expect(typeof responseBody.password_policy.max_length).toBe('number');

    console.log('✓ Password policy structure is consistent');
  });

  test('should get password policy with valid display text', async ({ request }) => {
    const response = await request.get('/auth/users/password/policy', {
      params: {
        oid: '463',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
    });

    expect(response.status()).toBe(200);
    const responseBody = await response.json();

    // Verify display text is user-friendly
    expect(responseBody.display_text.length).toBeGreaterThan(0);
    expect(responseBody.display_text).toContain('Password');
    
    // Display text should be informative
    const displayTextLower = responseBody.display_text.toLowerCase();
    const hasMinimum = displayTextLower.includes('minimum') || displayTextLower.includes('min');
    const hasCharacters = displayTextLower.includes('character');
    
    expect(hasMinimum || hasCharacters).toBe(true);

    console.log('✓ Display text is user-friendly:', responseBody.display_text);
  });

  test('should get password policy multiple times with consistent results', async ({ request }) => {
    // Make multiple requests to verify consistency
    const response1 = await request.get('/auth/users/password/policy', {
      params: {
        oid: '463',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
    });

    const response2 = await request.get('/auth/users/password/policy', {
      params: {
        oid: '463',
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authToken,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Application-Key': config.headers.applicationKey,
        'host': config.headers.host,
      },
    });

    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);

    const body1 = await response1.json();
    const body2 = await response2.json();

    // Verify both responses are identical
    expect(body1.email).toBe(body2.email);
    expect(body1.display_text).toBe(body2.display_text);
    expect(body1.password_policy.min_length).toBe(body2.password_policy.min_length);
    expect(body1.password_policy.max_length).toBe(body2.password_policy.max_length);

    console.log('✓ Password policy is consistent across multiple requests');
  });
});
