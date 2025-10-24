import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  oauth2TokenResponseSchema,
  getUsersResponseSchema,
  eventbriteReportResponseSchema,
} from '../../schemas/events.schemas';

/**
 * Eventbrite OAuth - Positive Flow (3 GET endpoints × status + schema)
 * Endpoints from Postman:
 * - GET /events/v1/oauth2?state=...
 * - GET /events/v1/user
 * - GET /events/v1/report?start_date=...&end_date=...
 */

const OID = '463';

// Use the same dates as in Postman example to avoid server-side constraints
const START_DATE = '2022-07-12 15:27:12';
const END_DATE = '2022-10-12 15:27:12';
const STATE = 'LcZCDI3qdxGTsEmLW6xtRPa9TL9wqaRwuJyEXW52wKjYTMpBWfTFxCP1T4yawMve';

test.describe('Events API - Eventbrite OAuth (Positive Tests)', () => {
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

  // 1. GET /events/v1/oauth2 (status + schema)
  test('Status: GET /events/v1/oauth2', async ({ request }) => {
    const response = await request.get('/events/v1/oauth2', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
        state: STATE,
      },
    });
    expect(response.status()).toBe(200);
  });

  test('Schema: GET /events/v1/oauth2', async ({ request }) => {
    const response = await request.get('/events/v1/oauth2', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
        state: STATE,
      },
    });
    expect(response.status()).toBe(200);
    const contentType = response.headers()['content-type'] || '';
    if (contentType.includes('application/json')) {
      const body = await response.json();
      expectSchema(body, oauth2TokenResponseSchema);
    } else {
      // Some environments return an HTML redirect/landing page for oauth2
      const text = await response.text();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    }
  });

  // 2. GET /events/v1/user (status + schema)
  test('Status: GET /events/v1/user', async ({ request }) => {
    const response = await request.get('/events/v1/user', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
    });
    expect(response.status()).toBe(200);
  });

  test('Schema: GET /events/v1/user', async ({ request }) => {
    const response = await request.get('/events/v1/user', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, getUsersResponseSchema);
  });

  // 3. GET /events/v1/report (status + schema)
  test('Status: GET /events/v1/report', async ({ request }) => {
    const response = await request.get('/events/v1/report', {
      params: {
        auth: authToken,
        app_key: config.headers.applicationKey,
        oid: OID,
        start_date: START_DATE,
        end_date: END_DATE,
      },
    });
    expect(response.status()).toBe(200);
  });

  test('Schema: GET /events/v1/report', async ({ request }) => {
    const response = await request.get('/events/v1/report', {
      params: {
        auth: authToken,
        app_key: config.headers.applicationKey,
        oid: OID,
        start_date: START_DATE,
        end_date: END_DATE,
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, eventbriteReportResponseSchema);
  });
});
