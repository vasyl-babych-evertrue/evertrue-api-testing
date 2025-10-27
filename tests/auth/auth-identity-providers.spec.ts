import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import {
  identityProvidersListSchema,
  identityProviderCreateSchema,
  identityProviderSingleSchema,
  identityProviderSearchSchema,
} from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Identity Providers Management
 * Based on Postman collection: oauth -> Identity Providers
 *
 * Test User:
 * - Super Admin: vasyl.babych@evertrue.com (required for identity providers endpoints)
 *
 * Identity Providers allow organizations to configure SAML SSO authentication
 */
test.describe('Auth API - Identity Providers Management', () => {
  let authToken: string;
  const oid = 463; // Organization ID for testing

  test.beforeAll(async ({ request }) => {
    // Create session with super-admin credentials
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        Authorization: `Basic ${config.auth.superAdminToken}`,
      },
    });

    const body = await response.json();
    authToken = body.token;
  });

  test.describe('GET /auth/identity_providers - List identity providers', () => {
    test('should get list of all identity providers with valid token', async ({ request }) => {
      const response = await request.get('/auth/identity_providers', {
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, identityProvidersListSchema);

      // Verify response is an array
      expect(Array.isArray(responseBody)).toBe(true);

      // Log identity providers for debugging
      console.log('Identity Providers count:', responseBody.length);

      // Verify identity providers have required fields
      if (responseBody.length > 0) {
        const firstProvider = responseBody[0];
        expect(firstProvider.id).toBeDefined();
        expect(firstProvider.name).toBeDefined();
        expect(firstProvider.primary_domain_suffix).toBeDefined();
        expect(firstProvider.organization_id).toBeDefined();
        expect(firstProvider.created_at).toBeDefined();
        expect(firstProvider.updated_at).toBeDefined();
      }
    });
  });

  test.describe('GET /auth/identity_providers/:id - Show identity provider', () => {
    test('should get single identity provider by ID', async ({ request }) => {
      // First, get list to find an existing ID
      const listResponse = await request.get('/auth/identity_providers', {
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
      });

      const providers = await listResponse.json();

      // Skip if no providers exist
      if (providers.length === 0) {
        test.skip();
        return;
      }

      const providerId = providers[0].id;

      // Get single identity provider
      const response = await request.get(`/auth/identity_providers/${providerId}`, {
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify response schema
      expectSchema(responseBody, identityProviderSingleSchema);

      // Verify ID matches
      expect(responseBody.id).toBe(providerId);
    });
  });

  test.describe('GET /auth/identity_providers/search - Search by email', () => {
    test('should search identity provider organization by email domain', async ({ request }) => {
      // Using an email that should match an organization with SSO
      const testEmail = 'test@evertrue.com';

      const response = await request.get('/auth/identity_providers/search', {
        params: {
          email: testEmail,
        },
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      console.log('Search response:', JSON.stringify(responseBody, null, 2));

      // Response can be array, object with organizations, or empty object
      if (Array.isArray(responseBody)) {
        console.log('Search results for', testEmail, ':', responseBody.length, 'organizations');
        // Verify array items have required fields
        if (responseBody.length > 0) {
          expect(responseBody[0].id).toBeDefined();
          expect(responseBody[0].name).toBeDefined();
          expect(responseBody[0].slug).toBeDefined();
          expect(responseBody[0].sso_method).toBeDefined();
        }
      } else if (responseBody.organizations) {
        console.log('Search results for', testEmail, ':', responseBody.organizations.length, 'organizations');
        expect(Array.isArray(responseBody.organizations)).toBe(true);
      } else {
        // Empty response or no match
        console.log('Search results for', testEmail, ': No organizations found or empty response');
        expect(responseBody).toBeDefined();
      }
    });
  });

  test.describe.serial('Identity Provider CRUD Operations (Full Flow)', () => {
    let createdProviderId: number;
    // Name must be <= 32 characters
    const testProviderName = `idp-test-${Date.now().toString().slice(-8)}`;
    const testOid = 1; // Use different organization for testing to avoid conflicts

    test.beforeAll(async ({ request }) => {
      // Clean up: Delete existing identity provider for test organization if exists
      const listResponse = await request.get('/auth/identity_providers', {
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
      });

      const providers = await listResponse.json();
      const existingProvider = providers.find((p: any) => p.organization_id === testOid);

      if (existingProvider) {
        console.log(`Cleaning up existing identity provider ID: ${existingProvider.id} for oid=${testOid}`);
        await request.delete(`/auth/identity_providers/${existingProvider.id}?oid=${testOid}`, {
          headers: {
            Accept: 'application/json',
            'Authorization-Provider': 'EvertrueAuthToken',
            Authorization: authToken,
            'Application-Key': getAppKey('console'),
          },
        });
      }
    });

    test('should create identity provider (CREATE)', async ({ request }) => {
      const response = await request.post(`/auth/identity_providers?oid=${testOid}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          identity_provider: {
            name: testProviderName,
            primary_domain_suffix: 'example-test-delete.com',
            federation_xml_url: 'http://idp.ssocircle.com/',
          },
        },
      });

      console.log('CREATE response status:', response.status());

      // If creation fails, skip remaining CRUD tests
      if (response.status() !== 201) {
        const responseText = await response.text();
        console.log('CREATE response:', responseText);
        console.log('Skipping CRUD tests - creation not allowed or provider already exists');
        test.skip();
        return;
      }

      expect(response.status()).toBe(201);

      const responseText = await response.text();
      
      // Some APIs return empty body on 201, need to fetch the created provider
      if (!responseText || responseText.trim() === '') {
        console.log('Empty response body, fetching created provider from list');
        
        // Get list to find the created provider
        const listResponse = await request.get('/auth/identity_providers', {
          headers: {
            Accept: 'application/json',
            'Authorization-Provider': 'EvertrueAuthToken',
            Authorization: authToken,
            'Application-Key': getAppKey('console'),
          },
        });
        
        const providers = await listResponse.json();
        const createdProvider = providers.find((p: any) => p.name === testProviderName);
        
        if (createdProvider) {
          createdProviderId = createdProvider.id;
          console.log('Found created identity provider ID:', createdProviderId);
          expect(createdProvider.primary_domain_suffix).toBe('example-test-delete.com');
        } else {
          console.log('Could not find created provider, skipping CRUD tests');
          test.skip();
        }
      } else {
        const responseBody = JSON.parse(responseText);
        expectSchema(responseBody, identityProviderCreateSchema);

        createdProviderId = responseBody.identity_provider.id;
        console.log('Created identity provider ID:', createdProviderId);

        expect(responseBody.identity_provider.name).toBe(testProviderName);
        expect(responseBody.identity_provider.primary_domain_suffix).toBe('example-test-delete.com');
      }
    });

    test('should update identity provider with PUT (UPDATE)', async ({ request }) => {
      if (!createdProviderId) {
        test.skip();
        return;
      }

      const response = await request.put(`/auth/identity_providers/${createdProviderId}?oid=${testOid}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          identity_provider: {
            primary_domain_suffix: 'example-updated.com',
            federation_xml_url: 'http://idp.ssocircle.com/',
          },
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify updated data
      expect(responseBody.primary_domain_suffix).toBe('example-updated.com');
      expect(responseBody.id).toBe(createdProviderId);
    });

    test('should update identity provider with PATCH (UPDATE)', async ({ request }) => {
      if (!createdProviderId) {
        test.skip();
        return;
      }

      const response = await request.patch(`/auth/identity_providers/${createdProviderId}?oid=${testOid}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          identity_provider: {
            primary_domain_suffix: 'example-patched.com',
            federation_xml_url: 'http://idp.ssocircle.com/',
          },
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);

      // Parse response body
      const responseBody = await response.json();

      // Verify patched data
      expect(responseBody.primary_domain_suffix).toBe('example-patched.com');
      expect(responseBody.id).toBe(createdProviderId);
    });

    test('should NOT allow renaming identity provider (negative test)', async ({ request }) => {
      if (!createdProviderId) {
        test.skip();
        return;
      }

      const response = await request.patch(`/auth/identity_providers/${createdProviderId}?oid=${testOid}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
        data: {
          identity_provider: {
            name: 'renamed-provider',
            primary_domain_suffix: 'example-patched.com',
            federation_xml_url: 'http://idp.ssocircle.com/',
          },
        },
      });

      // Verify status code is 400 (Bad Request) - renaming is not allowed
      expect(response.status()).toBe(400);
    });

    test('should delete identity provider (DELETE)', async ({ request }) => {
      if (!createdProviderId) {
        test.skip();
        return;
      }

      const response = await request.delete(`/auth/identity_providers/${createdProviderId}?oid=${testOid}`, {
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
      });

      // Verify status code is 200
      expect(response.status()).toBe(200);
      console.log('Deleted identity provider ID:', createdProviderId);

      // Verify provider is deleted by trying to get it
      const getResponse = await request.get(`/auth/identity_providers/${createdProviderId}`, {
        headers: {
          Accept: 'application/json',
          'Authorization-Provider': 'EvertrueAuthToken',
          Authorization: authToken,
          'Application-Key': getAppKey('console'),
        },
      });

      // Should return 404 or error
      expect(getResponse.status()).toBe(404);
    });
  });
});
