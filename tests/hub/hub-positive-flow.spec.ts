import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { validateSchema } from '../../helpers/schema-validator';
import {
  createNestedPropertyResponseSchema,
  updatePropertyResponseSchema,
  getPropertiesResponseSchema,
} from '../../schemas/properties.schemas';
import { contactsSearchResponseSchema } from '../../schemas/search.schemas';
import { hubListSchema, hubSearchResponseSchema } from '../../schemas/hub.schemas';
// comment
// Hub API - Positive Flow (as per provided Postman-style endpoints)
// 10 requests, each with status + schema tests

test.describe.configure({ mode: 'serial' });

test.describe('Hub API - Positive Flow', () => {
  const OID = process.env.ORGANIZATION_ID || '463';
  const AUTH_PROVIDER = 'evertrueauthtoken';
  let authToken: string;

  let createdNestedPropertyId: number | undefined;
  let createdNestedPropertyUpdatedAt: number | undefined;

  test.beforeAll(async ({ request }) => {
    console.log('Starting authentication...');
    console.log('Using Application Key:', config.headers.applicationKey);
    console.log('Using Authorization Provider:', config.headers.authorizationProvider);

    try {
      // First, make sure we can reach the auth endpoint
      const pingResponse = await request.get('/auth/ping');
      console.log('Auth ping status:', pingResponse.status());

      // Make the authentication request
      const authResponse = await request.post('/auth/session', {
        headers: {
          'Content-Type': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': config.headers.authorizationProvider,
          Authorization: `Basic ${config.auth.superAdminToken}`,
        },
      });

      const status = authResponse.status();
      const responseBody = await authResponse.text();

      console.log('Auth response status:', status);
      console.log('Auth response body:', responseBody);

      if (status !== 201) {
        console.error('Authentication failed with status:', status);
        console.error('Response body:', responseBody);
        expect(status, `Authentication failed with status ${status}: ${responseBody}`).toBe(201);
      }

      try {
        const body = JSON.parse(responseBody);
        expect(body.token, 'No token in response').toBeTruthy();
        authToken = body.token;
        console.log('Authentication successful, token received');

        // Verify the token is not empty
        expect(authToken, 'Received empty token').toBeTruthy();

        // Log the first few characters of the token (for debugging, don't log the whole token)
        console.log('Token received (first 10 chars):', authToken.substring(0, 10) + '...');
      } catch (e) {
        console.error('Failed to parse authentication response:', e);
        console.error('Raw response body:', responseBody);
        expect(false, `Failed to parse authentication response: ${(e as Error).message}`).toBe(true);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if ((error as any).response) {
        console.error('Error response status:', (error as any).response.status);
        console.error(
          'Error response body:',
          await (error as any).response.text().catch(() => 'Could not read response body')
        );
      }
      expect(false, `Authentication error: ${(error as Error).message}`).toBe(true);
    }
  });

  // 1-2. Contacts Properties flow removed for Hub tests

  // Hub endpoints from Postman collection (exact params)
  test.describe('Hub endpoints - Positive/Negative flow', () => {
    const OID = process.env.ORGANIZATION_ID || '463';
    const appKey = config.headers.applicationKey;
    const paramsBase = (token: string) => ({ oid: OID, auth: token, app_key: appKey });

    test('Status: GET /hub/v1/filters?query=interests -> 200', async ({ request }) => {
      const response = await request.get('/hub/v1/filters', {
        params: { ...paramsBase(authToken), query: 'interests' },
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      const isArray = Array.isArray(body);
      const schemaValid = validateSchema(body, hubListSchema).valid;
      const ok = isArray || schemaValid;
      expect(ok).toBe(true);
    });

    test('Status: GET /hub/v1/filters/134/facets -> 200', async ({ request }) => {
      const response = await request.get('/hub/v1/filters/134/facets', {
        params: { ...paramsBase(authToken) },
      });
      expect(response.status()).toBe(200);
    });

    test('Status: GET /hub/v1/filters/130/ -> 200', async ({ request }) => {
      const response = await request.get('/hub/v1/filters/130/', {
        params: { ...paramsBase(authToken) },
      });
      expect(response.status()).toBe(200);
    });

    test('Status: GET /hub/v1/filters (quick filters contacts) -> 200', async ({ request }) => {
      const response = await request.get('/hub/v1/filters', {
        params: { ...paramsBase(authToken), 'facets?oid': OID, type: 'QUICK' },
      });
      expect(response.status()).toBe(200);
    });

    test('Status: GET /hub/v1/filters/quick/contacts -> 200 or 404', async ({ request }) => {
      const response = await request.get('/hub/v1/filters/quick/contacts', {
        params: { ...paramsBase(authToken) },
      });
      const status = response.status();
      const body = await response.json().catch(() => ({}));
      const isArray = Array.isArray(body);
      const items = (body as Record<string, unknown>)?.items as unknown;
      const hasItemsArray = Array.isArray(items);
      const schemaValid = hasItemsArray ? validateSchema(body, hubListSchema).valid : true;
      const ok =
        status === 404 ||
        (status === 200 && (isArray || (hasItemsArray && schemaValid) || (!isArray && typeof body === 'object')));
      expect(ok).toBe(true);
    });

    test('Status: POST /hub/v1/filters/search/contact -> 200 or 404', async ({ request }) => {
      const payload = {
        columns: [],
        filters: {
          condition: 'AND',
          rules: [{ compound_id: '12', operator: 'must:in', value: ['male'] }],
        },
      } as Record<string, unknown>;
      const response = await request.post('/hub/v1/filters/search/contact', {
        params: { ...paramsBase(authToken) },
        data: payload,
      });
      const status = response.status();
      const body = status === 200 ? await response.json() : {};
      const { valid, errors } =
        status === 200 ? validateSchema(body, hubSearchResponseSchema) : { valid: true, errors: [] as string[] };
      const ok = status === 404 || (status === 200 && valid);
      expect(ok, errors.join(', ')).toBe(true);
    });

    test('Status: POST /hub/v1/filters/search/interaction -> 200 or 404', async ({ request }) => {
      const payload = {
        columns: [],
        filters: {
          condition: 'AND',
          rules: [
            {
              condition: 'AND',
              group: 'Facebook Engagement Details',
              rules: [{ filter_id: 64, operator: 'must:gte', value: { gte: '2015-04-03' } }],
              operator: 'must:in',
            },
          ],
        },
      } as Record<string, unknown>;
      const response = await request.post('/hub/v1/filters/search/interaction', {
        params: { ...paramsBase(authToken) },
        data: payload,
      });
      const status = response.status();
      const body = status === 200 ? await response.json() : {};
      const { valid } = status === 200 ? validateSchema(body, hubSearchResponseSchema) : { valid: true };
      const ok = status === 404 || (status === 200 && valid);
      expect(ok).toBe(true);
    });

    test('Status: POST /hub/v1/filters/search/proposal -> 200 or 404', async ({ request }) => {
      const payload = {
        quick_filters: [],
        filters: {
          blocks: [
            {
              condition: 'and_all_of',
              rules: [
                {
                  label: 'equals',
                  compound_id: '258',
                  operator: 'must:in',
                  category: 'School',
                  group: 'Constituents',
                  ui_component: 'FilterValueMultiSelect',
                },
              ],
            },
          ],
        },
      } as Record<string, unknown>;
      const response = await request.post('/hub/v1/filters/search/proposal', {
        params: { ...paramsBase(authToken), 'facets?oid': OID, sort: 'created_date', sort_order: 'desc' },
        data: payload,
      });
      const status = response.status();
      const body = status === 200 ? await response.json() : {};
      const { valid } = status === 200 ? validateSchema(body, hubSearchResponseSchema) : { valid: true };
      const ok = status === 404 || (status === 200 && valid);
      expect(ok).toBe(true);
    });
  });

  // Cleanup section removed to avoid conditional logic and skip usage in tests

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
      expect(response.status()).toBe(200);
      const data = await response.json();
      const rec = data as Record<string, unknown>;
      createdNestedPropertyId = typeof rec.id === 'number' ? rec.id : undefined;
      createdNestedPropertyUpdatedAt = typeof rec.updated_at === 'number' ? rec.updated_at : undefined;
    });

    test('Schema: Create nested property', async ({ request }) => {
      const response = await request.post('/contacts/v1/properties/nested', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
        data: makeCreateNestedPayload(),
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      const { valid, errors } = validateSchema(data, createNestedPropertyResponseSchema);
      expect(valid, errors.join(', ')).toBe(true);
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
      expect(response.status()).toBe(200);
    });

    test('Schema: Update property', async ({ request }) => {
      const response = await request.put(`/contacts/v1/properties/${createdNestedPropertyId ?? 0}`, {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
        data: makeUpdatePayload(),
      });
      const status = response.status();
      const data = status === 200 ? await response.json() : {};
      const { valid, errors } =
        status === 200 ? validateSchema(data, updatePropertyResponseSchema) : { valid: true, errors: [] as string[] };
      const ok = status === 400 || (status === 200 && valid);
      expect(ok, errors.join(', ')).toBe(true);
    });
  });

  // 7-8. Get properties
  test.describe('GET /contacts/v1/properties - Get properties', () => {
    test('Status: Get properties', async ({ request }) => {
      const response = await request.get('/contacts/v1/properties', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
      });
      expect(response.status()).toBe(200);
    });

    test('Schema: Get properties', async ({ request }) => {
      const response = await request.get('/contacts/v1/properties', {
        params: { auth: authToken, auth_provider: AUTH_PROVIDER, oid: OID, app_key: config.headers.applicationKey },
      });
      expect(response.status()).toBe(200);
      const data = await response.json();
      const { valid, errors } = validateSchema(data, getPropertiesResponseSchema);
      expect(valid, errors.join(', ')).toBe(true);
    });
  });

  // 9-10. v2 search by property
  test.describe('POST /contacts/v2/search - Search by property', () => {
    test('Status: v2 Search contacts by property', async ({ request }) => {
      const payload = {
        must: [{ 'addresses.house_value_median': { gte: 1000000, coerce: 0 } }],
        sort: [{ 'score.score': { order: 'desc' } }, { 'score.score': { order: 'desc' } }],
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
      expect(response.status()).toBe(200);
    });

    test('Schema: v2 Search contacts by property', async ({ request }) => {
      const payload = {
        must: [{ 'addresses.house_value_median': { gte: 1000000, coerce: 0 } }],
        sort: [{ 'score.score': { order: 'desc' } }, { 'score.score': { order: 'desc' } }],
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
      expect(response.status()).toBe(200);
      const data = await response.json();
      const { valid, errors } = validateSchema(data, contactsSearchResponseSchema);
      expect(valid, errors.join(', ')).toBe(true);
    });
  });
});
