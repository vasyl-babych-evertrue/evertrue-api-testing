import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  emmaAccountsArraySchema,
  emmaAccountCreateResponseSchema,
  emmaAccountSchema,
  emmaDeleteEmptyResponseSchema,
  emmaMembersListSchema,
} from '../../schemas/emma.schemas';
import { generateFullName } from '../../helpers/test-data-generator';

/**
 * Emma API - Accounts and Members (Positive Flow)
 * - Strict imports from global fixture
 * - Single expected status per test
 * - Strict Joi schema validation via expectSchema
 */

// Split OIDs per instruction: idempotent (GET) -> 158, non-idempotent (POST/PUT/DELETE) -> 463
// Allow override via env
const OID_READ = process.env.EMMA_OID_READ || '158';
const OID_WRITE = process.env.EMMA_OID_WRITE || '463';

test.describe.configure({ mode: 'serial' });

test.describe('Emma API - Accounts and Members (Positive)', () => {
  let authToken: string;
  let createdAccount: { id: number; remote_id: number } | null = null;

  test.beforeAll(async ({ request }) => {
    const auth = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        Authorization: `Basic ${config.auth.superAdminToken}`,
      },
    });
    expect(auth.status()).toBe(201);
    const body = await auth.json();
    authToken = body.token;
    expect(authToken).toBeTruthy();
  });

  test('GET /emma/v1/account/?oid={oid} returns accounts array', async ({ request }) => {
    const resp = await request.get('/emma/v1/account/', {
      params: { oid: OID_READ, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expectSchema(data, emmaAccountsArraySchema);
  });

  test('POST /emma/v1/account/?oid={oid} creates an account', async ({ request }) => {
    const name = generateFullName();
    const remoteId = Math.floor(Date.now() / 1000);
    const resp = await request.post('/emma/v1/account/', {
      params: { oid: OID_WRITE, auth: authToken, app_key: config.headers.applicationKey },
      data: {
        remote_id: remoteId,
        name,
        public_api_key: Buffer.from('public_key_' + remoteId).toString('base64'),
        private_api_key: Buffer.from('private_key_' + remoteId).toString('base64'),
      },
    });
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expectSchema(data, emmaAccountCreateResponseSchema);
    createdAccount = { id: data.id, remote_id: data.remote_id };
  });

  test('GET /emma/v1/account/{id}?oid={oid} returns the created account', async ({ request }) => {
    expect(createdAccount).toBeTruthy();
    const resp = await request.get(`/emma/v1/account/${createdAccount!.id}`, {
      params: { oid: OID_WRITE, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expectSchema(data, emmaAccountSchema);
  });

  test('GET /emma/v1/account/remote_id/{remote_id}?oid={oid} returns the account', async ({ request }) => {
    expect(createdAccount).toBeTruthy();
    const resp = await request.get(`/emma/v1/account/remote_id/${createdAccount!.remote_id}`, {
      params: { oid: OID_WRITE, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expectSchema(data, emmaAccountSchema);
  });

  test('PUT /emma/v1/account/{id}/credentials?oid={oid} updates credentials', async ({ request }) => {
    expect(createdAccount).toBeTruthy();
    const newSuffix = Math.floor(Date.now() / 1000);
    const resp = await request.put(`/emma/v1/account/${createdAccount!.id}/credentials`, {
      params: { oid: OID_WRITE, auth: authToken, app_key: config.headers.applicationKey },
      data: {
        public_key: Buffer.from('updated_public_' + newSuffix).toString('base64'),
        private_key: 'updated_private_' + newSuffix,
      },
    });
    expect(resp.status()).toBe(200);
  });

  test('GET /emma/v1/member/?oid={oid} returns members list', async ({ request }) => {
    const resp = await request.get('/emma/v1/member/', {
      params: { oid: OID_READ, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(resp.status()).toBe(200);
    const data = await resp.json();
    expectSchema(data, emmaMembersListSchema);
  });

  test('DELETE /emma/v1/account/{id}?oid={oid} deletes the created account', async ({ request }) => {
    expect(createdAccount).toBeTruthy();
    const resp = await request.delete(`/emma/v1/account/${createdAccount!.id}`, {
      params: { oid: OID_WRITE, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(resp.status()).toBe(200);
    const text = await resp.text();
    expectSchema(text as unknown as any, emmaDeleteEmptyResponseSchema);
  });
});
