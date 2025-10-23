import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { assignmentTitleSchema, assignmentTitlesResponseSchema } from '../../schemas/teams.schemas';

/**
 * Test Suite: Relationship Management - Assignment Titles
 * 
 * Tests for managing Assignment Titles in the Relationship Management system
 * 
 * Endpoints tested:
 * - GET /assignments-java/v2/assignments/titles - Get list of all titles
 * - POST /assignments-java/v2/assignments/titles - Create a title
 * - PUT /assignments-java/v2/assignments/titles/bulk - Update a title (bulk)
 * - DELETE /assignments-java/v2/assignments/titles/{id} - Delete a title
 */

test.describe.serial('Relationship Management - Assignment Titles', () => {
  let authToken: string;
  const testOrgId = 467;
  let createdTitleId: number;
  let createdTitleData: any;
  const timestamp = Date.now();
  
  // Track all created title IDs for cleanup
  const createdTitleIds: number[] = [];

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
    console.log('✓ Authentication successful');
  });

  test('GET /assignments-java/v2/assignments/titles - Get list of all titles', async ({ request }) => {
    const response = await request.get(
      `/assignments-java/v2/assignments/titles?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nGet Assignment Titles Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Total titles found:', body.total);
    
    // Validate response schema
    expectSchema(body, assignmentTitlesResponseSchema);
    
    if (body.items && body.items.length > 0) {
      console.log('Sample titles:', JSON.stringify(body.items.slice(0, 3).map((title: any) => ({
        id: title.id,
        title: title.title,
        active: title.active,
        sort_order: title.sort_order
      })), null, 2));
    }
  });

  test('POST /assignments-java/v2/assignments/titles - Create a title', async ({ request }) => {
    const titleData = {
      title: `TitleTEST_${timestamp}`,
      active: false,
      sort_order: 2
    };

    const response = await request.post(
      `/assignments-java/v2/assignments/titles?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: titleData
      }
    );

    console.log('\nCreate Assignment Title Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Created Title:', JSON.stringify({
      id: body.id,
      title: body.title,
      active: body.active,
      sort_order: body.sort_order
    }, null, 2));

    // Validate response schema
    expectSchema(body, assignmentTitleSchema);

    // Store created title ID and full data
    createdTitleId = body.id;
    createdTitleData = body;
    createdTitleIds.push(body.id);

    // Validate created title data
    expect(body.title).toBe(titleData.title);
    expect(body.active).toBe(false);
    expect(body.sort_order).toBe(2);
    expect(body.oid).toBe(testOrgId);
    expect(body.deleted).toBe(false);
  });

  test('PUT /assignments-java/v2/assignments/titles/bulk - Update a title', async ({ request }) => {
    if (!createdTitleId || !createdTitleData) {
      throw new Error('Title ID or data not found from previous test');
    }

    // PUT /bulk expects array with full object
    const updateData = [{
      ...createdTitleData,
      title: `Title 1 -upd_${Date.now()}`,
      active: true
    }];

    const response = await request.put(
      `/assignments-java/v2/assignments/titles/bulk?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: updateData
      }
    );

    console.log('\nUpdate Assignment Title Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Updated Title:', JSON.stringify({
      id: body[0].id,
      title: body[0].title,
      active: body[0].active
    }, null, 2));

    // Response is an array
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    // Validate first item schema
    expectSchema(body[0], assignmentTitleSchema);

    expect(body[0].id).toBe(createdTitleId);
    expect(body[0].title).toContain('Title 1 -upd');
    expect(body[0].active).toBe(true);
  });

  test('DELETE /assignments-java/v2/assignments/titles/{id} - Delete a title', async ({ request }) => {
    if (!createdTitleId) {
      throw new Error('Title ID not found from previous test');
    }

    const response = await request.delete(
      `/assignments-java/v2/assignments/titles/${createdTitleId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nDelete Assignment Title Response Status:', response.status());

    // DELETE returns 204 No Content on success
    expect(response.status()).toBe(204);

    const responseText = await response.text();
    console.log('Deleted Title Response:', responseText || '(empty response)');

    console.log(`✓ Title ${createdTitleId} successfully deleted`);
  });

  test('Verify deleted title is not in active list', async ({ request }) => {
    if (!createdTitleId) {
      throw new Error('Title ID not found from previous test');
    }

    const response = await request.get(
      `/assignments-java/v2/assignments/titles?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Check that deleted title is not in items list or is marked as deleted
    const deletedTitle = body.items.find((title: any) => title.id === createdTitleId);
    
    if (deletedTitle && !deletedTitle.deleted) {
      console.log('\n⚠ Deleted title still in active list');
      throw new Error(`Title ${createdTitleId} should not be in active titles list or should be marked as deleted`);
    } else {
      console.log('\n✓ Deleted title not in active titles list');
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete all created titles
    console.log(`\n🧹 Cleanup: Deleting ${createdTitleIds.length} created titles...`);
    
    let deletedCount = 0;
    let failedCount = 0;

    for (const titleId of createdTitleIds) {
      try {
        const response = await request.delete(
          `/assignments-java/v2/assignments/titles/${titleId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status() === 204 || response.status() === 404 || response.status() === 400) {
          deletedCount++;
          console.log(`  ✓ Deleted title ${titleId}`);
        } else {
          failedCount++;
          console.log(`  ✗ Failed to delete title ${titleId} (status: ${response.status()})`);
        }
      } catch (error) {
        failedCount++;
        console.log(`  ✗ Error deleting title ${titleId}:`, error);
      }
    }

    console.log(`\n✅ Cleanup complete: ${deletedCount} deleted, ${failedCount} failed`);
  });
});
