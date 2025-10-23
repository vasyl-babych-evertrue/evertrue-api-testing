import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { 
  schoolDivisionDepartmentSchema,
  schoolDivisionDepartmentsListSchema
} from '../../schemas/auth.schemas';

/**
 * Auth API Tests - School Division Departments (Positive Tests)
 * Based on documentation: School Division Departments endpoints
 * 
 * School Division Departments are used by affiliation attributes to group users 
 * into departments at the organization (e.g., Department of Computer Science).
 * Mostly used for reporting in Mixpanel.
 * 
 * Test User: Super Admin (vasyl.babych@evertrue.com)
 */
test.describe.serial('Auth API - School Division Departments (Positive Tests)', () => {
  let authToken: string;
  let createdDepartmentId: number;
  const testOrgId = 463; // Swan organization

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin credentials
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
      },
    });

    const body = await response.json();
    authToken = body.token;
  });

  test.describe('GET /auth/school_division_departments - List departments', () => {
    test('should get list of school division departments with valid token and return 200', async ({ request }) => {
      const response = await request.get(`/auth/school_division_departments?oid=${testOrgId}`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      console.log('School Division Departments List Response:', JSON.stringify(body, null, 2));

      // Validate response schema
      expectSchema(body, schoolDivisionDepartmentsListSchema);

      // Validate structure
      expect(Array.isArray(body)).toBe(true);

      // If there are departments, validate first item structure
      if (body.length > 0) {
        const firstDept = body[0];
        expect(firstDept).toHaveProperty('id');
        expect(firstDept).toHaveProperty('value');
        expect(firstDept).toHaveProperty('organization');
        
        // Validate data types
        expect(typeof firstDept.id).toBe('number');
        expect(typeof firstDept.value).toBe('string');
        expect(typeof firstDept.organization).toBe('object');
        
        // Note: GET list doesn't include created_at/updated_at
      }
    });

    test('should return empty array when no departments exist', async ({ request }) => {
      // This test validates the response structure even if empty
      const response = await request.get(`/auth/school_division_departments?oid=${testOrgId}`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      
      // Validate response schema
      expectSchema(body, schoolDivisionDepartmentsListSchema);
      
      // Should be an array
      expect(Array.isArray(body)).toBe(true);
    });
  });

  test.describe('POST /auth/school_division_departments - Create department', () => {
    test('should create school division department with valid data and return 201', async ({ request }) => {
      const departmentData = {
        value: `Test Department ${Date.now()}`
      };

      const response = await request.post(`/auth/school_division_departments?oid=${testOrgId}`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: departmentData
      });

      console.log('POST Response Status:', response.status());
      if (response.status() !== 201) {
        const errorBody = await response.text();
        console.log('POST Error Response:', errorBody);
      }

      expect(response.status()).toBe(201);

      const body = await response.json();
      console.log('School Division Department Create Response:', JSON.stringify(body, null, 2));

      // Validate response schema
      expectSchema(body, schoolDivisionDepartmentSchema);

      // Validate response data
      expect(body).toHaveProperty('id');
      expect(typeof body.id).toBe('number');
      expect(body.value).toBe(departmentData.value);
      expect(body).toHaveProperty('organization');
      
      // Note: POST response doesn't include created_at/updated_at

      // Store created ID for subsequent tests
      createdDepartmentId = body.id;
    });
  });

  test.describe('GET /auth/school_division_departments/:id - Get department by ID', () => {
    test('should get school division department by ID with valid token and return 200', async ({ request }) => {
      // Use the created department ID from POST test
      const departmentId = createdDepartmentId;

      const response = await request.get(`/auth/school_division_departments/${departmentId}?oid=${testOrgId}`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      console.log('School Division Department by ID Response:', JSON.stringify(body, null, 2));

      // Validate response schema
      expectSchema(body, schoolDivisionDepartmentSchema);

      // Validate structure
      expect(body).toHaveProperty('id');
      expect(body.id).toBe(departmentId);
      expect(body).toHaveProperty('value');
      expect(body).toHaveProperty('organization');
      
      // Note: GET by ID also doesn't include created_at/updated_at
    });
  });

  test.describe('PATCH /auth/school_division_departments/:id - Update department', () => {
    test('should update school division department value and return 204', async ({ request }) => {
      // Use the created department ID from POST test
      const departmentId = createdDepartmentId;

      const updateData = {
        value: `Updated Department ${Date.now()}`
      };

      const response = await request.patch(`/auth/school_division_departments/${departmentId}?oid=${testOrgId}`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: updateData
      });

      expect(response.status()).toBe(204);
      console.log('School Division Department PATCH Response Status:', response.status());
      
      // Note: PATCH returns 204 No Content (no response body)
    });
  });

  test.describe('PUT /auth/school_division_departments/:id - Update department (PUT)', () => {
    test('should update school division department using PUT and return 204', async ({ request }) => {
      // Use the created department ID from POST test
      const departmentId = createdDepartmentId;

      const updateData = {
        value: `PUT Updated Department ${Date.now()}`
      };

      const response = await request.put(`/auth/school_division_departments/${departmentId}?oid=${testOrgId}`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: updateData
      });

      expect(response.status()).toBe(204);
      console.log('School Division Department PUT Response Status:', response.status());
      
      // Note: PUT returns 204 No Content (no response body)
    });
  });

  test.describe('DELETE /auth/school_division_departments/:id - Delete department', () => {
    test('should delete school division department by ID and return 204', async ({ request }) => {
      // Use the created department ID from POST test
      const departmentId = createdDepartmentId;

      const response = await request.delete(`/auth/school_division_departments/${departmentId}?oid=${testOrgId}`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(204);
      console.log('School Division Department Delete Response Status:', response.status());
    });

    test('should verify department is deleted and not retrievable', async ({ request }) => {
      // Try to get the deleted department - should fail
      const departmentId = createdDepartmentId;

      const response = await request.get(`/auth/school_division_departments/${departmentId}?oid=${testOrgId}`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Should return 404 Not Found
      expect(response.status()).toBe(404);
      console.log('Verified department is deleted, status:', response.status());
    });
  });
});
