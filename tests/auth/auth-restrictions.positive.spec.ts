import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { restrictionSchema, restrictionsArraySchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Restrictions (Positive Tests)
 * 
 * Endpoints:
 * - GET /auth/restrictions - Get all restrictions for organization
 * - GET /auth/restrictions/{id} - Get restriction by id
 * - POST /auth/restrictions - Create restriction
 * - PUT /auth/restrictions/{id} - Update restriction
 * - DELETE /auth/restrictions/{id} - Delete restriction (super user only)
 */
test.describe.configure({ mode: 'serial' });

test.describe('Auth API - Restrictions (Positive Tests)', () => {
  let authToken: string;
  let createdRestrictionId: number;
  const testOid = '463'; // GivingTree organization
  const testIdentityProviderId = 10;

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

  test('Step 1: Get all restrictions and cleanup if exists', async ({ request }) => {
    const response = await request.get('/auth/restrictions', {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('givingtree'),
        'host': config.headers.host,
      },
    });

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, restrictionsArraySchema);

    console.log(`✓ Retrieved ${responseBody.length} restrictions for organization ${testOid}`);

    // Cleanup: Delete existing restrictions with our test identity_provider_id
    for (const restriction of responseBody) {
      if (restriction.identity_provider_id === testIdentityProviderId) {
        console.log(`  Deleting existing restriction: ${restriction.id}`);
        await request.delete(`/auth/restrictions/${restriction.id}`, {
          params: { oid: testOid },
          headers: {
            'Accept': 'application/json',
            'Authorization-Provider': 'EvertrueAuthToken',
            'Authorization': authToken,
            'Application-Key': getAppKey('givingtree'),
            'host': config.headers.host,
          },
        });
        console.log(`  ✓ Deleted restriction: ${restriction.id}`);
      }
    }
  });

  test('Step 2: Create restriction for organization and return 200', async ({ request }) => {
    const response = await request.post('/auth/restrictions', {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('givingtree'),
        'host': config.headers.host,
      },
      data: {
        restriction: {
          type: 'SsoRestriction',
          identity_provider_id: testIdentityProviderId,
        },
      },
    });

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, restrictionSchema);

    // Verify created restriction fields
    expect(responseBody.type).toBe('SsoRestriction');
    expect(responseBody.identity_provider_id).toBe(testIdentityProviderId);
    expect(responseBody.organization_id).toBe(parseInt(testOid));

    // Store ID for later tests
    createdRestrictionId = responseBody.id;

    console.log('✓ Created restriction:', createdRestrictionId);
  });

  test('Step 3: Get restriction by id and return 200', async ({ request }) => {
    // Use the ID from the restriction we just created
    const response = await request.get(`/auth/restrictions/${createdRestrictionId}`, {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('givingtree'),
        'host': config.headers.host,
      },
    });

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, restrictionSchema);

    // Verify retrieved restriction
    expect(responseBody.id).toBe(createdRestrictionId);
    expect(responseBody.type).toBe('SsoRestriction');
    expect(responseBody.identity_provider_id).toBe(testIdentityProviderId);

    console.log('✓ Retrieved restriction by id:', createdRestrictionId);
  });

  test('Step 4: Update restriction and return 200', async ({ request }) => {
    // Update the restriction we created
    const response = await request.put(`/auth/restrictions/${createdRestrictionId}`, {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('givingtree'),
        'host': config.headers.host,
      },
      data: {
        restriction: {
          type: 'SsoRestriction',
          identity_provider_id: 12,
        },
      },
    });

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, restrictionSchema);

    // Verify updated restriction
    expect(responseBody.id).toBe(createdRestrictionId);
    expect(responseBody.identity_provider_id).toBe(12);
    expect(responseBody.type).toBe('SsoRestriction');

    console.log('✓ Updated restriction:', createdRestrictionId);
  });

  test('Step 5: Delete restriction and return 204', async ({ request }) => {
    // Delete the restriction we created and updated
    const response = await request.delete(`/auth/restrictions/${createdRestrictionId}`, {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('givingtree'),
        'host': config.headers.host,
      },
    });

    // Verify status code is 204
    expect(response.status()).toBe(204);

    console.log('✓ Deleted restriction:', createdRestrictionId);
  });
});
