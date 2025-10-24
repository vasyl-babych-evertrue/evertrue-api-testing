import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  propertiesListSchema,
  propertySchema,
} from '../../schemas/constituents.schemas';

/**
 * Constituents API Tests - Custom Fields Management
 * 
 * This file contains tests for managing custom contact properties/fields
 * through the Contacts API.
 * 
 * Test User: Super Admin (vasyl.babych@evertrue.com)
 */

test.describe.serial('Constituents - Custom Fields Management', () => {
  let authToken: string;
  const testOrgId = 467; // Swan organization
  let createdFieldId: number;
  let createdFieldUpdatedAt: number;
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

  test('GET /contacts/v1/properties - Get list of all fields', async ({ request }) => {
    const response = await request.get(
      `/contacts/v1/properties?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Get Properties Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log(`Total properties found: ${body.length}`);

    // Validate response schema
    expectSchema(body, propertiesListSchema);

    // Validate response is an array
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    // Log sample properties
    const sampleProps = body.slice(0, 3).map((prop: any) => ({
      id: prop.id,
      name: prop.name,
      data_type: prop.data_type,
      visible: prop.visible,
      filterable: prop.filterable
    }));
    console.log('Sample properties:', JSON.stringify(sampleProps, null, 2));

    // Validate common fields exist
    const addressesField = body.find((prop: any) => prop.name === 'addresses');
    if (addressesField) {
      console.log('✓ Found standard "addresses" field');
      expect(addressesField.data_type).toBe('list');
      expect(addressesField.default).toBe(true);
    }
  });

  test('POST /contacts/v1/properties/nested - Create new BOOLEAN field', async ({ request }) => {
    const fieldData = {
      name: `Constituent_Boolean_${timestamp}`,
      description: `Test boolean field created at ${timestamp}`,
      updated_at: timestamp,
      data_type: 'boolean',
      default: false,
      reserved: false,
      visible: true,
      filterable: true,
      oid: testOrgId,
      permissions: [],
      app_keys: [
        config.headers.applicationKey
      ],
      deleted: false
    };

    const response = await request.post(
      `/contacts/v1/properties/nested?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: fieldData
      }
    );

    console.log('\nCreate BOOLEAN Field Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Created BOOLEAN Field:', JSON.stringify({
      id: body.id,
      name: body.name,
      data_type: body.data_type,
      visible: body.visible,
      filterable: body.filterable
    }, null, 2));

    // Validate response schema
    expectSchema(body, propertySchema);

    // Store created field ID and updated_at for subsequent tests
    createdFieldId = body.id;
    createdFieldUpdatedAt = body.updated_at;
    createdFieldIds.push(body.id);

    // Validate created field data
    // API converts field name to lowercase
    expect(body.name).toBe(fieldData.name.toLowerCase());
    expect(body.data_type).toBe('boolean');
    expect(body.visible).toBe(true);
    expect(body.filterable).toBe(true);
    expect(body.oid).toBe(testOrgId);
    expect(body.deleted).toBe(false);
  });

  test('POST /contacts/v1/properties/nested - Create new STRING field', async ({ request }) => {
    const fieldData = {
      name: `Constituent_String_${timestamp}`,
      description: `Test string field created at ${timestamp}`,
      updated_at: timestamp,
      data_type: 'string',
      default: false,
      reserved: false,
      visible: true,
      filterable: true,
      oid: testOrgId,
      permissions: [],
      app_keys: [
        config.headers.applicationKey
      ],
      deleted: false
    };

    const response = await request.post(
      `/contacts/v1/properties/nested?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
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
    console.log('\nCreated STRING Field:', JSON.stringify({
      id: body.id,
      name: body.name,
      data_type: body.data_type
    }, null, 2));

    // Validate response schema
    expectSchema(body, propertySchema);

    createdFieldIds.push(body.id);
    expect(body.name).toBe(fieldData.name.toLowerCase());
    expect(body.data_type).toBe('string');
  });

  test('POST /contacts/v1/properties/nested - Create new NUMBER field', async ({ request }) => {
    const fieldData = {
      name: `Constituent_Number_${timestamp}`,
      description: `Test number field created at ${timestamp}`,
      updated_at: timestamp,
      data_type: 'number',
      default: false,
      reserved: false,
      visible: true,
      filterable: true,
      oid: testOrgId,
      permissions: [],
      app_keys: [
        config.headers.applicationKey
      ],
      deleted: false
    };

    const response = await request.post(
      `/contacts/v1/properties/nested?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
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
    console.log('\nCreated NUMBER Field:', JSON.stringify({
      id: body.id,
      name: body.name,
      data_type: body.data_type
    }, null, 2));

    // Validate response schema
    expectSchema(body, propertySchema);

    createdFieldIds.push(body.id);
    expect(body.name).toBe(fieldData.name.toLowerCase());
    expect(body.data_type).toBe('number');
  });

  test('POST /contacts/v1/properties/nested - Create new DATE field', async ({ request }) => {
    const fieldData = {
      name: `Constituent_Date_${timestamp}`,
      description: `Test date field created at ${timestamp}`,
      updated_at: timestamp,
      data_type: 'date_string', // Correct type for date fields
      default: false,
      reserved: false,
      visible: true,
      filterable: true,
      oid: testOrgId,
      parent_id: 83175, // Required for nested fields
      permissions: [],
      app_keys: [
        config.headers.applicationKey
      ],
      deleted: false
    };

    const response = await request.post(
      `/contacts/v1/properties/nested?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
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
      name: body.name,
      data_type: body.data_type
    }, null, 2));

    // Validate response schema
    expectSchema(body, propertySchema);

    createdFieldIds.push(body.id);
    expect(body.name).toBe(fieldData.name.toLowerCase());
    expect(body.data_type).toBe('date_string');
  });

  test('POST /contacts/v1/properties/nested - Create new CURRENCY field', async ({ request }) => {
    const fieldData = {
      name: `Constituent_Currency_${timestamp}`,
      description: `Test currency field created at ${timestamp}`,
      updated_at: timestamp,
      data_type: 'currency',
      default: false,
      reserved: false,
      visible: true,
      filterable: true,
      oid: testOrgId,
      parent_id: 83175, // Required for nested fields
      permissions: [],
      app_keys: [
        config.headers.applicationKey
      ],
      deleted: false
    };

    const response = await request.post(
      `/contacts/v1/properties/nested?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
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
      name: body.name,
      data_type: body.data_type
    }, null, 2));

    // Validate response schema
    expectSchema(body, propertySchema);

    createdFieldIds.push(body.id);
    expect(body.name).toBe(fieldData.name.toLowerCase());
    expect(body.data_type).toBe('currency');
  });

  test('PUT /contacts/v1/properties/{id} - Update a field', async ({ request }) => {
    if (!createdFieldId) {
      throw new Error('Field ID not found from previous test');
    }

    const updateData = {
      // Note: name cannot be changed after creation
      description: `Updated description at ${Date.now()}`,
      updated_at: createdFieldUpdatedAt,
      data_type: 'boolean',
      default: false,
      reserved: false,
      visible: false, // Change visibility
      filterable: false, // Change filterability
      oid: testOrgId,
      permissions: [],
      app_keys: [
        config.headers.applicationKey
      ],
      deleted: false
    };

    const response = await request.put(
      `/contacts/v1/properties/${createdFieldId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data: updateData
      }
    );

    console.log('\nUpdate Field Response Status:', response.status());

    expect(response.status()).toBe(200);

    const body = await response.json();
    console.log('Updated Field:', JSON.stringify({
      id: body.id,
      name: body.name,
      description: body.description,
      updated_at: body.updated_at
    }, null, 2));

    // Validate response schema
    expectSchema(body, propertySchema);

    // Validate updated field data
    expect(body.id).toBe(createdFieldId);
    // Name should remain unchanged
    expect(body.name).toContain('constituent_boolean_');
    expect(body.description).toContain('Updated description');
    expect(body.updated_at).toBeGreaterThan(createdFieldUpdatedAt);
    // Validate updated properties
    expect(body.visible).toBe(false);
    expect(body.filterable).toBe(false);
  });

  test('DELETE /contacts/v1/properties/{id} - Delete a field', async ({ request }) => {
    if (!createdFieldId) {
      throw new Error('Field ID not found from previous test');
    }

    const response = await request.delete(
      `/contacts/v1/properties/${createdFieldId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\nDelete Field Response Status:', response.status());

    expect(response.status()).toBe(200);

    // DELETE returns empty response body (204-like behavior with 200 status)
    const responseText = await response.text();
    console.log('Deleted Field Response:', responseText || '(empty response)');

    // Successful deletion returns 200 with empty body
    expect(responseText).toBe('');

    console.log(`✓ Field ${createdFieldId} successfully deleted`);
  });

  test('Verify deleted field is not in active list', async ({ request }) => {
    if (!createdFieldId) {
      throw new Error('Field ID not found from previous test');
    }

    const response = await request.get(
      `/contacts/v1/properties?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Check that deleted field is either not in list or marked as deleted
    const deletedField = body.find((prop: any) => prop.id === createdFieldId);
    
    if (deletedField) {
      console.log('\n⚠ Deleted field still in list but marked as deleted');
      expect(deletedField.deleted).toBe(true);
    } else {
      console.log('\n✓ Deleted field not in active properties list');
    }
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete all created fields
    console.log(`\n🧹 Cleanup: Deleting ${createdFieldIds.length} created fields...`);
    
    let deletedCount = 0;
    let failedCount = 0;

    for (const fieldId of createdFieldIds) {
      try {
        const response = await request.delete(
          `/contacts/v1/properties/${fieldId}?oid=${testOrgId}&auth=${authToken}&app_key=${config.headers.applicationKey}`,
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
