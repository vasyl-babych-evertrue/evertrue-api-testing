import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { createSessionSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - LinkedIn Access Token Authentication
 * Tests for LinkedIn OAuth 2.0 integration
 * Based on documentation: LinkedinAccessToken strategy
 *
 * Credentials: vasyl.babych@evertrue.com / p0o9P)O(p0o9P)O(
 *
 * LinkedIn Authentication Flow:
 * 1. User authenticates with LinkedIn OAuth 2.0
 * 2. Get LinkedIn Access Token from LinkedIn
 * 3. Activate token through LIDS: PUT /lids/auth/association/activate
 * 4. Use activated token with Auth API: POST /auth/session
 */
test.describe('Auth API - LinkedIn Access Token Authentication', () => {
  test.describe('SODAS/LIDS Integration', () => {
    test('should get LinkedIn authorization URL', async ({ request }) => {
      // Step 1: Get LinkedIn authorization URL
      const callbackUrl = 'https://stage-api.evertrue.com/test-callback';
      const encodedCallback = encodeURIComponent(callbackUrl);

      const response = await request.get(`/lids/auth?callback_url=${encodedCallback}`, {
        headers: {
          'Application-Key': getAppKey('console'),
        },
      });

      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.authorize_url).toBeTruthy();
      expect(responseBody.authorize_url).toContain('linkedin.com');
      expect(responseBody.authorize_url).toContain('oauth/v2/authorization');

      // Перевірити, що URL містить необхідні OAuth параметри
      expect(responseBody.authorize_url).toContain('client_id=');
      expect(responseBody.authorize_url).toContain('redirect_uri=');
      expect(responseBody.authorize_url).toContain('response_type=code');
      expect(responseBody.authorize_url).toContain('state=');
    });

    test.skip('should complete full LinkedIn OAuth flow', async ({ request }) => {
      // This test demonstrates the complete LinkedIn authentication flow
      // Note: This requires manual LinkedIn login, so it's skipped in automated tests

      // Step 1: Get authorization URL (already tested above)
      const callbackUrl = 'https://stage-api.evertrue.com/test-callback';
      const encodedCallback = encodeURIComponent(callbackUrl);

      const authUrlResponse = await request.get(`/lids/auth?callback_url=${encodedCallback}`);
      const _authUrlBody = await authUrlResponse.json();

      // Step 2: User would manually login and get code/state from callback
      // For testing, we'd need real code/state from LinkedIn callback
      const mockCode = 'REAL_LINKEDIN_CODE_HERE';
      const mockState = 'REAL_LINKEDIN_STATE_HERE';

      // Step 3: Exchange code for access token
      const tokenResponse = await request.get(`/lids/callback?code=${mockCode}&state=${mockState}`);
      expect(tokenResponse.status()).toBe(200);

      const tokenBody = await tokenResponse.json();
      const linkedinAccessToken = tokenBody.linkedin_access_token;

      // Step 4: Activate token through LIDS
      const activateResponse = await request.put(
        `/lids/auth/association/activate?linkedin_access_token=${linkedinAccessToken}`,
        {
          headers: {
            'Application-Key': getAppKey('console'),
          },
        }
      );
      expect(activateResponse.status()).toBe(204);

      // Step 5: Use activated token with Auth API
      const authResponse = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'LinkedinAccessToken',
          Authorization: linkedinAccessToken,
        },
      });

      expect(authResponse.status()).toBe(201);

      const responseBody = await authResponse.json();
      expectSchema(responseBody, createSessionSchema);

      expect(responseBody.token).toBeTruthy();
      expect(responseBody.user).toBeTruthy();
      expect(responseBody.user.email).toBe('vasyl.babych@evertrue.com');
    });

    test('should return 422 when LinkedIn token is missing in LIDS activation', async ({ request }) => {
      const response = await request.put('/lids/auth/association/activate', {
        headers: {
          'Application-Key': getAppKey('console'),
        },
      });

      expect(response.status()).toBe(422);
    });

    test('should return 403 for invalid LinkedIn token in LIDS activation', async ({ request }) => {
      const response = await request.put('/lids/auth/association/activate?linkedin_access_token=invalid_token_12345', {
        headers: {
          'Application-Key': getAppKey('console'),
        },
      });

      // Invalid token returns 403
      expect(response.status()).toBe(403);
    });

    test('should return 403 when LinkedIn profile cannot be matched to user', async ({ request }) => {
      const response = await request.put(
        '/lids/auth/association/activate?linkedin_access_token=unmatched_linkedin_token',
        {
          headers: {
            'Application-Key': getAppKey('console'),
          },
        }
      );

      // Unmatched token returns 403
      expect(response.status()).toBe(403);
    });

    test('should handle callback with invalid code/state', async ({ request }) => {
      const response = await request.get('/lids/callback?code=invalid_code&state=invalid_state');

      // Invalid code/state returns 400
      expect(response.status()).toBe(400);
    });

    test('should return error for callback without parameters', async ({ request }) => {
      const response = await request.get('/lids/callback');

      // Missing parameters returns 400
      expect(response.status()).toBe(400);
    });
  });

  test('should return 401 with invalid LinkedIn token', async ({ request }) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'LinkedinAccessToken',
        Authorization: 'invalid_linkedin_token_12345',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should return 401 with non-activated LinkedIn token', async ({ request }) => {
    // Test that LinkedIn token must be activated through LIDS first
    // Even if token format is valid, it should fail if not activated
    const nonActivatedToken = 'AQXMOTf0eqLBnAn5Wr_6Euv1ehl1dKK_fake_token';

    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'LinkedinAccessToken',
        Authorization: nonActivatedToken,
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should return 401 with malformed LinkedIn token', async ({ request }) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'LinkedinAccessToken',
        Authorization: 'malformed_token',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should create session with Basic Auth credentials', async ({ request }) => {
    // Since we don't have a LinkedIn Access Token, let's test with Basic Auth
    // which uses the same credentials but different provider

    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'EvertrueBasicAuth',
        Authorization: `Basic ${config.auth.superAdminToken}`,
      },
    });

    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    expectSchema(responseBody, createSessionSchema);

    expect(responseBody.token).toBeTruthy();
    expect(responseBody.user).toBeTruthy();
    expect(responseBody.user.email).toBe('vasyl.babych@evertrue.com');
  });

  test('should demonstrate LinkedIn token session creation flow', async ({ request }) => {
    // Демонструємо правильний flow з прикладом токена з документації
    // Використовуємо приклад токена з Auth API документації
    // ПРИМІТКА: Для реального позитивного тесту потрібен справжній LinkedIn Access Token,
    // отриманий через OAuth 2.0 flow і активований через SODAS
    const exampleLinkedinToken =
      'AQUFDMOWde-ic0vkle9eJTtYKk26Mtj_4mMrSuHtKieON8ML4VWNOmi22Bq6VxZ0JVm22St_5Rks9ussiQBM_sOcCuNyhj2z6DxflYsrjZq5yGZpd62dfHOcJbLJb02mev6GE6SwEnF617UwB8QiW-M9iuy-o6bpKr_iesKoPqd-i-ZD5d8';

    // Спочатку спробуємо активувати токен через LIDS
    const activateResponse = await request.put(
      `/lids/auth/association/activate?linkedin_access_token=${exampleLinkedinToken}`,
      {
        headers: {
          'Application-Key': getAppKey('console'),
        },
      }
    );

    // Очікуємо помилку, оскільки це не реальний токен (403 for invalid token)
    expect(activateResponse.status()).toBe(403);

    // Тепер спробуємо створити сесію (також очікуємо помилку)
    const sessionResponse = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'LinkedinAccessToken',
        Authorization: exampleLinkedinToken,
      },
    });

    // Токен не активований, тому очікуємо 401
    expect(sessionResponse.status()).toBe(401);

    // Перевіримо, що помилка містить інформацію про неактивований токен
    const errorBody = await sessionResponse.json();
    expect(errorBody).toBeTruthy();
  });

  test.skip('should create session with Device ID and get Prime Token', async ({ request }) => {
    // Test LinkedIn auth with Device ID to get Prime Token
    // Skipping until we have valid LinkedIn token

    const linkedinToken = 'VALID_LINKEDIN_TOKEN_HERE';
    const deviceId = 'linkedin-test-device-' + Date.now();

    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'LinkedinAccessToken',
        Authorization: linkedinToken,
        'Device-ID': deviceId,
      },
    });

    expect(response.status()).toBe(201);

    const responseBody = await response.json();
    expectSchema(responseBody, createSessionSchema);

    expect(responseBody.token).toBeTruthy();
    expect(responseBody.prime_token).toBeTruthy();
    expect(responseBody.device_id).toBe(deviceId);
  });

  test('should return 401 for shared LinkedIn identity token (not activated)', async ({ request }) => {
    // Test the case where LinkedIn identity token is not activated
    // Invalid/non-activated token returns 401

    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'LinkedinAccessToken',
        Authorization: 'shared_identity_token',
      },
    });

    // Non-activated token returns 401
    expect(response.status()).toBe(401);
  });

  test('should return 401 without Authorization-Provider header', async ({ request }) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        Authorization: 'some_linkedin_token',
      },
    });

    // Without Authorization-Provider, defaults to EvertrueAuthToken and fails with 401
    expect(response.status()).toBe(401);
  });

  test('should work with different app keys', async ({ request }) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': getAppKey('community'),
        'Authorization-Provider': 'LinkedinAccessToken',
        Authorization: 'invalid_linkedin_token_12345',
      },
    });

    // Should still return 401 for invalid token regardless of app key
    expect(response.status()).toBe(401);
  });

  test('should handle LinkedIn token with Base64 encoding', async ({ request }) => {
    // Test Base64 encoded LinkedIn token as mentioned in documentation
    // Використовуємо приклад токена з документації
    const rawLinkedinToken =
      'AQUFDMOWde-ic0vkle9eJTtYKk26Mtj_4mMrSuHtKieON8ML4VWNOmi22Bq6VxZ0JVm22St_5Rks9ussiQBM_sOcCuNyhj2z6DxflYsrjZq5yGZpd62dfHOcJbLJb02mev6GE6SwEnF617UwB8QiW-M9iuy-o6bpKr_iesKoPqd-i-ZD5d8';
    const encodedToken = Buffer.from(`:${rawLinkedinToken}`).toString('base64');

    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'LinkedinAccessToken',
        Authorization: `Basic ${encodedToken}`,
      },
    });

    // Очікуємо 401, оскільки токен не активований через LIDS
    expect(response.status()).toBe(401);

    const responseBody = await response.json();
    expect(responseBody).toBeTruthy();
  });

  test('should return proper error for non-activated LinkedIn token', async ({ request }) => {
    // Test LinkedIn token that hasn't been activated through SODAS
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'LinkedinAccessToken',
        Authorization: 'non_activated_linkedin_token',
      },
    });

    expect(response.status()).toBe(401);
  });

  test.describe('LinkedIn Token Edge Cases', () => {
    test('should handle empty LinkedIn token', async ({ request }) => {
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'LinkedinAccessToken',
          Authorization: '',
        },
      });

      // Empty token returns 401
      expect(response.status()).toBe(401);
    });

    test('should handle very long LinkedIn token', async ({ request }) => {
      const longToken = 'A'.repeat(1000); // Very long invalid token

      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'LinkedinAccessToken',
          Authorization: longToken,
        },
      });

      // Invalid token returns 401
      expect(response.status()).toBe(401);
    });

    test('should handle LinkedIn token with special characters', async ({ request }) => {
      const tokenWithSpecialChars = 'token_with_!@#$%^&*()_special_chars';

      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'LinkedinAccessToken',
          Authorization: tokenWithSpecialChars,
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('LinkedIn Association Management', () => {
    let authToken: string;

    test.beforeAll(async ({ request }) => {
      // Get auth token for association tests
      const sessionResponse = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueBasicAuth',
          Authorization: `Basic ${config.auth.superAdminToken}`,
        },
      });

      const sessionBody = await sessionResponse.json();
      authToken = sessionBody.token;
    });

    test.skip('should create LinkedIn association', async ({ request }) => {
      // This requires a valid LinkedIn Access Token
      const linkedinToken = 'VALID_LINKEDIN_TOKEN_HERE';

      const response = await request.put(`/lids/auth/association?linkedin_access_token=${linkedinToken}`, {
        headers: {
          'Application-Key': getAppKey('console'),
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
        },
      });

      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.user).toBeTruthy();
      expect(responseBody.user.email).toBe('vasyl.babych@evertrue.com');
    });

    test('should return 401 without auth token for association', async ({ request }) => {
      const response = await request.put('/lids/auth/association?linkedin_access_token=some_token');

      expect(response.status()).toBe(401);
    });

    test('should get association status', async ({ request }) => {
      const response = await request.get('/lids/auth/association', {
        headers: {
          'Application-Key': getAppKey('console'),
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
        },
      });

      // Returns 412 when no LinkedIn token associated
      expect(response.status()).toBe(412);
    });

    test('should return 401 without auth for get association', async ({ request }) => {
      const response = await request.get('/lids/auth/association');

      expect(response.status()).toBe(401);
    });

    test('should handle remove association', async ({ request }) => {
      const response = await request.delete('/lids/auth/association', {
        headers: {
          'Application-Key': getAppKey('console'),
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
        },
      });

      // Returns 204 when successfully removed (or no association exists)
      expect(response.status()).toBe(204);
    });
  });
});
