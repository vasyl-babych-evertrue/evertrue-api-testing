import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { integrationSchema, integrationsArraySchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Integrations (Positive Tests)
 * 
 * Endpoints:
 * - GET /auth/integrations - Get all integrations for organization
 * - GET /auth/integrations/{id} - Get integration by id
 * - POST /auth/integrations - Create integration
 * - PUT /auth/integrations/{id} - Update integration
 * - DELETE /auth/integrations/{id} - Delete integration
 */
test.describe.configure({ mode: 'serial' });

test.describe('Auth API - Integrations (Positive Tests)', () => {
  let authToken: string;
  const testOid = '463'; // GivingTree organization

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

  test('should get all integrations for organization and return 200', async ({ request }) => {
    const response = await request.get('/auth/integrations', {
      params: {
        oid: testOid,
      },
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
    expectSchema(responseBody, integrationsArraySchema);

    console.log('✓ Retrieved integrations for organization:', testOid);
  });

  test('should create integration and return 201', async ({ request }) => {
    const response = await request.post('/auth/integrations', {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
      data: {
        integration: {
          platform: 'blackbaud_renxt',
          account_id: null,
          authentication: {
            refresh_token: `test_refresh_${Date.now()}`,
            refresh_token_expires_on: Date.now() + 31536000000, // 1 year
            access_token: `test_access_${Date.now()}`,
            access_token_expires_on: Date.now() + 3600000, // 1 hour
            user_id: `test_user_${Date.now()}`,
            email: `test.${Date.now()}@example.com`,
          },
        },
      },
    });

    // Verify status code is 201
    expect(response.status()).toBe(201);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, integrationSchema);

    // Verify created integration fields
    expect(responseBody.platform).toBe('blackbaud_renxt');
    expect(responseBody.organization_id).toBe(parseInt(testOid));

    const integrationId = responseBody.id;

    // Cleanup: Delete created integration
    await request.delete(`/auth/integrations/${integrationId}`, {
      params: { oid: testOid },
      headers: {
        'Accept': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
    });

    console.log('✓ Created integration:', integrationId);
  });

  test('should get integration by id and return 200', async ({ request }) => {
    // First create an integration
    const createResponse = await request.post('/auth/integrations', {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
      data: {
        integration: {
          platform: 'blackbaud_renxt',
          account_id: null,
          authentication: {
            refresh_token: `test_refresh_${Date.now()}`,
            refresh_token_expires_on: Date.now() + 31536000000,
            access_token: `test_access_${Date.now()}`,
            access_token_expires_on: Date.now() + 3600000,
            user_id: `test_user_${Date.now()}`,
            email: `test.${Date.now()}@example.com`,
          },
        },
      },
    });

    const createdIntegration = await createResponse.json();
    const integrationId = createdIntegration.id;

    // Now get the integration by id
    const response = await request.get(`/auth/integrations/${integrationId}`, {
      params: {
        oid: testOid,
      },
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
    expectSchema(responseBody, integrationSchema);

    // Verify retrieved integration
    expect(responseBody.id).toBe(integrationId);
    expect(responseBody.platform).toBe('blackbaud_renxt');

    // Cleanup: Delete created integration
    await request.delete(`/auth/integrations/${integrationId}`, {
      params: { oid: testOid },
      headers: {
        'Accept': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
    });

    console.log('✓ Retrieved integration by id:', integrationId);
  });

  test('should update integration and return 204', async ({ request }) => {
    // First create an integration
    const createResponse = await request.post('/auth/integrations', {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
      data: {
        integration: {
          platform: 'blackbaud_renxt',
          account_id: null,
          authentication: {
            refresh_token: `test_refresh_${Date.now()}`,
            refresh_token_expires_on: Date.now() + 31536000000,
            access_token: `test_access_${Date.now()}`,
            access_token_expires_on: Date.now() + 3600000,
            user_id: `test_user_${Date.now()}`,
            email: `test.${Date.now()}@example.com`,
          },
        },
      },
    });

    const createdIntegration = await createResponse.json();
    const integrationId = createdIntegration.id;

    // Now update the integration
    const newRefreshToken = `updated_refresh_${Date.now()}`;
    const response = await request.put(`/auth/integrations/${integrationId}`, {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
      data: {
        integration: {
          platform: 'blackbaud_renxt',
          account_id: null,
          authentication: {
            refresh_token: newRefreshToken,
            refresh_token_expires_on: Date.now() + 31536000000,
            access_token: `updated_access_${Date.now()}`,
            access_token_expires_on: Date.now() + 3600000,
            user_id: `updated_user_${Date.now()}`,
            email: `updated.${Date.now()}@example.com`,
          },
        },
      },
    });

    // Verify status code is 204 (No Content)
    expect(response.status()).toBe(204);

    // Cleanup: Delete updated integration
    await request.delete(`/auth/integrations/${integrationId}`, {
      params: { oid: testOid },
      headers: {
        'Accept': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
    });

    console.log('✓ Updated integration:', integrationId);
  });

  test('should delete integration and return 204', async ({ request }) => {
    // First create an integration
    const createResponse = await request.post('/auth/integrations', {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
      data: {
        integration: {
          platform: 'blackbaud_renxt',
          account_id: null,
          authentication: {
            refresh_token: `test_refresh_${Date.now()}`,
            refresh_token_expires_on: Date.now() + 31536000000,
            access_token: `test_access_${Date.now()}`,
            access_token_expires_on: Date.now() + 3600000,
            user_id: `test_user_${Date.now()}`,
            email: `test.${Date.now()}@example.com`,
          },
        },
      },
    });

    const createdIntegration = await createResponse.json();
    const integrationId = createdIntegration.id;

    // Now delete the integration
    const response = await request.delete(`/auth/integrations/${integrationId}`, {
      params: {
        oid: testOid,
      },
      headers: {
        'Accept': 'application/json',
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
        'Application-Key': getAppKey('volunteers_api'),
        'host': config.headers.host,
      },
    });

    // Verify status code is 204
    expect(response.status()).toBe(204);

    console.log('✓ Deleted integration:', integrationId);
  });
});
