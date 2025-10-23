import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  createEventbriteProfileResponseSchema,
  getEventbriteProfilesResponseSchema,
  eventbriteMatchedContactIdsResponseSchema,
  eventbriteMatchedContactIdByEventResponseSchema,
  getEventbriteProfileEngagementsResponseSchema,
  getEventbriteProfileResponseSchema,
  getEventbriteProfileByEmailResponseSchema,
} from '../../schemas/events.schemas';

/**
 * Eventbrite Profiles API - Positive Flow (8 tests based on Postman)
 */

const OID = '463';
const EMAIL = 'yaroslavkondria@gmail.com';
const PROFILE_ID = '875655';
const SAMPLE_EVENT_ID = '541';

test.describe('Events API - Eventbrite Profiles (Positive Tests)', () => {
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

  // 1. Create an Eventbrite profile
  test('Create an Eventbrite profile', async ({ request }) => {
    const response = await request.post('/events/v1/eventbrite_profile/', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
      data: { email: EMAIL },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, createEventbriteProfileResponseSchema);
  });

  // 2. Get Eventbrite Profiles (with filters)
  test('Get Eventbrite Profiles (with filters)', async ({ request }) => {
    const response = await request.get('/events/v1/eventbrite_profile', {
      params: {
        'name[]': EMAIL,
        'email[]': EMAIL,
        'match_status[]': 'unmatched',
        'match_status[]': 'match_queued',
        'event_id[]': '123',
        'event_id[]': '456',
        'response_type[]': 'attending',
        'response_type[]': 'unsure',
        auth: authToken,
        app_key: config.headers.applicationKey,
        oid: OID,
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, getEventbriteProfilesResponseSchema);
  });

  // 3. Get Matched Contact IDs
  test('Get Eventbrite Matched Contact IDs', async ({ request }) => {
    const response = await request.get('/events/v1/eventbrite_profile/matched_contact_ids', {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, eventbriteMatchedContactIdsResponseSchema);
  });

  // 4. Get Matched Contact ID by Event ID (541)
  test('Get Matched Contact ID by Event ID', async ({ request }) => {
    const response = await request.get(`/events/v1/eventbrite_profile/matched_contact_id/${SAMPLE_EVENT_ID}`, {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, eventbriteMatchedContactIdByEventResponseSchema);
  });

  // 5. Get Eventbrite Profile by ID
  test('Get Eventbrite Profile by ID', async ({ request }) => {
    const response = await request.get(`/events/v1/eventbrite_profile/${PROFILE_ID}`, {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, getEventbriteProfileResponseSchema);
  });

  // 6. Get Eventbrite Profile by Email
  test('Get Eventbrite Profile by Email', async ({ request }) => {
    const response = await request.get(`/events/v1/eventbrite_profile/email/${encodeURIComponent(EMAIL)}`, {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, getEventbriteProfileByEmailResponseSchema);
  });

  // 7. Get Eventbrite Profile Engagements by ID
  test('Get Eventbrite Profile Engagements by ID', async ({ request }) => {
    const response = await request.get(`/events/v1/eventbrite_profile/${PROFILE_ID}/engagements`, {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, getEventbriteProfileEngagementsResponseSchema);
  });

  // 8. Get Eventbrite Profile Engagements by Email
  test('Get Eventbrite Profile Engagements by Email', async ({ request }) => {
    const response = await request.get(`/events/v1/eventbrite_profile/email/${encodeURIComponent(EMAIL)}/engagements`, {
      params: { oid: OID, auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, getEventbriteProfileEngagementsResponseSchema);
  });
});
