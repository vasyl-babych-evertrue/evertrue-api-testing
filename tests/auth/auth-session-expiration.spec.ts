import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { createTemporarySessionSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Session Expiration and Timeout
 * Tests for session lifecycle, expiration, and temporary tokens
 */
test.describe('Auth API - Session Expiration Tests', () => {
  test('should have expire_at field in session response', async ({ request }) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Device-ID': config.headers.deviceId,
        host: config.headers.host,
        Authorization: `Basic ${config.auth.superAdminToken}`,
      },
    });

    const responseBody = await response.json();

    // Verify expire_at is present and in the future
    expect(responseBody.expire_at).toBeTruthy();
    const expireAt = new Date(responseBody.expire_at);
    const now = new Date();
    expect(expireAt.getTime()).toBeGreaterThan(now.getTime());
  });

  test('should create temporary token with short expiration', async ({ request }) => {
    // First create a base session
    const baseResponse = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Device-ID': config.headers.deviceId,
        host: config.headers.host,
        Authorization: `Basic ${config.auth.superAdminToken}`,
      },
    });

    const baseBody = await baseResponse.json();
    const baseToken = baseBody.token;

    // Create temporary token
    const tempResponse = await request.post('/auth/session', {
      headers: {
        'Application-Key': getAppKey('console'),
        'Authorization-Provider': 'EvertrueTemporaryTokenStrategy',
        'Content-Type': 'application/json',
        Authorization: baseToken,
      },
      data: {
        type: 'SCOPED',
        oid: 463,
      },
    });

    const tempBody = await tempResponse.json();

    // Verify short expiration (5 minutes default)
    const expireAt = new Date(tempBody.expire_at);
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    expect(expireAt.getTime()).toBeGreaterThan(now.getTime());
    expect(expireAt.getTime()).toBeLessThan(tenMinutesFromNow.getTime());
  });

  test('should reject expired session token', async ({ request }) => {
    // This test would ideally use a pre-expired token
    // For now, we test with an obviously invalid/expired format
    const response = await request.get('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'EvertrueAuthToken',
        Authorization: 'expired_token_12345',
      },
    });

    expect(response.status()).toBe(401);
  });

  test.describe('Temporary Token Strategy', () => {
    let baseToken: string;

    test.beforeEach(async ({ request }) => {
      // Create base session
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': config.headers.authorizationProvider,
          'Device-ID': config.headers.deviceId,
          host: config.headers.host,
          Authorization: `Basic ${config.auth.superAdminToken}`,
        },
      });

      const body = await response.json();
      baseToken = body.token;
    });

    test('should create temporary scoped session', async ({ request }) => {
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': getAppKey('console'),
          'Authorization-Provider': 'EvertrueTemporaryTokenStrategy',
          'Content-Type': 'application/json',
          Authorization: baseToken,
        },
        data: {
          type: 'SCOPED',
          oid: 463,
        },
      });

      // Verify status code is 201
      expect(response.status()).toBe(201);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, createTemporarySessionSchema);

      // Verify temporary session properties
      expect(responseBody.type).toBe('SCOPED');
      expect(responseBody.oid).toBe(463);
      expect(responseBody.token).toBeTruthy();
      expect(responseBody.expire_at).toBeTruthy();

      // Verify expiration is in the future but short-lived (default 5 minutes)
      const expireAt = new Date(responseBody.expire_at);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      expect(expireAt.getTime()).toBeGreaterThan(now.getTime());
      expect(expireAt.getTime()).toBeLessThanOrEqual(fiveMinutesFromNow.getTime());
    });

    test('should return 401 with invalid base token for temporary strategy', async ({ request }) => {
      const response = await request.post('/auth/session', {
        headers: {
          'Application-Key': getAppKey('console'),
          'Authorization-Provider': 'EvertrueTemporaryTokenStrategy',
          'Content-Type': 'application/json',
          Authorization: 'invalid_base_token',
        },
        data: {
          type: 'SCOPED',
          oid: 463,
        },
      });

      expect(response.status()).toBe(401);
    });
  });
});
