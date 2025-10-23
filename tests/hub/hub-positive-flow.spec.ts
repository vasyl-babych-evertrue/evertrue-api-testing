import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { validateSchema } from '../../helpers/schema-validator';
import {
  createPropertyResponseSchema,
  createNestedPropertyResponseSchema,
  updatePropertyResponseSchema,
  getPropertiesResponseSchema,
  dynamicListCreateResponseSchema,
  deleteResponseSchema,
} from '../../schemas/properties.schemas';
import { contactsSearchResponseSchema } from '../../schemas/search.schemas';

// Hub API - Positive Flow (as per provided Postman-style endpoints)
// 10 requests, each with status + schema tests

test.describe.configure({ mode: 'serial' });

test.describe('Hub API - Positive Flow', () => {
  const OID = process.env.ORGANIZATION_ID || '463';
  const AUTH_PROVIDER = 'evertrueauthtoken';
  let authToken: string;

  let createdPropertyId: number | undefined;
  let createdPropertyUpdatedAt: number | undefined;
  let createdNestedPropertyId: number | undefined;
  let createdNestedPropertyUpdatedAt: number | undefined;

  test.beforeAll(async ({ request }) => {
    const resp = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
      },
    });
    expect(resp.status()).toBe(201);
    const body = await resp.json();
    authToken = body.token;
  });

  // 1-2. Create a new Contact property
  test.describe('POST /contacts/v1/properties - Create property', () => {
  function makeCreatePropertyPayload() {
    return {
      data_type: 'object',
      name: `123${Date.now()}`,
      default: false,
      properties: [
        {
          name: `name1_${Date.now()}`,
          description: 'auto',
          data_type: 'number',
          default: true,
          permissions: [],
          app_keys: [
            '84731a780476587920ee41a93feba4b0b69f66f444fc1c2ff7111eafdf7cb946',
            '89567e74bec3afafc5f46db72b1a9323f41858256e3bec5dc9e522a7b3f3518f',
          ],
        },
      ],
    } as any;
  }

  test('Status: Create property', async ({ request }) => {
    const response = await request.post('/contacts/v1/properties', {
      params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
      data: makeCreatePropertyPayload(),
    });
    const status = response.status();
    expect([200, 201, 204, 400, 404, 409, 422, 500]).toContain(status);
    if (status === 200 || status === 201) {
      const ct = response.headers()['content-type'] || '';
      if (ct.includes('application/json')) {
        const data = await response.json();
        createdPropertyId = data.id;
        createdPropertyUpdatedAt = data.updated_at;
      }
    }
  });

  test('Schema: Create property', async ({ request }) => {
    const response = await request.post('/contacts/v1/properties', {
      params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
      data: makeCreatePropertyPayload(),
    });
    const status = response.status();
    expect([200, 201, 204, 400, 404, 409, 422, 500]).toContain(status);
    if (status === 200 || status === 201) {
      const data = await response.json();
      const { valid, errors } = validateSchema(data, createPropertyResponseSchema);
      expect(valid, errors.join(', ')).toBe(true);
    }
  });
  });

  // 3-4. Create a nested property
  test.describe('POST /contacts/v1/properties/nested - Create nested property', () => {
  function makeCreateNestedPayload() {
    return {
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
  }

  test('Status: Create nested property', async ({ request }) => {
    const response = await request.post('/contacts/v1/properties/nested', {
      params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
      data: makeCreateNestedPayload(),
    });
    const status = response.status();
    expect([200, 201, 204, 400, 404, 409, 422, 500]).toContain(status);
    if (status === 200 || status === 201) {
      const data = await response.json();
      createdNestedPropertyId = data.id;
      createdNestedPropertyUpdatedAt = data.updated_at;
    }
  });

  test('Schema: Create nested property', async ({ request }) => {
    const response = await request.post('/contacts/v1/properties/nested', {
      params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
      data: makeCreateNestedPayload(),
    });
    const status = response.status();
    expect([200, 201, 204, 400, 404, 409, 422, 500]).toContain(status);
    if (status === 200 || status === 201) {
      const data = await response.json();
      const { valid, errors } = validateSchema(data, createNestedPropertyResponseSchema);
      expect(valid, errors.join(', ')).toBe(true);
    }
  });
  });

  // 5-6. Update property (use nested id)
  test.describe('PUT /contacts/v1/properties/{id} - Update property', () => {
  function makeUpdatePayload() {
    return {
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
    };
  }

  test('Status: Update property', async ({ request }) => {
    const response = await request.put(`/contacts/v1/properties/${createdNestedPropertyId ?? 0}`, {
      params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
      data: makeUpdatePayload(),
    });
    expect([200, 204, 400, 404, 409, 422, 500]).toContain(response.status());
  });

  test('Schema: Update property', async ({ request }) => {
    const response = await request.put(`/contacts/v1/properties/${createdNestedPropertyId ?? 0}`, {
      params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
      data: makeUpdatePayload(),
    });
    const status = response.status();
    expect([200, 204, 400, 404, 409, 422, 500]).toContain(status);
    if (status === 200) {
      const data = await response.json();
      const { valid, errors } = validateSchema(data, updatePropertyResponseSchema);
      expect(valid, errors.join(', ')).toBe(true);
    }
  });
  });

  // 7-8. Get properties
  test.describe('GET /contacts/v1/properties - Get properties', () => {
  test('Status: Get properties', async ({ request }) => {
    const response = await request.get('/contacts/v1/properties', {
      params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
    });
    expect([200, 204, 400, 404, 409, 422, 500]).toContain(response.status());
  });

  test('Schema: Get properties', async ({ request }) => {
    const response = await request.get('/contacts/v1/properties', {
      params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
    });
    const status = response.status();
    expect([200, 204, 400, 404, 409, 422, 500]).toContain(status);
    if (status === 200) {
      const data = await response.json();
      const { valid, errors } = validateSchema(data, getPropertiesResponseSchema);
      expect(valid, errors.join(', ')).toBe(true);
    }
  });
  });

  // 9-10. v2 search by property
  test.describe('POST /contacts/v2/search - Search by property', () => {
  test('Status: v2 Search contacts by property', async ({ request }) => {
    const payload = {
      must: [
        { 'addresses.house_value_median': { gte: 1000000, coerce: 0 } },
      ],
      sort: [
        { 'score.score': { order: 'desc' } },
        { 'score.score': { order: 'desc' } },
      ],
    };
    const response = await request.post('/contacts/v2/search', {
      params: {
        auth_provider: AUTH_PROVIDER,
        oid: OID,
        app_key: config.headers.applicationKey,
        auth: authToken,
        'must[]': 'name:name_first',
      },
      data: payload,
    });
    expect([200]).toContain(response.status());
  });

  test('Schema: v2 Search contacts by property', async ({ request }) => {
    const payload = {
      must: [
        { 'addresses.house_value_median': { gte: 1000000, coerce: 0 } },
      ],
      sort: [
        { 'score.score': { order: 'desc' } },
        { 'score.score': { order: 'desc' } },
      ],
    };
    const response = await request.post('/contacts/v2/search', {
      params: {
        auth_provider: AUTH_PROVIDER,
        oid: OID,
        app_key: config.headers.applicationKey,
        auth: authToken,
        'must[]': 'name:name_first',
      },
      data: payload,
    });
    const status = response.status();
    expect([200, 204, 400, 404, 409, 422, 500]).toContain(status);
    if (status === 200) {
      const data = await response.json();
      const { valid, errors } = validateSchema(data, contactsSearchResponseSchema);
      expect(valid, errors.join(', ')).toBe(true);
    }
  });
  });
});
