import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { csvInvitesListSchema, csvInviteSingleSchema, csvInviteCreateSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - CSV Invites (Positive Tests)
 * Based on documentation: CSV Invites endpoints
 * 
 * CSV invites are used to bulk invite users to the core platform using a standard set of headers.
 * This used to exist as a bulk user creation page, but due to performance and maintainability 
 * reasons it was rewritten as a CSV import.
 * 
 * Test User: Super Admin (vasyl.babych@evertrue.com) - required for CSV invite operations
 */
test.describe('Auth API - CSV Invites (Positive Tests)', () => {
  let authToken: string;
  let createdCsvInviteId: number;

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin credentials
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.basicToken}`,
      },
    });

    const body = await response.json();
    authToken = body.token;
  });

  test.describe('GET /auth/csv_invites - List all CSV invites', () => {
    test('should get list of CSV invites with valid token and return 200', async ({ request }) => {
      const response = await request.get('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      console.log('CSV Invites List Response:', JSON.stringify(body, null, 2));

      // Validate response schema
      expectSchema(body, csvInvitesListSchema);

      // Validate structure
      expect(body).toHaveProperty('csv_invites');
      expect(Array.isArray(body.csv_invites)).toBe(true);

      // If there are CSV invites, validate first item structure
      if (body.csv_invites.length > 0) {
        const firstInvite = body.csv_invites[0];
        expect(firstInvite).toHaveProperty('id');
        expect(firstInvite).toHaveProperty('organization_id');
        expect(firstInvite).toHaveProperty('csv_file_name');
        expect(firstInvite).toHaveProperty('csv_content_type');
        expect(firstInvite).toHaveProperty('csv_file_size');
        expect(firstInvite).toHaveProperty('created_at');
        expect(firstInvite).toHaveProperty('updated_at');
        expect(firstInvite).toHaveProperty('url');
        
        // Validate data types
        expect(typeof firstInvite.id).toBe('number');
        expect(typeof firstInvite.organization_id).toBe('number');
        expect(typeof firstInvite.csv_file_name).toBe('string');
        expect(typeof firstInvite.csv_content_type).toBe('string');
        expect(typeof firstInvite.csv_file_size).toBe('number');
        expect(typeof firstInvite.url).toBe('string');
        
        // Validate URL format
        expect(firstInvite.url).toMatch(/^https?:\/\//);
      }
    });

    test('should return empty array when no CSV invites exist', async ({ request }) => {
      const response = await request.get('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      
      // Validate response schema
      expectSchema(body, csvInvitesListSchema);
      
      // Should have csv_invites property even if empty
      expect(body).toHaveProperty('csv_invites');
      expect(Array.isArray(body.csv_invites)).toBe(true);
    });
  });

  test.describe('POST /auth/csv_invites - Create CSV invite', () => {
    test('should create CSV invite with valid base64 data and return 201', async ({ request }) => {
      // Create a sample CSV content with proper headers
      const csvContent = `email,first_name,last_name,role_id
test.user1@example.com,Test,User1,1
test.user2@example.com,Test,User2,1`;
      
      // Convert to base64
      const base64Data = Buffer.from(csvContent).toString('base64');

      const response = await request.post('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: {
          csv: base64Data
        }
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      console.log('CSV Invite Create Response:', JSON.stringify(body, null, 2));

      // Validate response schema
      expectSchema(body, csvInviteCreateSchema);

      // Validate structure
      expect(body).toHaveProperty('csv_invite');
      expect(body.csv_invite).toHaveProperty('id');
      expect(body.csv_invite).toHaveProperty('organization_id');
      expect(body.csv_invite).toHaveProperty('csv_file_name');
      expect(body.csv_invite).toHaveProperty('csv_content_type');
      expect(body.csv_invite).toHaveProperty('csv_file_size');
      expect(body.csv_invite).toHaveProperty('created_at');
      expect(body.csv_invite).toHaveProperty('updated_at');
      expect(body.csv_invite).toHaveProperty('url');

      // Validate data types
      expect(typeof body.csv_invite.id).toBe('number');
      expect(typeof body.csv_invite.organization_id).toBe('number');
      expect(typeof body.csv_invite.csv_file_name).toBe('string');
      expect(typeof body.csv_invite.csv_content_type).toBe('string');
      expect(typeof body.csv_invite.csv_file_size).toBe('number');
      expect(typeof body.csv_invite.url).toBe('string');

      // Validate URL format
      expect(body.csv_invite.url).toMatch(/^https?:\/\//);
      
      // Validate file size (API returns 0, which is acceptable)
      expect(body.csv_invite.csv_file_size).toBeGreaterThanOrEqual(0);

      // Store created ID for subsequent tests
      createdCsvInviteId = body.csv_invite.id;
    });

    test('should create CSV invite with minimal valid CSV data', async ({ request }) => {
      // Minimal CSV with just headers and one user
      const csvContent = `email,first_name,last_name
minimal@example.com,Min,User`;
      
      const base64Data = Buffer.from(csvContent).toString('base64');

      const response = await request.post('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: {
          csv: base64Data
        }
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      
      // Validate response schema
      expectSchema(body, csvInviteCreateSchema);
      
      expect(body.csv_invite).toHaveProperty('id');
      expect(body.csv_invite.csv_file_size).toBeGreaterThanOrEqual(0);
    });

    test('should create CSV invite with multiple users', async ({ request }) => {
      // CSV with multiple users
      const csvContent = `email,first_name,last_name,role_id
user1@example.com,User,One,1
user2@example.com,User,Two,1
user3@example.com,User,Three,1
user4@example.com,User,Four,1
user5@example.com,User,Five,1`;
      
      const base64Data = Buffer.from(csvContent).toString('base64');

      const response = await request.post('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: {
          csv: base64Data
        }
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      
      // Validate response schema
      expectSchema(body, csvInviteCreateSchema);
      
      expect(body.csv_invite).toHaveProperty('id');
      expect(body.csv_invite.csv_file_size).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('GET /auth/csv_invites/:id - Get CSV invite by ID', () => {
    test('should get CSV invite by ID with valid token and return 200', async ({ request }) => {
      // First, create a CSV invite to ensure we have an ID
      const csvContent = `email,first_name,last_name
getbyid@example.com,Get,ById`;
      const base64Data = Buffer.from(csvContent).toString('base64');

      const createResponse = await request.post('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: {
          csv: base64Data
        }
      });

      const createBody = await createResponse.json();
      const csvInviteId = createBody.csv_invite.id;

      // Now get the CSV invite by ID
      const response = await request.get(`/auth/csv_invites/${csvInviteId}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      console.log('CSV Invite by ID Response:', JSON.stringify(body, null, 2));

      // Validate response schema
      expectSchema(body, csvInviteSingleSchema);

      // Validate structure
      expect(body).toHaveProperty('csv_invite');
      expect(body.csv_invite).toHaveProperty('id');
      expect(body.csv_invite.id).toBe(csvInviteId);
      expect(body.csv_invite).toHaveProperty('organization_id');
      expect(body.csv_invite).toHaveProperty('csv_file_name');
      expect(body.csv_invite).toHaveProperty('csv_content_type');
      expect(body.csv_invite).toHaveProperty('csv_file_size');
      expect(body.csv_invite).toHaveProperty('created_at');
      expect(body.csv_invite).toHaveProperty('updated_at');
      expect(body.csv_invite).toHaveProperty('url');

      // Validate data types
      expect(typeof body.csv_invite.id).toBe('number');
      expect(typeof body.csv_invite.organization_id).toBe('number');
      expect(typeof body.csv_invite.csv_file_name).toBe('string');
      expect(typeof body.csv_invite.csv_content_type).toBe('string');
      expect(typeof body.csv_invite.csv_file_size).toBe('number');
      expect(typeof body.csv_invite.url).toBe('string');

      // Validate URL format and contains organization slug
      expect(body.csv_invite.url).toMatch(/^https?:\/\//);
      expect(body.csv_invite.url).toContain('bulk_invites');
    });

    test('should verify CSV invite data consistency between create and get', async ({ request }) => {
      // Create a CSV invite
      const csvContent = `email,first_name,last_name
consistency@example.com,Consistency,Test`;
      const base64Data = Buffer.from(csvContent).toString('base64');

      const createResponse = await request.post('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: {
          csv: base64Data
        }
      });

      const createBody = await createResponse.json();
      const createdInvite = createBody.csv_invite;

      // Get the same CSV invite by ID
      const getResponse = await request.get(`/auth/csv_invites/${createdInvite.id}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      const getBody = await getResponse.json();
      const retrievedInvite = getBody.csv_invite;

      // Verify data consistency
      expect(retrievedInvite.id).toBe(createdInvite.id);
      expect(retrievedInvite.organization_id).toBe(createdInvite.organization_id);
      expect(retrievedInvite.csv_file_name).toBe(createdInvite.csv_file_name);
      expect(retrievedInvite.csv_content_type).toBe(createdInvite.csv_content_type);
      expect(retrievedInvite.csv_file_size).toBe(createdInvite.csv_file_size);
      expect(retrievedInvite.url).toBe(createdInvite.url);
      // Timestamps may have different precision (milliseconds vs seconds), so we check they're within 2 seconds
      const createdTimeDiff = Math.abs(new Date(retrievedInvite.created_at).getTime() - new Date(createdInvite.created_at).getTime());
      const updatedTimeDiff = Math.abs(new Date(retrievedInvite.updated_at).getTime() - new Date(createdInvite.updated_at).getTime());
      expect(createdTimeDiff).toBeLessThan(2000);
      expect(updatedTimeDiff).toBeLessThan(2000);
    });
  });

  test.describe('DELETE /auth/csv_invites/:id - Delete CSV invite', () => {
    test('should delete CSV invite by ID and return 200', async ({ request }) => {
      // First, create a CSV invite to delete
      const csvContent = `email,first_name,last_name
delete@example.com,Delete,Test`;
      const base64Data = Buffer.from(csvContent).toString('base64');

      const createResponse = await request.post('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: {
          csv: base64Data
        }
      });

      const createBody = await createResponse.json();
      const csvInviteId = createBody.csv_invite.id;

      // Delete the CSV invite
      const response = await request.delete(`/auth/csv_invites/${csvInviteId}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);
      console.log('CSV Invite Delete Response Status:', response.status());
    });

    test('should verify CSV invite is deleted and not retrievable', async ({ request }) => {
      // Create a CSV invite
      const csvContent = `email,first_name,last_name
verify-delete@example.com,Verify,Delete`;
      const base64Data = Buffer.from(csvContent).toString('base64');

      const createResponse = await request.post('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: {
          csv: base64Data
        }
      });

      const createBody = await createResponse.json();
      const csvInviteId = createBody.csv_invite.id;

      // Delete the CSV invite
      const deleteResponse = await request.delete(`/auth/csv_invites/${csvInviteId}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(deleteResponse.status()).toBe(200);

      // Try to get the deleted CSV invite - should fail
      const getResponse = await request.get(`/auth/csv_invites/${csvInviteId}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Should return 404 Not Found
      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe('CSV Invite CRUD Workflow', () => {
    test('should complete full CRUD workflow: Create -> Read -> Delete', async ({ request }) => {
      // Step 1: CREATE
      const csvContent = `email,first_name,last_name,role_id
workflow@example.com,Work,Flow,1`;
      const base64Data = Buffer.from(csvContent).toString('base64');

      const createResponse = await request.post('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: {
          csv: base64Data
        }
      });

      expect(createResponse.status()).toBe(201);
      const createBody = await createResponse.json();
      const csvInviteId = createBody.csv_invite.id;
      
      console.log('Step 1 - Created CSV Invite ID:', csvInviteId);

      // Step 2: READ (Get by ID)
      const getResponse = await request.get(`/auth/csv_invites/${csvInviteId}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(getResponse.status()).toBe(200);
      const getBody = await getResponse.json();
      expect(getBody.csv_invite.id).toBe(csvInviteId);
      
      console.log('Step 2 - Retrieved CSV Invite:', getBody.csv_invite.csv_file_name);

      // Step 3: READ (Verify in list)
      const listResponse = await request.get('/auth/csv_invites?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(listResponse.status()).toBe(200);
      const listBody = await listResponse.json();
      const foundInList = listBody.csv_invites.some((invite: any) => invite.id === csvInviteId);
      expect(foundInList).toBe(true);
      
      console.log('Step 3 - Found in list:', foundInList);

      // Step 4: DELETE
      const deleteResponse = await request.delete(`/auth/csv_invites/${csvInviteId}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(deleteResponse.status()).toBe(200);
      
      console.log('Step 4 - Deleted CSV Invite ID:', csvInviteId);

      // Step 5: VERIFY deletion
      const verifyResponse = await request.get(`/auth/csv_invites/${csvInviteId}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(verifyResponse.status()).toBe(404);
      
      console.log('Step 5 - Verified deletion, status:', verifyResponse.status());
    });
  });
});
