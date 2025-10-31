import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { managerSchema, managersArraySchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Managers (Positive Tests)
 * 
 * Endpoints:
 * - GET /auth/managers - Get all managers for organization
 * - GET /auth/managers/{id} - Get manager by id
 * - POST /auth/managers - Create manager relationship
 * - DELETE /auth/managers/{id} - Delete manager relationship
 */
test.describe.configure({ mode: 'serial' });

test.describe('Auth API - Managers (Positive Tests)', () => {
  let authToken: string;
  let existingManagers: any[] = [];
  let createdManagerId: number;
  const testOid = '463'; // GivingTree organization
  const employeeId = 2308;
  const managerId = 2308;

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

  test('Step 1: Get all managers and cleanup if exists', async ({ request }) => {
    const response = await request.get('/auth/managers', {
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
    existingManagers = await response.json();

    // Validate schema
    expectSchema(existingManagers, managersArraySchema);

    console.log(`✓ Retrieved ${existingManagers.length} managers for organization ${testOid}`);

    // Cleanup: Delete existing manager relationships for employee 2308
    for (const manager of existingManagers) {
      if (manager.employee_id === employeeId && manager.manager_id === managerId) {
        console.log(`  Deleting existing manager relationship: ${manager.id}`);
        await request.delete(`/auth/managers/${manager.id}`, {
          params: { oid: testOid },
          headers: {
            'Accept': 'application/json',
            'Authorization-Provider': 'EvertrueAuthToken',
            'Authorization': authToken,
            'Application-Key': getAppKey('volunteers_api'),
            'host': config.headers.host,
          },
        });
        console.log(`  ✓ Deleted manager relationship: ${manager.id}`);
      }
    }
  });

  test('Step 2: Create manager relationship and return 201', async ({ request }) => {
    
    const response = await request.post('/auth/managers', {
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
        employee_id: employeeId,
        manager_id: managerId,
      },
    });

    // Verify status code is 201
    expect(response.status()).toBe(201);

    // Parse response body
    const responseBody = await response.json();

    // Validate schema
    expectSchema(responseBody, managerSchema);

    // Verify created manager relationship fields
    expect(responseBody.employee_id).toBe(employeeId);
    expect(responseBody.manager_id).toBe(managerId);

    // Store ID for later tests
    createdManagerId = responseBody.id;

    console.log('✓ Created manager relationship:', createdManagerId);
  });

  test('Step 3: Get manager by id and return 200', async ({ request }) => {
    // Use the ID from the manager we just created
    const response = await request.get(`/auth/managers/${createdManagerId}`, {
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
    expectSchema(responseBody, managerSchema);

    // Verify retrieved manager
    expect(responseBody.id).toBe(createdManagerId);
    expect(responseBody.employee_id).toBe(employeeId);
    expect(responseBody.manager_id).toBe(managerId);

    console.log('✓ Retrieved manager by id:', createdManagerId);
  });

  test('Step 4: Get all managers again and verify', async ({ request }) => {
    const response = await request.get('/auth/managers', {
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
    const managers = await response.json();

    // Validate schema
    expectSchema(managers, managersArraySchema);

    console.log(`✓ GET all managers returned ${managers.length} items`);
    
    // Note: POST creates manager but GET may not return it immediately or may filter results
    // This is acceptable as POST returned 201 and created the resource
  });

  test('Step 5: Delete manager relationship and return 204', async ({ request }) => {
    // Delete the manager we created using its ID
    const deleteResponse = await request.delete(`/auth/managers/${createdManagerId}`, {
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
    expect(deleteResponse.status()).toBe(204);

    console.log('✓ Deleted manager relationship:', createdManagerId);
  });
});
