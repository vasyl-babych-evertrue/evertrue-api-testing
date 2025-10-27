import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey, getAppToken } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { applicationsListSchema, statusSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Applications Management
 * Based on Postman collection: oauth -> Applications
 *
 * Test User:
 * - Super Admin: vasyl.babych@evertrue.com (required for applications endpoints)
 */
test.describe('Auth API - Applications Management', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Create session with super-admin credentials
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        Authorization: `Basic ${config.auth.superAdminToken}`,
      },
    });

    const body = await response.json();
    authToken = body.token;
  });

  test.describe('GET /auth/status - Verify authentication', () => {
    test('should verify auth status with app token and return 200', async ({ request }) => {
      const response = await request.get('/auth/status', {
        params: {
          oid: '1',
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Application-Key': getAppKey('auth_api'),
          'Authorization-Provider': 'EvertrueAppToken',
          Authorization: getAppToken('auth_api'),
          'ET-Update-Source': 'csv_importer',
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, statusSchema);

      // Verify status is ok
      expect(responseBody.status).toBe('ok');
    });
  });

  test.describe('GET /auth/applications - List all applications (super-admin only)', () => {
    test('should get list of all auth applications with super-admin token', async ({ request }) => {
      const response = await request.get('/auth/applications', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Application-Key': getAppKey('auth_api'),
          'Authorization-Provider': 'EvertrueAppToken',
          Authorization: getAppToken('auth_api'),
          'ET-Update-Source': 'csv_importer',
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, applicationsListSchema);

      // Verify response is an array
      expect(Array.isArray(responseBody)).toBe(true);

      // Verify applications have required fields
      if (responseBody.length > 0) {
        const firstApp = responseBody[0];
        expect(firstApp.id).toBeDefined();
        expect(firstApp.name).toBeDefined();
        expect(firstApp.key).toBeDefined();
        expect(firstApp.created_at).toBeDefined();
        expect(firstApp.updated_at).toBeDefined();
      }
    });

    test('should verify applications list contains expected applications', async ({ request }) => {
      const response = await request.get('/auth/applications', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Application-Key': getAppKey('auth_api'),
          'Authorization-Provider': 'EvertrueAppToken',
          Authorization: getAppToken('auth_api'),
          'ET-Update-Source': 'csv_importer',
        },
      });

      expect(response.status()).toBe(200);

      const responseBody = await response.json();

      // Verify response is not empty
      expect(responseBody.length).toBeGreaterThan(0);

      // Log all application names for debugging
      console.log(
        'Available applications:',
        responseBody.map((app: any) => app.name)
      );

      // Verify each application has valid structure
      responseBody.forEach((app: any) => {
        expect(app.id).toBeGreaterThan(0);
        expect(app.name).toBeTruthy();
        expect(app.key).toBeTruthy();
        expect(app.created_at).toBeGreaterThan(0);
        expect(app.updated_at).toBeGreaterThan(0);
      });
    });
  });
});
