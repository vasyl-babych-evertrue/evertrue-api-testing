import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  singleEngagementResponseSchema,
  postFacebookEngagementsResponseSchema,
  postEventbriteEngagementsResponseSchema,
  postEventbriteEngagementsByRemoteIdResponseSchema,
  getEventEngagementsResponseSchema,
  deleteEngagementResponseSchema,
  getEventbriteProfileEngagementsResponseSchema,
} from '../../schemas/events.schemas';

/**
 * Event Engagement API Positive Flow (based on Postman collection)
 */

const OID = '463';

let createdEngagementId: number;

test.describe('Events API - Engagements (Positive Flow)', () => {
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

  test('Create an Engagement for Event ID 543', async ({ request }) => {
    const response = await request.post('/events/v1/event/create/543/engagement', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
      data: {
        id: 4281,
        oid: 463,
        profileRemoteId: '1245',
        name: 'Champ',
        contactId: 999,
        eventId: 11,
        engagementAction: 'interested',
        engagedAt: 1497471265000,
        createdAt: 1497471265000,
        updatedAt: 1497540937000,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, singleEngagementResponseSchema);
    // capture created engagement id for deletion tests
    createdEngagementId = (body as any).id ?? (body as any).engagement?.id ?? 4281;
  });

  test('Create new Facebook Event Engagements (event ID 541)', async ({ request }) => {
    const response = await request.post('/events/v1/event/facebook/541/engagements', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
      data: [
        { name: 'Finn the Human', id: '1245', rsvp_status: 'attending' },
        { name: 'Jake the Dog', id: '1245', rsvp_status: 'unsure' },
      ],
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, postFacebookEngagementsResponseSchema);
  });

  test('Create new Eventbrite Event Engagements by Event Remote ID (5513)', async ({ request }) => {
    const response = await request.post('/events/v1/event/eventbrite/remote_id/5513/engagements', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
      data: [
        { id: 'SGHE14', profile: { name: 'Orlando Bloom', email: 'orlando.bloom@aim.com' }, status: 'Attending' },
        { id: 'WOVJS234', profile: { name: 'Luna the Dog', email: 'luna@yahoo.net' }, status: 'Not attending' },
      ],
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, postEventbriteEngagementsByRemoteIdResponseSchema);
  });

  test('Create new Eventbrite Event Engagements (event ID 543)', async ({ request }) => {
    const response = await request.post('/events/v1/event/eventbrite/543/engagements', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
      data: [
        { id: 'SGHE14', profile: { name: 'Orlando Bloom', email: 'orlando.bloom@aim.com' }, status: 'Attending' },
        { id: 'WOVJS234', profile: { name: 'Luna the Dog', email: 'luna@yahoo.net' }, status: 'Not attending' },
      ],
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, postEventbriteEngagementsResponseSchema);
  });

  test('Get Event Engagements (paginate)', async ({ request }) => {
    const response = await request.get('/events/v1/event/engagements', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
    });

    // Postman expects 200
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, getEventEngagementsResponseSchema);
  });

  // Delete Engagement (single) - /events/v1/event/engagement/541/delete
  test('Delete Engagement (single)', async ({ request }) => {
    // Ensure we have a valid engagement id: query engagements and pick a matching/first id
    const listResp = await request.get('/events/v1/event/engagements', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
    });
    expect(listResp.status()).toBe(200);
    const listBody = await listResp.json();
    // Try to find by previously created id, else take first available
    const items = (listBody as any).items || listBody;
    const found = Array.isArray(items)
      ? items.find((it: any) => it?.id === createdEngagementId) || items[0]
      : undefined;
    const idToDelete = found?.id ?? createdEngagementId;

    const response = await request.delete(`/events/v1/event/engagement/${idToDelete}/delete`, {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, deleteEngagementResponseSchema);
  });

  // Delete Engagements For Event - /events/v1/event/541/engagement/delete
  test('Delete Engagements For Event', async ({ request }) => {
    const response = await request.delete('/events/v1/event/541/engagement/delete', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
    });
    expect(response.status()).toBe(204);
  });

  // Get Eventbrite Profile Engagements by ID
  test('Get Eventbrite Profile Engagements by ID', async ({ request }) => {
    const response = await request.get('/events/v1/eventbrite_profile/875655/engagements', {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
    });
    // Postman expects 200
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, getEventbriteProfileEngagementsResponseSchema);
  });

  // Get Eventbrite Profile Engagements by email
  test('Get Eventbrite Profile Engagements by Email', async ({ request }) => {
    const email = 'yaroslavkondria@gmail.com';
    const response = await request.get(`/events/v1/eventbrite_profile/email/${encodeURIComponent(email)}/engagements`, {
      params: {
        oid: OID,
        auth: authToken,
        app_key: config.headers.applicationKey,
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, getEventbriteProfileEngagementsResponseSchema);
  });
});
