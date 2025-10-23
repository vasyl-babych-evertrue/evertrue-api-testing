import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { stagesListSchema, stageSetSchema, individualStageSchema } from '../../schemas/teams.schemas';
import { randomUUID } from 'crypto';

/**
 * Test Suite: Relationship Management - Stages / Stage Sets
 * 
 * Tests for managing Stage Sets and individual Stages in the Relationship Management system
 * 
 * Endpoints tested:
 * - GET /assignments-java/v2/stages - Get list of all stage sets
 * - POST /assignments-java/v2/stages - Create a stage set
 * - GET /assignments-java/v2/stages/{id} - Get a specific stage set by ID
 * - POST /assignments-java/v2/stages/{stage_set_id} - Create a stage within stage set
 * - PUT /assignments-java/v2/stages/{stage_set_id}/{stage_id} - Update a stage
 * - DELETE /assignments-java/v2/stages/{stage_set_id} - Delete a stage set
 */

test.describe.serial('Relationship Management - Stages / Stage Sets', () => {
  let authToken: string;
  const testOrgId = 467;
  let createdStageSetId: number;
  let createdStageId: string;
  const timestamp = Date.now();
  
  // Track all created stage set IDs for cleanup
  const createdStageSetIds: number[] = [];

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

  test('GET /assignments-java/v2/stages - Get list of all stage sets', async ({ request }) => {
    const response = await request.get(
      `/assignments-java/v2/stages?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&stage_group_type=TEAM`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nGet Stage Sets Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Total stage sets found:', body.length);
    
    // Validate response schema
    expectSchema(body, stagesListSchema);
    
    if (body.length > 0) {
      console.log('Sample stage sets:', JSON.stringify(body.slice(0, 3).map((stageSet: any) => ({
        id: stageSet.id,
        name: stageSet.name,
        stage_group_type: stageSet.stage_group_type
      })), null, 2));
    }
  });

  test('POST /assignments-java/v2/stages - Create a stage set', async ({ request }) => {
    const stageSetData = {
      name: `test_stage_set_${timestamp}`,
      stage_group_type: 'TEAM'
    };

    const response = await request.post(
      `/assignments-java/v2/stages?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: stageSetData
      }
    );

    console.log('\nCreate Stage Set Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Created Stage Set:', JSON.stringify({
      id: body.id,
      name: body.name,
      stage_group_type: body.stage_group_type
    }, null, 2));

    // Validate response schema
    expectSchema(body, stageSetSchema);

    // Store created stage set ID
    createdStageSetId = body.id;
    createdStageSetIds.push(body.id);

    // Validate created stage set data
    expect(body.name).toBe(stageSetData.name);
    expect(body.stage_group_type).toBe('TEAM');
    expect(body.oid).toBe(testOrgId);
  });

  test('POST /assignments-java/v2/stages/{stage_set_id} - Create an inactive stage', async ({ request }) => {
    if (!createdStageSetId) {
      throw new Error('Stage Set ID not found from previous test');
    }

    const stageId = randomUUID();
    const stageData = {
      stage: 'teststage',
      active: true,
      id: stageId,
      sort_order: 2
    };

    const response = await request.post(
      `/assignments-java/v2/stages/${createdStageSetId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: stageData
      }
    );

    console.log('\nCreate Inactive Stage Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Created Stage:', JSON.stringify({
      id: body.id,
      stage: body.stage,
      active: body.active,
      sort_order: body.sort_order
    }, null, 2));

    // Validate response schema
    expectSchema(body, individualStageSchema);

    expect(body.stage).toBe(stageData.stage);
    expect(body.active).toBe(true);
    expect(body.sort_order).toBe(2);
  });

  test('POST /assignments-java/v2/stages/{stage_set_id} - Create an active stage', async ({ request }) => {
    if (!createdStageSetId) {
      throw new Error('Stage Set ID not found from previous test');
    }

    const stageId = randomUUID();
    const stageData = {
      stage: 'act4',
      active: false,
      id: stageId,
      sort_order: 0
    };

    const response = await request.post(
      `/assignments-java/v2/stages/${createdStageSetId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: stageData
      }
    );

    console.log('\nCreate Active Stage Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Created Stage:', JSON.stringify({
      id: body.id,
      stage: body.stage,
      active: body.active,
      sort_order: body.sort_order
    }, null, 2));

    // Validate response schema
    expectSchema(body, individualStageSchema);

    // Store created stage ID for update test
    createdStageId = body.id;

    expect(body.stage).toBe(stageData.stage);
    expect(body.active).toBe(false);
    expect(body.sort_order).toBe(0);
  });

  test('GET /assignments-java/v2/stages/{id} - Get a specific stage set by ID', async ({ request }) => {
    if (!createdStageSetId) {
      throw new Error('Stage Set ID not found from previous test');
    }

    const response = await request.get(
      `/assignments-java/v2/stages/${createdStageSetId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&stage_group_type=TEAM`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nGet Specific Stage Set Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Stage Set:', JSON.stringify({
      id: body.id,
      name: body.name,
      stage_group_type: body.stage_group_type,
      stages_count: body.stages ? body.stages.length : 0
    }, null, 2));

    // Validate response schema
    expectSchema(body, stageSetSchema);

    expect(body.id).toBe(createdStageSetId);
    expect(body.stages).toBeDefined();
    expect(Array.isArray(body.stages)).toBe(true);
    
    // Should have 2 stages created in previous tests
    if (body.stages.length > 0) {
      console.log('Stages in set:', JSON.stringify(body.stages.map((stage: any) => ({
        id: stage.id,
        stage: stage.stage,
        active: stage.active
      })), null, 2));
    }
  });

  test('PUT /assignments-java/v2/stages/{stage_set_id}/{stage_id} - Update a stage', async ({ request }) => {
    if (!createdStageSetId || !createdStageId) {
      throw new Error('Stage Set ID or Stage ID not found from previous test');
    }

    const updateData = {
      stage: 'rename act4',
      sort_order: 0,
      active: true
    };

    const response = await request.put(
      `/assignments-java/v2/stages/${createdStageSetId}/${createdStageId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: updateData
      }
    );

    console.log('\nUpdate Stage Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Updated Stage:', JSON.stringify({
      id: body.id,
      stage: body.stage,
      active: body.active,
      sort_order: body.sort_order
    }, null, 2));

    // Validate response schema
    expectSchema(body, individualStageSchema);

    expect(body.id).toBe(createdStageId);
    expect(body.stage).toBe('rename act4');
    expect(body.active).toBe(true);
  });

  test('DELETE /assignments-java/v2/stages/{stage_set_id} - Delete a stage set', async ({ request }) => {
    if (!createdStageSetId) {
      throw new Error('Stage Set ID not found from previous test');
    }

    const response = await request.delete(
      `/assignments-java/v2/stages/${createdStageSetId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nDelete Stage Set Response Status:', response.status());

    // DELETE returns 200 OK on success
    expect(response.status()).toBe(200);

    const responseText = await response.text();
    console.log('Deleted Stage Set Response:', responseText || '(empty response)');

    console.log(`✓ Stage Set ${createdStageSetId} successfully deleted`);
  });

  test('Verify deleted stage set is not in active list', async ({ request }) => {
    if (!createdStageSetId) {
      throw new Error('Stage Set ID not found from previous test');
    }

    const response = await request.get(
      `/assignments-java/v2/stages?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&stage_group_type=TEAM`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Check that deleted stage set is not in list
    const deletedStageSet = body.find((stageSet: any) => stageSet.id === createdStageSetId);
    
    if (deletedStageSet) {
      console.log('\n⚠ Deleted stage set still in list');
      throw new Error(`Stage Set ${createdStageSetId} should not be in active stage sets list`);
    } else {
      console.log('\n✓ Deleted stage set not in active stage sets list');
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete all created stage sets
    console.log(`\n🧹 Cleanup: Deleting ${createdStageSetIds.length} created stage sets...`);
    
    let deletedCount = 0;
    let failedCount = 0;

    for (const stageSetId of createdStageSetIds) {
      try {
        const response = await request.delete(
          `/assignments-java/v2/stages/${stageSetId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status() === 200 || response.status() === 404 || response.status() === 400) {
          deletedCount++;
          console.log(`  ✓ Deleted stage set ${stageSetId}`);
        } else {
          failedCount++;
          console.log(`  ✗ Failed to delete stage set ${stageSetId} (status: ${response.status()})`);
        }
      } catch (error) {
        failedCount++;
        console.log(`  ✗ Error deleting stage set ${stageSetId}:`, error);
      }
    }

    console.log(`\n✅ Cleanup complete: ${deletedCount} deleted, ${failedCount} failed`);
  });
});
