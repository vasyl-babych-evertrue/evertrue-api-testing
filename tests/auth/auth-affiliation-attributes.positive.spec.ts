import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { 
  affiliationAttributesListSchema,
  affiliationAttributeBaseSchema,
  affiliationAttributeSchema,
  personasListSchema,
  senioritiesListSchema
} from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Affiliation Attributes (Positive Tests)
 * Based on documentation: Affiliation Attributes endpoints
 * 
 * Affiliation attributes store additional information about a user's affiliation with an organization,
 * including title, persona, seniority, profile picture, and NPS score.
 * 
 * Test User: Super Admin (vasyl.babych@evertrue.com) - required for affiliation attribute operations
 */
test.describe.serial('Auth API - Affiliation Attributes (Positive Tests)', () => {
  let authToken: string;
  let createdAttributeId: number;
  let testAffiliationId: number = 2322; // Known affiliation ID from test data

  test.beforeAll(async ({ request }) => {
    // Create session with Super Admin credentials
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
      },
    });

    const body = await response.json();
    authToken = body.token;

    // Delete existing affiliation_attribute if it exists (to allow POST test to work)
    const listResponse = await request.get('/auth/affiliation_attributes?oid=463', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
      },
    });

    const listBody = await listResponse.json();
    if (listBody.affiliation_attributes && listBody.affiliation_attributes.length > 0) {
      const existingId = listBody.affiliation_attributes[0].id;
      await request.delete(`/auth/affiliation_attributes/${existingId}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });
      console.log(`Deleted existing affiliation_attribute ${existingId} before tests`);
    }
  });

  test.describe('GET /auth/affiliation_attributes - List affiliation attributes', () => {
    test('should get list of affiliation attributes with valid token and return 200', async ({ request }) => {
      const response = await request.get('/auth/affiliation_attributes?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      console.log('Affiliation Attributes List Response:', JSON.stringify(body, null, 2));

      // Validate response schema
      expectSchema(body, affiliationAttributesListSchema);

      // Validate structure
      expect(body).toHaveProperty('affiliation_attributes');
      expect(Array.isArray(body.affiliation_attributes)).toBe(true);

      // If there are attributes, validate first item structure
      if (body.affiliation_attributes.length > 0) {
        const firstAttr = body.affiliation_attributes[0];
        expect(firstAttr).toHaveProperty('id');
        expect(firstAttr).toHaveProperty('title');
        expect(firstAttr).toHaveProperty('persona');
        expect(firstAttr).toHaveProperty('seniority');
        expect(firstAttr).toHaveProperty('created_at');
        expect(firstAttr).toHaveProperty('updated_at');
        expect(firstAttr).toHaveProperty('affiliation');
        
        // Validate data types
        expect(typeof firstAttr.id).toBe('number');
        if (firstAttr.affiliation) {
          expect(typeof firstAttr.affiliation.id).toBe('number');
        }
      }
    });

    test('should return empty array when no affiliation attributes exist', async ({ request }) => {
      const response = await request.get('/auth/affiliation_attributes?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      
      // Validate response schema
      expectSchema(body, affiliationAttributesListSchema);
      
      // Should have affiliation_attributes property even if empty
      expect(body).toHaveProperty('affiliation_attributes');
      expect(Array.isArray(body.affiliation_attributes)).toBe(true);
    });
  });

  test.describe('POST /auth/affiliation_attributes - Create affiliation attribute', () => {
    test('should create affiliation attribute with valid data and return 201', async ({ request }) => {
      const now = Date.now();
      const attributeData = {
        title: 'Swan_QA_Engineer',
        persona: 'Other',
        seniority: 'President / VP / Executive Director',
        user_profile_picture_url: 'https://stage-api.evertrue.com/lids/users/4567/linkedin/avatar',
        user_profile_picture_source: 'sodas',
        user_profile_picture_last_updated: '2021-07-07T01:00:47.000Z',
        nps_score: 5,
        nps_score_date: '2021-07-07T01:00:47.000Z',
        created_at: now,
        updated_at: now,
        affiliation_id: testAffiliationId,
        school_division_department: null
      };

      const response = await request.post('/auth/affiliation_attributes?oid=463', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: attributeData
      });

      console.log('POST Response Status:', response.status());
      if (response.status() !== 201) {
        const errorBody = await response.text();
        console.log('POST Error Response:', errorBody);
      }

      expect(response.status()).toBe(201);

      const body = await response.json();
      console.log('Affiliation Attribute Create Response:', JSON.stringify(body, null, 2));

      // Validate response schema (POST returns base schema without affiliation)
      expectSchema(body, affiliationAttributeBaseSchema);

      // Validate response data
      expect(body).toHaveProperty('id');
      expect(typeof body.id).toBe('number');
      expect(body.title).toBe(attributeData.title);
      expect(body.persona).toBe(attributeData.persona);
      expect(body.seniority).toBe(attributeData.seniority);

      // Store created ID for subsequent tests
      createdAttributeId = body.id;
    });

  });

  test.describe('GET /auth/affiliation_attributes/:id - Get affiliation attribute by ID', () => {
    test('should get affiliation attribute by ID with valid token and return 200', async ({ request }) => {
      // Use the created attribute ID from POST test
      const attributeId = createdAttributeId;

      // Get the affiliation attribute by ID
      const response = await request.get(`/auth/affiliation_attributes/${attributeId}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      console.log('Affiliation Attribute by ID Response:', JSON.stringify(body, null, 2));

      // Validate response schema (GET by ID returns full schema with affiliation)
      expectSchema(body, affiliationAttributeSchema);

      // Validate structure
      expect(body).toHaveProperty('id');
      expect(body.id).toBe(attributeId);
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('persona');
      expect(body).toHaveProperty('seniority');
      expect(body).toHaveProperty('affiliation');
    });

  });

  test.describe('PATCH /auth/affiliation_attributes/:id - Update affiliation attribute', () => {
    test('should update affiliation attribute title and return 200', async ({ request }) => {
      // Use the created attribute ID from POST test
      const attributeId = createdAttributeId;

      // Update the title
      const updateData = {
        title: 'Updated Title',
        nps_score: 8
      };

      const response = await request.patch(`/auth/affiliation_attributes/${attributeId}?oid=463`, {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
          'Content-Type': 'application/json',
        },
        data: updateData
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      console.log('Affiliation Attribute Update Response:', JSON.stringify(body, null, 2));

      // Validate response schema (PATCH returns base schema without affiliation)
      expectSchema(body, affiliationAttributeBaseSchema);

      // Validate updated fields
      expect(body.id).toBe(attributeId);
      expect(body.title).toBe(updateData.title);
      expect(body.nps_score).toBe(updateData.nps_score);
    });

  });


  test.describe('GET /auth/personas - List personas', () => {
    test('should get list of personas and return 200', async ({ request }) => {
      const response = await request.get('/auth/personas', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      console.log('Personas List Response:', JSON.stringify(body, null, 2));

      // Validate response schema
      expectSchema(body, personasListSchema);

      // Validate structure
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      // Validate first persona structure
      const firstPersona = body[0];
      expect(firstPersona).toHaveProperty('id');
      expect(firstPersona).toHaveProperty('value');
      expect(typeof firstPersona.id).toBe('number');
      expect(typeof firstPersona.value).toBe('string');
    });
  });

  test.describe('GET /auth/seniorities - List seniorities', () => {
    test('should get list of seniorities and return 200', async ({ request }) => {
      const response = await request.get('/auth/seniorities', {
        headers: {
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      console.log('Seniorities List Response:', JSON.stringify(body, null, 2));

      // Validate response schema
      expectSchema(body, senioritiesListSchema);

      // Validate structure
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      // Validate first seniority structure
      const firstSeniority = body[0];
      expect(firstSeniority).toHaveProperty('id');
      expect(firstSeniority).toHaveProperty('value');
      expect(typeof firstSeniority.id).toBe('number');
      expect(typeof firstSeniority.value).toBe('string');
    });
  });

});
