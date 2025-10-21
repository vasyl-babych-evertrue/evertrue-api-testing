/**
 * Positive test cases for Events API
 * Covers all main endpoints with valid requests
 */

import { test as base, expect, APIRequestContext } from '@playwright/test';
import { validateSchema } from '../../helpers/schema-validator';
import {
    eventSchema,
    locationSchema,
    createEventSchema,
    facebookEventSchema,
    eventbriteVenueSchema,
    eventbriteEventSchema,
    eventEngagementSchema,
    paginatedEventsSchema,
    paginatedEngagementsSchema,
    eventbriteProfileSchema,
    paginatedEventbriteProfilesSchema,
    eventbriteAttendeeSchema
} from '../../schemas/events.schemas';
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
  let createdRemoteId: string;
  let authToken: string;

  test.beforeAll(async () => {
    // Create session to get auth token using base request context
    // Using Super Admin token for Events API access
    const request = await base.request.newContext({
      baseURL: config.baseURL,
    });

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
    console.log('Super Admin auth token obtained:', authToken);
    
    await request.dispose();
  });

  test('should create a new event', async ({ apiRequest, testEventData, oid }) => {
    // Prepare request data according to the valid format from Postman
    const now = Date.now();
    const requestData = {
      id: testEventData.id,
      oid: oid,
      name: testEventData.name,
      description: testEventData.description,
      locationId: testEventData.location.id,
      locationName: testEventData.location.name,
      startTime: testEventData.startTime,
      endTime: testEventData.endTime,
      source: testEventData.source,
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
            longitude: testEventData.location.longitude
          }
        }
      },
      createdAt: now,
      updatedAt: now,
      location: {
        id: testEventData.location.id,
        remote_id: null,
        source: testEventData.source,
        name: null,
        city: testEventData.location.city,
        country: testEventData.location.country,
        state: testEventData.location.state,
        street: testEventData.location.street,
        zip: testEventData.location.zip,
        created_at: new Date().getFullYear(),
        updated_at: new Date().getFullYear(),
        latitude: testEventData.location.latitude,
        longitude: testEventData.location.longitude
      }
    };

    // Log the request data for debugging
    console.log('Sending request with data:', JSON.stringify(requestData, null, 2));
    
    // Make the request with proper query parameters using params
    const response = await apiRequest.post('/events/v1/event/create/event', {
      params: {
        oid: oid.toString(),
        auth: authToken,
        app_key: config.headers.applicationKey
      },
      data: requestData
    });

    const responseText = await response.text();
    console.log('Response status:', response.status());
    console.log('Response body:', responseText);
    expect(response.status()).toBe(200); // According to Postman collection, expected status is 200
    
    const responseData = responseText ? JSON.parse(responseText) : {};
    
    // Store created event IDs for cleanup
    createdEventId = responseData.id;
    createdRemoteId = responseData.remoteId;
    
    // Validate response schema
    const { valid, errors } = validateSchema(responseData, eventSchema);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
    
    // Validate response data matches request
    expect(responseData.name).toBe(testEventData.name);
    expect(responseData.description).toBe(testEventData.description);
    expect(responseData.startTime).toBe(testEventData.startTime);
    expect(responseData.endTime).toBe(testEventData.endTime);
    
    // Validate location data if present
    if (responseData.location) {
      expect(responseData.location.city).toBe(testEventData.location.city);
      expect(responseData.location.country).toBe(testEventData.location.country);
    }
  });

  test('should get event by ID', async ({ apiRequest, testEventData, oid }) => {
    // First create an event to get its ID
    const requestData = {
      ...testEventData,
      oid: oid,
      locationId: testEventData.location.id,
      locationName: testEventData.location.name
    };
    
    const createResponse = await apiRequest.post('/events/v1/event/create/event', {
      params: {
        oid: oid.toString(),
        auth: authToken,
        app_key: config.headers.applicationKey
      },
      data: requestData
    });
    
    expect(createResponse.status()).toBe(200);
    
    const eventData = await createResponse.json();
    const eventId = eventData.id;
    
    // Now get the event by ID with the organization ID in the query params
    const response = await apiRequest.get(`/events/v1/event/${eventId}`, {
      params: {
        oid: oid.toString(),
        auth: authToken,
        app_key: config.headers.applicationKey
      }
    });
    
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    
    // Validate response schema
    const { valid, errors } = validateSchema(responseData, eventSchema);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
    
    // Validate the returned event has the same ID
    expect(responseData.id).toBe(eventId);
  });

  test('should get event by remote ID', async ({ apiRequest, testEventData, oid }) => {
    // Create an event with a specific remote ID
    const remoteId = `test-remote-${Date.now()}`;
    
    const requestData = {
      ...testEventData,
      oid: oid,
      remoteId: remoteId,
      locationId: testEventData.location.id,
      locationName: testEventData.location.name
    };
    
    const createResponse = await apiRequest.post('/events/v1/event/create/event', {
      params: {
        oid: oid.toString(),
        auth: authToken,
        app_key: config.headers.applicationKey
      },
      data: requestData
    });
    
    expect(createResponse.status()).toBe(200);
    
    // Now get the event by remote ID with the organization ID in the query params
    const response = await apiRequest.get(`/events/v1/event/remote_id/${remoteId}`, {
      params: {
        oid: oid.toString(),
        auth: authToken,
        app_key: config.headers.applicationKey
      }
    });
    
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    
    // Validate response schema
    const { valid, errors } = validateSchema(responseData, eventSchema);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);
    
    // Validate the returned event has the same remote ID
    expect(responseData.remoteId).toBe(remoteId);
  });

  test.afterAll(async ({ apiRequest, oid }) => {
    // Cleanup: Delete the created event if it exists
    if (createdEventId) {
      try {
        await apiRequest.delete(`/events/v1/event/delete/${createdEventId}`, {
          params: {
            oid: oid.toString(),
            auth: authToken,
            app_key: config.headers.applicationKey
          }
        });
      } catch (error) {
        console.warn('Failed to clean up test event:', error);
      }
    }
  });
});