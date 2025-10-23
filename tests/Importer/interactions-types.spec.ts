import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  interactionTypesListSchema,
  interactionTypeSchema,
} from '../../schemas/interactions.schemas';

/**
 * Interactions API Tests - Types Management
 * 
 * This file contains tests for managing interaction types
 * through the UGC API.
 * 
 * Test User: Super Admin (vasyl.babych@evertrue.com)
 */

test.describe.serial('Interactions - Types Management', () => {
  let authToken: string;
  const testOrgId = 467;
  let createdTypeId: number;
  let createdTypeData: any; // Store full type data for update
  const timestamp = Date.now();
  
  // Track all created type IDs for cleanup
  const createdTypeIds: number[] = [];

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

  test('GET /ugc/v2/types/interaction - Get list of all interaction types', async ({ request }) => {
    const response = await request.get(
      `/ugc/v2/types/interaction?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Get Interaction Types Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log(`Total interaction types found: ${body.length}`);

    // Validate response schema
    expectSchema(body, interactionTypesListSchema);

    // Validate response is an array
    expect(Array.isArray(body)).toBe(true);

    // Log sample types if any exist
    if (body.length > 0) {
      const sampleTypes = body.slice(0, 3).map((type: any) => ({
        id: type.id,
        name: type.name,
        active: type.active
      }));
      console.log('Sample interaction types:', JSON.stringify(sampleTypes, null, 2));
    }
  });

  test('POST /ugc/v2/types/interaction - Create an interaction type', async ({ request }) => {
    const typeData = {
      type: `test_${timestamp}`,
      active: true,
      categories: [
        {
          display_name: 'Visit',
          category: 'VISIT'
        },
        {
          category: 'CONTACT'
        }
      ],
      sort_order: 2
    };

    const response = await request.post(
      `/ugc/v2/types/interaction?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: typeData
      }
    );

    console.log('\nCreate Interaction Type Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Created Interaction Type:', JSON.stringify({
      id: body.id,
      type: body.type,
      active: body.active,
      categories: body.categories
    }, null, 2));

    // Validate response schema
    expectSchema(body, interactionTypeSchema);

    // Store created type ID and full data
    createdTypeId = body.id;
    createdTypeData = body; // Store for update
    createdTypeIds.push(body.id);

    // Validate created type data
    expect(body.type).toBe(typeData.type);
    expect(body.oid).toBe(testOrgId);
    expect(body.active).toBe(true);
    expect(body.categories).toHaveLength(2);
  });

  test('PUT /ugc/v2/types/interaction/bulk - Update an interaction type', async ({ request }) => {
    if (!createdTypeId || !createdTypeData) {
      throw new Error('Type ID or data not found from previous test');
    }

    // PUT /bulk expects an array with full object
    const updateData = [
      {
        id: createdTypeData.id,
        oid: createdTypeData.oid,
        type: `test_${Date.now()}`, // Update type name
        data_type: createdTypeData.data_type || 'INTERACTION',
        active: true,
        sort_order: 0,
        categories: createdTypeData.categories,
        created_at: createdTypeData.created_at,
        updated_at: createdTypeData.updated_at
      }
    ];

    const response = await request.put(
      `/ugc/v2/types/interaction/bulk?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: updateData
      }
    );

    console.log('\nUpdate Interaction Type Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Updated Interaction Type:', JSON.stringify(body, null, 2));

    // Response should be an array
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const updatedType = body[0];
    expectSchema(updatedType, interactionTypeSchema);

    expect(updatedType.id).toBe(createdTypeId);
    expect(updatedType.type).toContain('test_');
  });

  test('DELETE /ugc/v2/types/interaction/{id} - Delete an interaction type', async ({ request }) => {
    if (!createdTypeId) {
      throw new Error('Type ID not found from previous test');
    }

    const response = await request.delete(
      `/ugc/v2/types/interaction/${createdTypeId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nDelete Interaction Type Response Status:', response.status());

    // DELETE returns 204 No Content on success
    expect(response.status()).toBe(204);

    const responseText = await response.text();
    console.log('Deleted Type Response:', responseText || '(empty response)');

    console.log(`✓ Interaction Type ${createdTypeId} successfully deleted`);
  });

  test('Verify deleted type is not in active list', async ({ request }) => {
    if (!createdTypeId) {
      throw new Error('Type ID not found from previous test');
    }

    const response = await request.get(
      `/ugc/v2/types/interaction?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Check that deleted type is either not in list or marked as inactive
    const deletedType = body.find((type: any) => type.id === createdTypeId);
    
    if (deletedType) {
      console.log('\n⚠ Deleted type still in list but marked as inactive');
      expect(deletedType.active).toBe(false);
    } else {
      console.log('\n✓ Deleted type not in active types list');
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete all created types
    console.log(`\n🧹 Cleanup: Deleting ${createdTypeIds.length} created types...`);
    
    let deletedCount = 0;
    let failedCount = 0;

    for (const typeId of createdTypeIds) {
      try {
        const response = await request.delete(
          `/ugc/v2/types/interaction/${typeId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status() === 200 || response.status() === 204) {
          deletedCount++;
          console.log(`  ✓ Deleted type ${typeId}`);
        } else {
          failedCount++;
          console.log(`  ✗ Failed to delete type ${typeId} (status: ${response.status()})`);
        }
      } catch (error) {
        failedCount++;
        console.log(`  ✗ Error deleting type ${typeId}:`, error);
      }
    }

    console.log(`\n✅ Cleanup complete: ${deletedCount} deleted, ${failedCount} failed`);
  });
});
