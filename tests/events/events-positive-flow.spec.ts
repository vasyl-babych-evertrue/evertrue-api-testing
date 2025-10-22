/**
 * Positive test cases for Events API
 * Covers all main endpoints with valid requests
 */

import { test as base, expect, APIRequestContext } from '@playwright/test';
import Joi from 'joi';
import { validateSchema } from '../../helpers/schema-validator';
import { eventSchema, createEventFullResponseSchema } from '../../schemas/events.schemas';
import { config } from '../../config/env.config';

// Define test fixtures interface
interface TestFixtures {
  apiRequest: APIRequestContext;
  oid: number;
  testEventData: {
    name: string;
    description: string;
    startTime: number;
    endTime: number;
    location: {
      name: string;
      city: string;
      country: string;
      state: string;
      street: string;
      zip: string;
      latitude: number;
      source: string;
    };
  };
}

// Extend base test with our fixtures
const test = base.extend<TestFixtures>({
  // API request context with authentication
  apiRequest: async ({}, use) => {
    const request = await base.request.newContext({
      baseURL: config.baseURL,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    await use(request);
    await request.dispose();
  },
  
  // Organization ID
  oid: async ({}, use) => {
    // Use environment variable or default value
    const oid = parseInt(process.env.ORGANIZATION_ID || '463', 10);
    await use(oid);
  },
  
  // Test event data
  testEventData: async ({}, use) => {
    const now = Date.now();
    const testData = {
      id: Math.floor(Math.random() * 10000), // Random remote_id
      name: `Test Event ${now}`,
      description: 'This is a test event',
      startTime: now + 86400000, // 1 day from now in milliseconds
      endTime: now + 90000000, // 25 hours from now in milliseconds
      source: 'TEST',
      remoteId: `test-${now}`,
      location: {
        id: Math.floor(Math.random() * 1000), // Random location ID
        name: 'Test Location',
        city: 'Test City',
        country: 'Test Country',
        state: 'TS',
        street: '123 Test St',
        zip: '12345',
        latitude: 42.361145,
        longitude: -71.057083,
        source: 'TEST'
      }
    };
    await use(testData);
  }
});

test.describe('Events API Positive Tests @api', () => {
  let createdEventId: string;
  let authToken: string;

  test.beforeAll(async () => {
    const request = await base.request.newContext({ baseURL: config.baseURL });
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
    await request.dispose();
  });

  test('should create a new event', async ({ apiRequest, testEventData, oid }) => {
    const now = Date.now();
    const requestData = {
      id: testEventData.id,
      oid: oid,
      name: testEventData.name,
      description: testEventData.description,
      locationId: testEventData.location.id,
      locationName: null,
      startTime: testEventData.startTime,
      endTime: testEventData.endTime,
      source: 'FACEBOOK',
      remoteId: testEventData.remoteId,
      payload: {
        id: testEventData.id,
        oid: 0,
        name: testEventData.name,
        description: testEventData.description,
        locationId: null,
        locationName: null,
        startTime: testEventData.startTime,
        endTime: testEventData.endTime,
        createdAt: 0,
        updatedAt: 0,
        place: {
          name: testEventData.location.name,
          location: {
            id: 0,
            remoteId: null,
            source: null,
            name: null,
            city: testEventData.location.city,
            country: testEventData.location.country,
            state: testEventData.location.state,
            street: testEventData.location.street,
            zip: testEventData.location.zip,
            createdAt: 0,
            updatedAt: 0,
            latitude: testEventData.location.latitude,
            longitude: testEventData.location.longitude,
          },
        },
      },
      createdAt: now,
      updatedAt: now,
      location: {
        id: testEventData.location.id,
        remote_id: null,
        source: 'FACEBOOK',
        name: null,
        city: testEventData.location.city,
        country: testEventData.location.country,
        state: testEventData.location.state,
        street: testEventData.location.street,
        zip: testEventData.location.zip,
        created_at: new Date().getFullYear(),
        updated_at: new Date().getFullYear(),
        latitude: testEventData.location.latitude,
        longitude: testEventData.location.longitude,
      },
    };

    const response = await apiRequest.post('/events/v1/event/create/event', {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
      data: requestData,
    });
    const responseText = await response.text();
    expect(response.status()).toBe(200);
    const responseData = responseText ? JSON.parse(responseText) : {};
    createdEventId = responseData.id;
    const { valid, errors } = validateSchema(responseData, eventSchema);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
  });

  // Mirrors Postman: Create a standard event (POST /create/event)
  test('should create a standard event (POST /create/event)', async ({ apiRequest, oid }) => {
    const requestData = {
      id: 15,
      oid: oid,
      name: 'new best party',
      description: 'best times ever for realz11',
      locationId: 30,
      locationName: null,
      startTime: 1478822400000,
      endTime: 1478833200000,
      source: 'FACEBOOK',
      remoteId: '123',
      payload: {
        id: 441,
        oid: 0,
        name: 'Ber',
        description: 'best times ever for realz',
        locationId: null,
        locationName: null,
        startTime: 1478822400000,
        endTime: 1478833200000,
        createdAt: 0,
        updatedAt: 0,
        place: {
          name: 'Liberty Hotel Boston',
          location: {
            id: 0,
            remoteId: null,
            source: null,
            name: null,
            city: 'Boston',
            country: 'United States',
            state: 'MA',
            street: '215 Charles St',
            zip: '02114',
            createdAt: 0,
            updatedAt: 0,
            latitude: 42.36192,
            longitude: -71.06995,
          },
        },
      },
      createdAt: 1497470797000,
      updatedAt: 1497470797000,
      location: {
        id: 30,
        remote_id: null,
        source: 'FACEBOOK',
        name: null,
        city: 'Boston',
        country: 'United States',
        state: 'MA',
        street: '215 Charles St',
        zip: '02114',
        created_at: 2017,
        updated_at: 2017,
        latitude: 42.36192,
        longitude: -71.06995,
      },
    };

    const response = await apiRequest.post('/events/v1/event/create/event', {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
      data: requestData,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const { valid, errors } = validateSchema(body, createEventFullResponseSchema);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
    if (!createdEventId) {
      createdEventId = body.id;
    }
  });

  test('should get event by ID', async ({ apiRequest, testEventData, oid }) => {
    const now = Date.now();
    const requestData = {
      id: testEventData.id,
      oid: oid,
      name: testEventData.name,
      description: testEventData.description,
      locationId: testEventData.location.id,
      locationName: null,
      startTime: testEventData.startTime,
      endTime: testEventData.endTime,
      source: 'FACEBOOK',
      remoteId: testEventData.remoteId,
      payload: {
        id: testEventData.id,
        oid: 0,
        name: testEventData.name,
        description: testEventData.description,
        locationId: null,
        locationName: null,
        startTime: testEventData.startTime,
        endTime: testEventData.endTime,
        createdAt: 0,
        updatedAt: 0,
        place: {
          name: testEventData.location.name,
          location: {
            id: 0,
            remoteId: null,
            source: null,
            name: null,
            city: testEventData.location.city,
            country: testEventData.location.country,
            state: testEventData.location.state,
            street: testEventData.location.street,
            zip: testEventData.location.zip,
            createdAt: 0,
            updatedAt: 0,
            latitude: testEventData.location.latitude,
            longitude: testEventData.location.longitude,
          },
        },
      },
      createdAt: now,
      updatedAt: now,
      location: {
        id: testEventData.location.id,
        remote_id: null,
        source: 'FACEBOOK',
        name: null,
        city: testEventData.location.city,
        country: testEventData.location.country,
        state: testEventData.location.state,
        street: testEventData.location.street,
        zip: testEventData.location.zip,
        created_at: new Date().getFullYear(),
        updated_at: new Date().getFullYear(),
        latitude: testEventData.location.latitude,
        longitude: testEventData.location.longitude,
      },
    };

    const createResponse = await apiRequest.post('/events/v1/event/create/event', {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
      data: requestData,
    });
    expect(createResponse.status()).toBe(200);
    const eventData = await createResponse.json();
    const eventId = eventData.id;

    const response = await apiRequest.get(`/events/v1/event/${eventId}`, {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    const { valid, errors } = validateSchema(responseData, eventSchema);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
    expect(responseData.id).toBe(eventId);
  });

  test('should get event by remote ID', async ({ apiRequest, testEventData, oid }) => {
    const remoteId = `test-remote-${Date.now()}`;
    const now = Date.now();
    const requestData = {
      id: testEventData.id,
      oid: oid,
      name: testEventData.name,
      description: testEventData.description,
      locationId: testEventData.location.id,
      locationName: null,
      startTime: testEventData.startTime,
      endTime: testEventData.endTime,
      source: 'FACEBOOK',
      remoteId: remoteId,
      payload: {
        id: testEventData.id,
        oid: 0,
        name: testEventData.name,
        description: testEventData.description,
        locationId: null,
        locationName: null,
        startTime: testEventData.startTime,
        endTime: testEventData.endTime,
        createdAt: 0,
        updatedAt: 0,
        place: {
          name: testEventData.location.name,
          location: {
            id: 0,
            remoteId: null,
            source: null,
            name: null,
            city: testEventData.location.city,
            country: testEventData.location.country,
            state: testEventData.location.state,
            street: testEventData.location.street,
            zip: testEventData.location.zip,
            createdAt: 0,
            updatedAt: 0,
            latitude: testEventData.location.latitude,
            longitude: testEventData.location.longitude,
          },
        },
      },
      createdAt: now,
      updatedAt: now,
      location: {
        id: testEventData.location.id,
        remote_id: null,
        source: 'FACEBOOK',
        name: null,
        city: testEventData.location.city,
        country: testEventData.location.country,
        state: testEventData.location.state,
        street: testEventData.location.street,
        zip: testEventData.location.zip,
        created_at: new Date().getFullYear(),
        updated_at: new Date().getFullYear(),
        latitude: testEventData.location.latitude,
        longitude: testEventData.location.longitude,
      },
    };

    const createResponse = await apiRequest.post('/events/v1/event/create/event', {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
      data: requestData,
    });
    expect(createResponse.status()).toBe(200);

    const response = await apiRequest.get(`/events/v1/event/remote_id/${remoteId}`, {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
    });
    expect(response.status()).toBe(200);
    const responseData = await response.json();
    const { valid, errors } = validateSchema(responseData, eventSchema);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
    expect(responseData.remoteId).toBe(remoteId);
  });

  // Mirrors Postman: Create a Facebook event
  test('should create a Facebook event', async ({ apiRequest, oid }) => {
    const fbPayload = {
      id: '55614',
      start_time: '2016-11-10T19:00:00-0500',
      end_time: '2016-11-10T22:00:00-0500',
      name: 'WWE Superslam',
      description: 'John Cena in a no holds barred triple double match - ladders! chainsaws! explosions! fireballs! popcorn!',
      place: {
        name: 'WWE Superslam arena',
        location: {
          city: 'Boston',
          country: 'United States',
          latitude: 42.36192,
          longitude: -71.06995,
          state: 'MA',
          street: '215 Charles St',
          zip: '02114',
        },
        id: '1583031808522344',
      },
    };

    const response = await apiRequest.post('/events/v1/event/facebook', {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
      data: fbPayload,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const { valid, errors } = validateSchema(body, eventSchema);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
  });

  // Mirrors Postman: Create an Eventbrite event
  test('should create an Eventbrite event', async ({ apiRequest, oid }) => {
    const ebPayload = {
      id: '5515',
      name: { text: 'Huge beach party!!' },
      description: { text: 'There will be free food and dogs!' },
      start: { timezone: 'America/New_York', utc: '2017-08-23T15:00:00Z' },
      end: { timezone: 'America/New_York', utc: '2017-08-23T16:00:00Z' },
      venue_id: 'SKDJGH23425',
      logo: { id: '34536715', url: 'https://img.com/' },
      status: 'live',
    };

    const response = await apiRequest.post('/events/v1/event/eventbrite', {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
      data: ebPayload,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const { valid, errors } = validateSchema(body, eventSchema);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
  });

  // Mirrors Postman: Create an Eventbrite Venue
  test('should create an Eventbrite venue', async ({ apiRequest, oid }) => {
    const venuePayload = {
      id: '20605116',
      name: 'The Beach',
      address: {
        address_1: '15 Ocean St',
        city: 'Hyannis',
        region: 'MA',
        postal_code: '02601',
        country: 'US',
        latitude: '41.6530114',
        longitude: '-70.28205049999997',
      },
    };

    const response = await apiRequest.post('/events/v1/event/eventbrite/venue', {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
      data: venuePayload,
    });
    expect(response.status()).toBe(200);
    // Response schema is not defined in our Joi set; assert body is an object
    const body = await response.json();
    expect(typeof body).toBe('object');
  });

  // Mirrors Postman: Load Events From User
  test('should load events from user', async ({ apiRequest, oid }) => {
    const response = await apiRequest.post('/events/v1/event/eventbrite/user/event/78', {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
      data: {},
    });
    const status = response.status();
    expect([200, 409]).toContain(status);
    if (status === 200) {
      const body = await response.json();
      // Minimal schema similar to Postman getSingleFieldSchema
      const getSingleFieldSchema = Joi.object({
        items: Joi.array(),
        limit: Joi.number(),
        total: Joi.number(),
        offset: Joi.number(),
        scroll: Joi.boolean(),
      });
      const { valid, errors } = validateSchema(body, getSingleFieldSchema);
      expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
    }
  });

  // Mirrors Postman: Delete Event endpoint
  test('should delete the created event', async ({ apiRequest, oid }) => {
    if (!createdEventId) {
      test.skip(true, 'No event to delete');
    }
    const response = await apiRequest.delete(`/events/v1/event/${createdEventId}/delete`, {
      params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
    });
    expect([200, 204]).toContain(response.status());
    // avoid double delete in afterAll
    createdEventId = undefined as unknown as string;
  });

  test.afterAll(async ({ apiRequest, oid }) => {
    if (createdEventId) {
      try {
        await apiRequest.delete(`/events/v1/event/delete/${createdEventId}`, {
          params: { oid: oid.toString(), auth: authToken, app_key: config.headers.applicationKey },
        });
      } catch (error) {
        console.warn('Failed to clean up test event:', error);
      }
    }
  });
});
