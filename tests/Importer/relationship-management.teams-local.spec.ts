import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { teamSchema, teamsListResponseSchema, stageSchema, stagesListSchema } from '../../schemas/teams.schemas';

/**
 * Test Suite: Relationship Management - Teams Local
 * 
 * Local environment tests for managing Teams (Pools) in the Relationship Management system
 * Same endpoints as Teams but for local testing environment
 * 
 * Endpoints tested:
 * - GET /assignments-java/v2/pools - Get list of all teams (stages)
 * - GET /assignments-java/v2/stages - Get list of all teams (pools)
 * - POST /assignments-java/v2/pools - Create a team
 * - PUT /assignments-java/v2/pools/{id} - Update a team
 * - DELETE /assignments-java/v2/pools/{id} - Delete a team
 */

test.describe.serial('Relationship Management - Teams Local', () => {
  let authToken: string;
  const testOrgId = 463; // Local test org
  let createdTeamId: number;
  let createdTeamData: any;
  const timestamp = Date.now();
  
  // Track all created team IDs for cleanup
  const createdTeamIds: number[] = [];

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

  test('GET /assignments-java/v2/pools - Get list of all teams (stages)', async ({ request }) => {
    const response = await request.get(
      `/assignments-java/v2/pools?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&pool_type=TEAM&limit=10000`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nGet Teams (Stages) Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Total teams found:', body.total);
    
    // Validate response schema
    expectSchema(body, teamsListResponseSchema);
    
    if (body.items && body.items.length > 0) {
      console.log('Sample teams:', JSON.stringify(body.items.slice(0, 3).map((team: any) => ({
        id: team.id,
        name: team.name,
        pool_type: team.pool_type
      })), null, 2));
    }
  });

  test('GET /assignments-java/v2/stages - Get list of all teams (pools)', async ({ request }) => {
    const response = await request.get(
      `/assignments-java/v2/stages?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&stage_group_type=TEAM`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nGet Teams (Pools) Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Total stages found:', body.length);
    
    if (body.length > 0) {
      console.log('Sample stages:', JSON.stringify(body.slice(0, 3).map((stage: any) => ({
        id: stage.id,
        name: stage.name,
        stage_group_type: stage.stage_group_type
      })), null, 2));
    }

    // Validate response schema
    expectSchema(body, stagesListSchema);
  });

  test('POST /assignments-java/v2/pools - Create a team', async ({ request }) => {
    const teamData = {
      name: `teams_${timestamp}`,
      pool_type: 'TEAM',
      selection_mode: 'SOLICITOR_SELECTION'
    };

    const response = await request.post(
      `/assignments-java/v2/pools?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: teamData
      }
    );

    console.log('\nCreate Team Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Created Team:', JSON.stringify({
      id: body.id,
      name: body.name,
      pool_type: body.pool_type,
      selection_mode: body.selection_mode
    }, null, 2));

    // Validate response schema
    expectSchema(body, teamSchema);

    // Store created team ID and full data
    createdTeamId = body.id;
    createdTeamData = body;
    createdTeamIds.push(body.id);

    // Validate created team data
    expect(body.name).toBe(teamData.name);
    expect(body.pool_type).toBe('TEAM');
    expect(body.selection_mode).toBe('SOLICITOR_SELECTION');
    expect(body.oid).toBe(testOrgId);
  });

  test('PUT /assignments-java/v2/pools/{id} - Update a team', async ({ request }) => {
    if (!createdTeamId || !createdTeamData) {
      throw new Error('Team ID or data not found from previous test');
    }

    // PUT expects full object with all fields
    const updateData = {
      ...createdTeamData,
      name: `test_${Date.now()}` // Update team name
    };

    const response = await request.put(
      `/assignments-java/v2/pools/${createdTeamId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: updateData
      }
    );

    console.log('\nUpdate Team Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Updated Team:', JSON.stringify({
      id: body.id,
      name: body.name,
      pool_type: body.pool_type
    }, null, 2));

    // Validate response schema
    expectSchema(body, teamSchema);

    expect(body.id).toBe(createdTeamId);
    expect(body.name).toContain('test_');
  });

  test('DELETE /assignments-java/v2/pools/{id} - Delete a team', async ({ request }) => {
    if (!createdTeamId) {
      throw new Error('Team ID not found from previous test');
    }

    const response = await request.delete(
      `/assignments-java/v2/pools/${createdTeamId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nDelete Team Response Status:', response.status());

    // DELETE returns 202 Accepted on success
    expect(response.status()).toBe(202);

    const responseText = await response.text();
    console.log('Deleted Team Response:', responseText || '(empty response)');

    console.log(`✓ Team ${createdTeamId} successfully deleted`);
  });

  test('Verify deleted team is not in active list', async ({ request }) => {
    if (!createdTeamId) {
      throw new Error('Team ID not found from previous test');
    }

    const response = await request.get(
      `/assignments-java/v2/pools?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}&pool_type=TEAM&limit=10000`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Check that deleted team is not in items list
    const deletedTeam = body.items.find((team: any) => team.id === createdTeamId);
    
    if (deletedTeam) {
      console.log('\n⚠ Deleted team still in list');
      throw new Error(`Team ${createdTeamId} should not be in active teams list`);
    } else {
      console.log('\n✓ Deleted team not in active teams list');
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete all created teams
    console.log(`\n🧹 Cleanup: Deleting ${createdTeamIds.length} created teams...`);
    
    let deletedCount = 0;
    let failedCount = 0;

    for (const teamId of createdTeamIds) {
      try {
        const response = await request.delete(
          `/assignments-java/v2/pools/${teamId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status() === 202 || response.status() === 404 || response.status() === 400) {
          deletedCount++;
          console.log(`  ✓ Deleted team ${teamId}`);
        } else {
          failedCount++;
          console.log(`  ✗ Failed to delete team ${teamId} (status: ${response.status()})`);
        }
      } catch (error) {
        failedCount++;
        console.log(`  ✗ Error deleting team ${teamId}:`, error);
      }
    }

    console.log(`\n✅ Cleanup complete: ${deletedCount} deleted, ${failedCount} failed`);
  });
});
