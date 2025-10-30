import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { versionSchema, versionsResponseSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Versions (Positive Tests)
 * 
 * Endpoints:
 * - GET /auth/versions - Get all versions (audit log)
 * - GET /auth/versions/{id} - Get version by id
 */
test.describe.configure({ mode: 'serial' });

test.describe('Auth API - Versions (Positive Tests)', () => {
  let authToken: string;
  let versionId: number;

  test.beforeAll(async ({ request }) => {
    // Create session with super admin token
    const sessionResponse = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
        'host': config.headers.host,
      },
    });

    const sessionBody = await sessionResponse.json();
    authToken = sessionBody.token;
  });

  test('Step 1: Get all versions and return 200', async ({ request }) => {
    const response = await request.get('/auth/versions', {
      headers: {
        'Accept': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
    });

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, versionsResponseSchema);

    console.log(`✓ Retrieved ${responseBody.versions.length} versions`);

    // Store first version ID for next test
    if (responseBody.versions.length > 0) {
      versionId = responseBody.versions[0].id;
    }
  });

  test('Step 2: Get version by id and return 200', async ({ request }) => {
    // Skip if no versions found
    if (!versionId) {
      console.log('⚠ No versions found, skipping GET by ID test');
      return;
    }

    const response = await request.get(`/auth/versions/${versionId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
    });

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, versionSchema);

    // Verify retrieved version
    expect(responseBody.id).toBe(versionId);

    console.log('✓ Retrieved version by id:', versionId);
  });
});
