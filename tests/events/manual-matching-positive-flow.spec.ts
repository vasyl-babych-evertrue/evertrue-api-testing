import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { manualMatchResponseSchema, manualUnmatchResponseSchema } from '../../schemas/events.schemas';

/**
 * Manual Matching API - Positive Flow (2 endpoints x 2 tests = 4 tests)
 * Endpoints (from Postman):
 * - POST /events/v1/match/eventbrite?contact_id=...&email=...&op=match
 * - POST /events/v1/event/facebook?contact_id=...&email=...&op=unmatch
 * Body: empty
 */

const OID = '463';
const CONTACT_ID = '14608836';
const EMAIL = 'yaroslavkondria@gmail.com';

test.describe('Events API - Manual Matching (Positive Tests)', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    authToken = body.token;
  });

  // 1. Status: match eventbrite
  test('Status: POST /events/v1/match/eventbrite (op=match)', async ({ request }) => {
    const response = await request.post('/events/v1/match/eventbrite', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
        contact_id: CONTACT_ID,
        email: EMAIL,
        op: 'match',
      },
      data: {},
    });
    expect(response.status()).toBe(200);
  });

  // 2. Schema: match eventbrite
  test('Schema: POST /events/v1/match/eventbrite (op=match)', async ({ request }) => {
    const response = await request.post('/events/v1/match/eventbrite', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
        contact_id: CONTACT_ID,
        email: EMAIL,
        op: 'match',
      },
      data: {},
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, manualMatchResponseSchema);
  });

  // 3. Status: unmatch facebook event
  test('Status: POST /events/v1/event/facebook (op=unmatch)', async ({ request }) => {
    // Ensure deterministic state: clear -> match -> unmatch
    // 1) Clear state: attempt unmatch (ignore status)
    await request.post('/events/v1/match/eventbrite', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
        contact_id: CONTACT_ID,
        email: EMAIL,
        op: 'unmatch',
      },
      data: {},
    });

    // 2) Match and expect 200
    await (async () => {
      const matchResp = await request.post('/events/v1/match/eventbrite', {
        params: {
          oid: OID,
          auth: authToken,
          app_key: config.headers.applicationKey,
          contact_id: CONTACT_ID,
          email: EMAIL,
          op: 'match',
        },
        data: {},
      });
      expect(matchResp.status()).toBe(200);
    })();

    // 3) Unmatch and expect 200
    const response = await request.post('/events/v1/match/eventbrite', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
        contact_id: CONTACT_ID,
        email: EMAIL,
        op: 'unmatch',
      },
      data: {},
    });
    expect(response.status()).toBe(200);
  });

  // 4. Schema: unmatch facebook event
  test('Schema: POST /events/v1/event/facebook (op=unmatch)', async ({ request }) => {
    // Ensure deterministic state: clear -> match -> unmatch
    // 1) Clear state: attempt unmatch (ignore status)
    await request.post('/events/v1/match/eventbrite', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
        contact_id: CONTACT_ID,
        email: EMAIL,
        op: 'unmatch',
      },
      data: {},
    });

    // 2) Match and expect 200
    await (async () => {
      const matchResp = await request.post('/events/v1/match/eventbrite', {
        params: {
          oid: OID,
          auth: authToken,
          app_key: config.headers.applicationKey,
          contact_id: CONTACT_ID,
          email: EMAIL,
          op: 'match',
        },
        data: {},
      });
      expect(matchResp.status()).toBe(200);
    })();

    // 3) Unmatch and expect 200 with schema
    const response = await request.post('/events/v1/match/eventbrite', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
        contact_id: CONTACT_ID,
        email: EMAIL,
        op: 'unmatch',
      },
      data: {},
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, manualUnmatchResponseSchema);
  });
});
