import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  interactionCustomFieldsListSchema,
  interactionCustomFieldSchema,
} from '../../schemas/interactions.schemas';

/**
 * Interactions API Tests - Custom Fields Management
 * 
 * This file contains tests for managing interaction custom fields
 * through the UGC API.
 * 
 * Test User: Super Admin (vasyl.babych@evertrue.com)
 */

test.describe.serial('Interactions - Custom Fields Management', () => {
  let authToken: string;
  const testOrgId = 467;
  let createdFieldId: number;
  let createdFieldData: any; // Store full field data for update
  const timestamp = Date.now();
  
  // Track all created field IDs for cleanup
  const createdFieldIds: number[] = [];

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

  test('GET /ugc/v2/interactions/custom_fields - Get list of all custom fields', async ({ request }) => {
    const response = await request.get(
      `/ugc/v2/interactions/custom_fields?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Get Custom Fields Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log(`Total custom fields found: ${body.length}`);

    // Validate response schema
    expectSchema(body, interactionCustomFieldsListSchema);

    // Validate response is an array
    expect(Array.isArray(body)).toBe(true);

    // Log sample fields if any exist
    if (body.length > 0) {
      const sampleFields = body.slice(0, 3).map((field: any) => ({
        id: field.id,
        displayName: field.displayName,
        dataType: field.dataType,
        required: field.required
      }));
      console.log('Sample custom fields:', JSON.stringify(sampleFields, null, 2));
    }
  });

  test('POST /ugc/v2/interactions/custom_fields - Create DOUBLE custom field', async ({ request }) => {
    const fieldData = {
      dataType: 'DOUBLE',
      required: false,
      displayName: `Test_Double_${timestamp}`,
      sortOrder: 1
    };

    const response = await request.post(
      `/ugc/v2/interactions/custom_fields?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: fieldData
      }
    );

    console.log('\nCreate DOUBLE Field Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Created DOUBLE Field:', JSON.stringify({
      id: body.id,
      displayName: body.displayName,
      dataType: body.dataType,
      required: body.required
    }, null, 2));

    // Validate response schema
    expectSchema(body, interactionCustomFieldSchema);

    // Store created field ID and full data for update
    createdFieldId = body.id;
    createdFieldData = body; // Store full response for update
    createdFieldIds.push(body.id);

    // Validate created field data
    expect(body.displayName).toBe(fieldData.displayName);
    expect(body.dataType).toBe('DOUBLE');
    expect(body.required).toBe(false);
    expect(body.oid).toBe(testOrgId);
  });

  test('POST /ugc/v2/interactions/custom_fields - Create BOOLEAN custom field', async ({ request }) => {
    const fieldData = {
      dataType: 'BOOLEAN',
      required: false,
      displayName: `Test_Boolean_${timestamp}`,
      sortOrder: 2
    };

    const response = await request.post(
      `/ugc/v2/interactions/custom_fields?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: fieldData
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('\nCreated BOOLEAN Field:', JSON.stringify({
      id: body.id,
      displayName: body.displayName,
      dataType: body.dataType
    }, null, 2));

    expectSchema(body, interactionCustomFieldSchema);
    createdFieldIds.push(body.id);

    expect(body.displayName).toBe(fieldData.displayName);
    expect(body.dataType).toBe('BOOLEAN');
  });

  test('POST /ugc/v2/interactions/custom_fields - Create DATE custom field', async ({ request }) => {
    const fieldData = {
      dataType: 'DATE',
      required: false,
      displayName: `Test_Date_${timestamp}`,
      sortOrder: 3
    };

    const response = await request.post(
      `/ugc/v2/interactions/custom_fields?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: fieldData
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('\nCreated DATE Field:', JSON.stringify({
      id: body.id,
      displayName: body.displayName,
      dataType: body.dataType
    }, null, 2));

    expectSchema(body, interactionCustomFieldSchema);
    createdFieldIds.push(body.id);

    expect(body.displayName).toBe(fieldData.displayName);
    expect(body.dataType).toBe('DATE');
  });

  test('POST /ugc/v2/interactions/custom_fields - Create CURRENCY custom field', async ({ request }) => {
    const fieldData = {
      dataType: 'DOUBLE', // Currency fields use DOUBLE type
      required: false,
      displayName: `Test_Currency_${timestamp}`,
      sortOrder: 4
    };

    const response = await request.post(
      `/ugc/v2/interactions/custom_fields?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: fieldData
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('\nCreated CURRENCY Field:', JSON.stringify({
      id: body.id,
      displayName: body.displayName,
      dataType: body.dataType
    }, null, 2));

    expectSchema(body, interactionCustomFieldSchema);
    createdFieldIds.push(body.id);

    expect(body.displayName).toBe(fieldData.displayName);
    expect(body.dataType).toBe('DOUBLE'); // Currency uses DOUBLE type
  });

  test('POST /ugc/v2/interactions/custom_fields - Create STRING FREEFORM custom field', async ({ request }) => {
    const fieldData = {
      dataType: 'STRING',
      required: false,
      displayName: `Test_String_Freeform_${timestamp}`,
      sortOrder: 5
    };

    const response = await request.post(
      `/ugc/v2/interactions/custom_fields?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: fieldData
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('\nCreated STRING FREEFORM Field:', JSON.stringify({
      id: body.id,
      displayName: body.displayName,
      dataType: body.dataType
    }, null, 2));

    expectSchema(body, interactionCustomFieldSchema);
    createdFieldIds.push(body.id);

    expect(body.displayName).toBe(fieldData.displayName);
    expect(body.dataType).toBe('STRING');
  });

  test('POST /ugc/v2/interactions/custom_fields - Create STRING PICKLIST custom field', async ({ request }) => {
    const fieldData = {
      dataType: 'STRING',
      displayName: `Test_PickList_${timestamp}`,
      uiControlType: 'DROPDOWN',
      sortOrder: 6
    };

    const response = await request.post(
      `/ugc/v2/interactions/custom_fields?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: fieldData
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('\nCreated STRING PICKLIST Field:', JSON.stringify({
      id: body.id,
      displayName: body.displayName,
      dataType: body.dataType,
      uiControlType: body.uiControlType
    }, null, 2));

    expectSchema(body, interactionCustomFieldSchema);
    createdFieldIds.push(body.id);

    expect(body.displayName).toBe(fieldData.displayName);
    expect(body.dataType).toBe('STRING');
    expect(body.uiControlType).toBe('DROPDOWN');
  });

  test('PUT /ugc/v2/interactions/custom_fields - Update a custom field', async ({ request }) => {
    if (!createdFieldId || !createdFieldData) {
      throw new Error('Field ID or data not found from previous test');
    }

    // Update requires full object with all fields (based on Postman payload)
    // Note: ID is in the body, not in the URL path
    const updateData = {
      id: createdFieldData.id,
      oid: createdFieldData.oid,
      dataType: createdFieldData.dataType,
      required: createdFieldData.required,
      displayName: `test3_${Date.now()}`, // Update display name
      uiControlType: createdFieldData.uiControlType,
      esField: createdFieldData.esField,
      createdAt: createdFieldData.createdAt,
      updatedAt: createdFieldData.updatedAt,
      sortOrder: 1,
      active: false // Update active status
    };

    const response = await request.put(
      `/ugc/v2/interactions/custom_fields?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: updateData
      }
    );

    console.log('\nUpdate Field Response Status:', response.status());
    
    // Log error details if not 200
    if (response.status() !== 200) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Updated Field:', JSON.stringify({
      id: body.id,
      displayName: body.displayName,
      sortOrder: body.sortOrder,
      active: body.active
    }, null, 2));

    expectSchema(body, interactionCustomFieldSchema);

    expect(body.id).toBe(createdFieldId);
    expect(body.displayName).toContain('test3_');
    expect(body.active).toBe(false);
  });

  test('DELETE /ugc/v2/interactions/custom_fields/{id} - Delete a custom field', async ({ request }) => {
    if (!createdFieldId) {
      throw new Error('Field ID not found from previous test');
    }

    const response = await request.delete(
      `/ugc/v2/interactions/custom_fields/${createdFieldId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nDelete Field Response Status:', response.status());

    // DELETE returns 200 OK on success
    expect(response.status()).toBe(200);

    const responseText = await response.text();
    console.log('Deleted Field Response:', responseText || '(empty response)');

    console.log(`✓ Field ${createdFieldId} successfully deleted`);
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete all created fields
    console.log(`\n🧹 Cleanup: Deleting ${createdFieldIds.length} created fields...`);
    
    let deletedCount = 0;
    let failedCount = 0;

    for (const fieldId of createdFieldIds) {
      try {
        const response = await request.delete(
          `/ugc/v2/interactions/custom_fields/${fieldId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status() === 200) {
          deletedCount++;
          console.log(`  ✓ Deleted field ${fieldId}`);
        } else {
          failedCount++;
          console.log(`  ✗ Failed to delete field ${fieldId} (status: ${response.status()})`);
        }
      } catch (error) {
        failedCount++;
        console.log(`  ✗ Error deleting field ${fieldId}:`, error);
      }
    }

    console.log(`\n✅ Cleanup complete: ${deletedCount} deleted, ${failedCount} failed`);
  });
});
