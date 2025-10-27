import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  createPropertyResponseSchema,
  createNestedPropertyResponseSchema,
  updatePropertyResponseSchema,
  getPropertiesResponseSchema,
  dynamicListCreateResponseSchema,
  deleteResponseSchema,
} from '../../schemas/properties.schemas';
import { contactsSearchResponseSchema } from '../../schemas/search.schemas';

// Properties API - Positive Flow (mirrors Postman: tests/properties/properties.json)
// 9 requests, each with status + schema tests. Runs serially to share IDs.

test.describe.configure({ mode: 'serial' });

test.describe('Properties API - Positive Flow', () => {
  const OID = process.env.ORGANIZATION_ID || '463';
  const AUTH_PROVIDER = 'evertrueauthtoken';
  let authToken: string;
  const APP_KEY_GIVINGTREE = getAppKey('givingtree');

  // shared state from creates for updates/deletes
  let createdNestedPropertyId: number | undefined;
  let createdNestedPropertyUpdatedAt: number | undefined;

  test.beforeAll(async ({ request }) => {
    const resp = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        Authorization: `Basic ${config.auth.superAdminToken}`,
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    authToken = body.token;
  });

  // 1. Create a new Contact property (POST /contacts/v1/properties)
  test.describe('POST /contacts/v1/properties - Create a new Contact property', () => {
    test('Status: Create a new Contact property', async ({ request }) => {
      const payload: Record<string, unknown> = {
        data_type: 'object',
        name: `123prop_${Date.now()}`,
        default: false,
        properties: [
          {
            name: `name1_${Date.now()}`,
            description: `swan_${Date.now()}`,
            data_type: 'number',
            default: true,
            permissions: [],
            app_keys: [
              '84731a780476587920ee41a93feba4b0b69f66f444fc1c2ff7111eafdf7cb946',
              '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f',
            ],
          },
        ],
      };

      const response = await request.post('/contacts/v1/properties', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        data: payload,
      });
      expect(response.status()).toBe(200);
      await response.json();
    });

    test('Schema: Create a new Contact property', async ({ request }) => {
      const payload: Record<string, unknown> = {
        data_type: 'object',
        name: `123prop_${Date.now()}`,
        default: false,
        properties: [
          {
            name: `name1_${Date.now()}`,
            description: `swan_${Date.now()}`,
            data_type: 'number',
            default: true,
            permissions: [],
            app_keys: [
              '84731a780476587920ee41a93feba4b0b69f66f444fc1c2ff7111eafdf7cb946',
              '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f',
            ],
          },
        ],
      };

      const response = await request.post('/contacts/v1/properties', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        data: payload,
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expectSchema(data, createPropertyResponseSchema);
    });
  });

  // 2. Create a new Contact custom field property with object and list (POST /contacts/v1/properties/nested)
  test.describe('POST /contacts/v1/properties/nested - Create nested property', () => {
    test('Status: Create a new nested property', async ({ request }) => {
      const payload: Record<string, unknown> = {
        name: 'phone',
        description: `swan_${Date.now()}`,
        data_type: 'number',
        default: false,
        permissions: [
          { writable: true, subject_role_id: 1, actor_role_id: 1 },
          { writable: true, subject_role_id: 2, actor_role_id: 1 },
        ],
        app_keys: [
          '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f',
          '590b6855ec417400015682e454c6acec8f371adf861b830b031fa9ad3ac84c90',
          '815e8d01be8f78a41d1c71eb652b8be124b89058b74d284c6bb752a034dbb301',
        ],
      };
      const response = await request.post('/contacts/v1/properties/nested', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        data: payload,
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      createdNestedPropertyId = data.id;
      createdNestedPropertyUpdatedAt = data.updated_at;
    });

    test('Schema: Create a new nested property', async ({ request }) => {
      const payload: Record<string, unknown> = {
        name: 'phone',
        description: `swan_${Date.now()}`,
        data_type: 'number',
        default: false,
        permissions: [
          { writable: true, subject_role_id: 1, actor_role_id: 1 },
          { writable: true, subject_role_id: 2, actor_role_id: 1 },
        ],
        app_keys: [
          '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f',
          '590b6855ec417400015682e454c6acec8f371adf861b830b031fa9ad3ac84c90',
          '815e8d01be8f78a41d1c71eb652b8be124b89058b74d284c6bb752a034dbb301',
        ],
      };
      const response = await request.post('/contacts/v1/properties/nested', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        data: payload,
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expectSchema(data, createNestedPropertyResponseSchema);
    });
  });

  // 3. Update a Contact property (PUT /contacts/v1/properties/{id})
  test.describe('PUT /contacts/v1/properties/{id} - Update a Contact property', () => {
    test('Status: Update a Contact property', async ({ request }) => {
      const response = await request.put(`/contacts/v1/properties/${createdNestedPropertyId ?? 0}`, {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        data: {
          id: createdNestedPropertyId ?? 0,
          updated_at: createdNestedPropertyUpdatedAt ?? Date.now(),
          name: 'phone',
          description: `swan_${Date.now()}`,
          data_type: 'number',
          default: true,
          permissions: [
            { writable: true, subject_role_id: 1, actor_role_id: 1 },
            { writable: true, subject_role_id: 2, actor_role_id: 1 },
          ],
          app_keys: [
            '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f',
            '590b6855ec417400015682e454c6acec8f371adf861b830b031fa9ad3ac84c90',
            '815e8d01be8f78a41d1c71eb652b8be124b89058b74d284c6bb752a034dbb301',
          ],
        },
      });
      expect(response.status()).toBe(200);
      // Refresh updated_at for subsequent operations
      try {
        const body = await response.json();
        createdNestedPropertyUpdatedAt = body.updated_at ?? createdNestedPropertyUpdatedAt;
      } catch (e) {
        void e;
      }
    });

    test('Schema: Update a Contact property', async ({ request }) => {
      const response = await request.put(`/contacts/v1/properties/${createdNestedPropertyId ?? 0}`, {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        data: {
          id: createdNestedPropertyId ?? 0,
          updated_at: createdNestedPropertyUpdatedAt ?? Date.now(),
          name: 'phone',
          description: `swan_${Date.now()}`,
          data_type: 'number',
          default: true,
          permissions: [
            { writable: true, subject_role_id: 1, actor_role_id: 1 },
            { writable: true, subject_role_id: 2, actor_role_id: 1 },
          ],
          app_keys: [
            '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f',
            '590b6855ec417400015682e454c6acec8f371adf861b830b031fa9ad3ac84c90',
            '815e8d01be8f78a41d1c71eb652b8be124b89058b74d284c6bb752a034dbb301',
          ],
        },
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expectSchema(data, updatePropertyResponseSchema);
    });
  });

  // 4. Get properties (GET /contacts/v1/properties)
  test.describe('GET /contacts/v1/properties - Get properties', () => {
    test('Status: Get properties', async ({ request }) => {
      const response = await request.get('/contacts/v1/properties', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
      });
      expect(response.status()).toBe(200);
    });

    test('Schema: Get properties', async ({ request }) => {
      const response = await request.get('/contacts/v1/properties', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expectSchema(data, getPropertiesResponseSchema);
    });
  });

  // 5. v2 / Search for contacts based on any property (POST /contacts/v2/search)
  test.describe('POST /contacts/v2/search - Search contacts by property', () => {
    test('Status: v2 Search contacts by property', async ({ request }) => {
      const payload: Record<string, unknown> = {
        must: [{ 'addresses.house_value_median': { gte: 1000000, coerce: 0 } }],
        sort: [{ 'score.score': { order: 'desc' } }, { 'score.score': { order: 'desc' } }],
      };
      const response = await request.post('/contacts/v2/search', {
        params: {
          auth_provider: AUTH_PROVIDER,
          oid: OID,
          app_key: APP_KEY_GIVINGTREE,
          auth: authToken,
          'must[]': 'name:name_first',
        },
        data: payload,
      });
      expect(response.status()).toBe(200);
    });

    test('Schema: v2 Search contacts by property', async ({ request }) => {
      const payload: Record<string, unknown> = {
        must: [{ 'addresses.house_value_median': { gte: 1000000, coerce: 0 } }],
        sort: [{ 'score.score': { order: 'desc' } }, { 'score.score': { order: 'desc' } }],
      };
      const response = await request.post('/contacts/v2/search', {
        params: {
          auth_provider: AUTH_PROVIDER,
          oid: OID,
          app_key: APP_KEY_GIVINGTREE,
          auth: authToken,
          'must[]': 'name:name_first',
        },
        data: payload,
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expectSchema(data, contactsSearchResponseSchema);
    });
  });

  // 6. Create a dynamic list for a property (POST /contacts/v1/lists)
  test.describe('POST /contacts/v1/lists - Create a dynamic list for a property', () => {
    test('Status: Create a dynamic list for a property', async ({ request }) => {
      const payload = {
        name: 'West Region Contacts',
        type: 'dynamic',
        criteria: { must: [{ property_84496: { eq: 'West' } }] },
        alias: { property_84496: 'West' },
      } as any;
      const response = await request.post('/contacts/v1/lists', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        data: payload,
      });
      expect(response.status()).toBe(200);
    });

    test('Schema: Create a dynamic list for a property', async ({ request }) => {
      const payload = {
        name: 'West Region Contacts',
        type: 'dynamic',
        criteria: { must: [{ property_84496: { eq: 'West' } }] },
        alias: { property_84496: 'West' },
      } as any;
      const response = await request.post('/contacts/v1/lists', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        data: payload,
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      expectSchema(data, dynamicListCreateResponseSchema);
    });
  });

  // 7. Delete a non-default Contact property (removed per documentation)

  // 8. Delete a Contact custom field property with object and list (DELETE /contacts/v1/properties/nested/{id})
  test.describe('DELETE /contacts/v1/properties/nested/{id} - Delete a nested Contact property', () => {
    test('Status: Delete a nested Contact property', async ({ request }) => {
      const response = await request.delete(`/contacts/v1/properties/nested/${createdNestedPropertyId}`, {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        data: { updated_at: createdNestedPropertyUpdatedAt },
      });
      expect(response.status()).toBe(200);
    });

    test('Schema: Delete a nested Contact property', async ({ request }) => {
      const response = await request.delete(`/contacts/v1/properties/nested/${createdNestedPropertyId}`, {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        data: { updated_at: createdNestedPropertyUpdatedAt },
      });
      expect(response.status()).toBe(200);
      const text = await response.text();
      expectSchema(text as unknown as any, deleteResponseSchema);
    });
  });

  // 9. Delete an object's property values (DELETE /contacts/v1/contacts/{contactId}/object/{propId})
  test.describe("DELETE /contacts/v1/contacts/{contactId}/object/{propId} - Delete an object's property values", () => {
    test("Status: Delete an object's property values", async ({ request }) => {
      const response = await request.delete('/contacts/v1/contacts/14624106/object/84495', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        headers: { 'ET-Update-Source': 'linkedin' },
        data: { updated_at: Date.now() },
      });
      expect(response.status()).toBe(200);
    });

    test("Schema: Delete an object's property values", async ({ request }) => {
      const response = await request.delete('/contacts/v1/contacts/14624106/object/84495', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: APP_KEY_GIVINGTREE },
        headers: { 'ET-Update-Source': 'linkedin' },
        data: { updated_at: Date.now() },
      });
      expect(response.status()).toBe(200);
      const text = await response.text();
      const { valid, errors } = validateSchema(text, deleteResponseSchema);
      expect(valid, errors.join(', ')).toBe(true);
    });
  });
});
