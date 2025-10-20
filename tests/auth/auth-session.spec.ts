import { test, expect } from '@playwright/test';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { 
  createSessionSchema, 
  createSessionWithDeviceSchema,
  createScopedSessionSchema,
  createSessionFromPrimeTokenSchema,
  currentSessionSchema, 
  statusSchema, 
  emptyResponseSchema, 
  loginsArraySchema 
} from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Session Management
 * Based on Postman collection: "Vasyl test" -> "OAuth" -> "API Status Copy"
 */
test.describe('Auth API - Session Management', () => {
  let authToken: string;
  let primeToken: string;

  test.describe('POST /auth/session - Create session', () => {
    
    test('should create session with valid credentials and return 201', async ({ request }) => {
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': config.headers.authorizationProvider,
          'Device-ID': config.headers.deviceId,
          'host': config.headers.host,
          'Authorization': `Basic ${config.auth.basicToken}`,
        },
      });

      // Verify status code is 201
      expect(response.status()).toBe(201);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, createSessionSchema);

      // Store tokens for subsequent tests
      authToken = responseBody.token;
      primeToken = responseBody.prime_token || responseBody.token;

      // Verify token is not empty
      expect(authToken).toBeTruthy();
      expect(authToken.length).toBeGreaterThan(0);
    });

    test('should create session with Device ID and return Prime Token', async ({ request }) => {
      const deviceId = 'test-device-' + Date.now();
      
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': config.headers.authorizationProvider,
          'Device-ID': deviceId,
          'host': config.headers.host,
          'Authorization': `Basic ${config.auth.basicToken}`,
        },
      });

      // Verify status code is 201
      expect(response.status()).toBe(201);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, createSessionWithDeviceSchema);

      // Verify both session token and prime token are present
      expect(responseBody.token).toBeTruthy();
      expect(responseBody.prime_token).toBeTruthy();
      expect(responseBody.device_id).toBe(deviceId);

      // Store prime token for subsequent tests
      primeToken = responseBody.prime_token;
    });

    test('should create scoped session with OID', async ({ request }) => {
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': config.headers.authorizationProvider,
          'Device-ID': config.headers.deviceId,
          'host': config.headers.host,
          'Authorization': `Basic ${config.auth.basicToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          type: 'SCOPED',
          oid: 463
        }
      });

      // Verify status code is 201
      expect(response.status()).toBe(201);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, createScopedSessionSchema);

      // Verify scoped session properties
      expect(responseBody.type).toBe('SCOPED');
      expect(responseBody.oid).toBe(463);
    });

    test('should return 401 with invalid credentials', async ({ request }) => {
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': config.headers.authorizationProvider,
          'Device-ID': config.headers.deviceId,
          'host': config.headers.host,
          'Authorization': 'Basic invalid_credentials',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 400 without Application-Key', async ({ request }) => {
      const response = await request.post('/auth/session', {
        headers: {
          'Authorization-Provider': config.headers.authorizationProvider,
          'Device-ID': config.headers.deviceId,
          'host': config.headers.host,
          'Authorization': `Basic ${config.auth.basicToken}`,
        },
      });

      expect([400]).toContain(response.status());
    });
  });

  test.describe('POST /auth/session - Prime Token Authentication', () => {
    let testPrimeToken: string;
    let testDeviceId: string;

    test.beforeAll(async ({ request }) => {
      // Create a session with Device ID to get Prime Token
      testDeviceId = 'test-device-' + Date.now();
      
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': config.headers.authorizationProvider,
          'Device-ID': testDeviceId,
          'host': config.headers.host,
          'Authorization': `Basic ${config.auth.basicToken}`,
        },
      });

      const body = await response.json();
      testPrimeToken = body.prime_token;
    });

    test('should create session using Prime Token', async ({ request }) => {
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertruePrimeToken',
          'Device-ID': testDeviceId,
          'host': config.headers.host,
          'Authorization': testPrimeToken,
        },
      });

      // Verify status code is 201
      expect(response.status()).toBe(201);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, createSessionFromPrimeTokenSchema);

      // Verify session token is present
      expect(responseBody.token).toBeTruthy();
      expect(responseBody.device_id).toBe(testDeviceId);
    });

    test('should return 401 with invalid Prime Token', async ({ request }) => {
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertruePrimeToken',
          'Device-ID': testDeviceId,
          'host': config.headers.host,
          'Authorization': 'invalid_prime_token',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 401 with mismatched Device ID', async ({ request }) => {
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertruePrimeToken',
          'Device-ID': 'wrong-device-id',
          'host': config.headers.host,
          'Authorization': testPrimeToken,
        },
      });

      expect(response.status()).toBe(401);
    });
  });

  test.describe('GET /auth/session - Get current session', () => {
    let sessionToken: string;

    test.beforeEach(async ({ request }) => {
      // Create session to get auth token before each test
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
      sessionToken = body.token;
    });

    test('should get current session with valid token and return 200', async ({ request }) => {
      const response = await request.get('/auth/session', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': sessionToken,
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, currentSessionSchema);

      // Verify token matches
      expect(responseBody.token).toBe(sessionToken);
    });

    test('should return 401 without authorization token', async ({ request }) => {
      const response = await request.get('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
        },
      });

      expect([401, 403]).toContain(response.status());
    });

    test('should return 401 with invalid token', async ({ request }) => {
      const response = await request.get('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': 'invalid_token_12345',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should track OID context when provided', async ({ request }) => {
      const response = await request.get('/auth/session', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': sessionToken,
          'Authorization-OID': '463',
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, currentSessionSchema);
    });

    test('should work with different app keys', async ({ request }) => {
      const response = await request.get('/auth/session', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Application-Key': getAppKey('auth_api'),
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': sessionToken,
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, currentSessionSchema);
    });
  });

  test.describe('OPTIONS /auth/ - CORS preflight', () => {
    
    test('should return 204 for OPTIONS request', async ({ request }) => {
      const response = await request.fetch('https://stage-api.evertrue.com/auth/', {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Basic ${config.auth.basicToken}`,
        },
      });

      // Verify status code is 204
      expect(response.status()).toBe(204);
    });
  });

  test.describe('DELETE /auth/session - Destroy session (logout)', () => {
    
    test('should logout and destroy session with 204', async ({ request }) => {
      // First, create a session
      const createResponse = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': config.headers.authorizationProvider,
          'Device-ID': config.headers.deviceId,
          'host': config.headers.host,
          'Authorization': `Basic ${config.auth.basicToken}`,
        },
      });

      const body = await createResponse.json();
      const sessionToken = body.token;

      // Now delete the session
      const deleteResponse = await request.delete('/auth/session', {
        headers: {
          'Authorization': sessionToken,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Application-Key': config.headers.applicationKey,
        },
      });

      // Verify status code is 204
      expect(deleteResponse.status()).toBe(204);

      // Verify response body is empty (204 No Content should have no body)
      const deleteResponseText = await deleteResponse.text();
      expectSchema(deleteResponseText, emptyResponseSchema);

      // Verify session is actually destroyed by trying to use it
      const verifyResponse = await request.get('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': sessionToken,
        },
      });

      // Should return 401 since session is destroyed
      expect(verifyResponse.status()).toBe(401);
    });

    test('should return 401 when deleting without token', async ({ request }) => {
      const response = await request.delete('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
        },
      });

      expect([401, 403]).toContain(response.status());
    });
  });

  test.describe('GET /auth/settings/logins - Login Management', () => {
    let managementToken: string;

    test.beforeEach(async ({ request }) => {
      // Create session for login management tests
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
      managementToken = body.token;
    });

    test('should list active logins for current user', async ({ request }) => {
      const response = await request.get('/auth/settings/logins', {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': managementToken,
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, loginsArraySchema);

      // If there are logins, verify they have required properties
      if (responseBody.length > 0) {
        const login = responseBody[0];
        expect(login).toHaveProperty('key');
        expect(login.key).toBeTruthy();
        expect(login).toHaveProperty('type');
        expect(['session', 'prime_token']).toContain(login.type);
      }
    });

    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/auth/settings/logins', {
        headers: {
          'Application-Key': config.headers.applicationKey,
        },
      });

      expect(response.status()).toBe(401);
    });
  });

});
