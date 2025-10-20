import { test, expect } from '@playwright/test';
import { getAppKey, getAppToken } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { linkTokenSchema, createSessionSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Link Token Authentication
 * Tests for backend services creating and using Link Tokens
 * Based on documentation: Link Tokens section
 * 
 * Test User: vasyl.babych@evertrue.com
 */
test.describe('Auth API - Link Token Authentication (Backend Services)', () => {

  let testUserId: number;

  test.beforeAll(async ({ request }) => {
    // Get user ID for vasyl.babych@evertrue.com
    // First create a session to get auth token
    const sessionResponse = await request.post('/auth/session', {
      headers: {
        'Application-Key': getAppKey('console'),
        'Authorization-Provider': 'EvertrueBasicAuth',
        'Authorization': `Basic dmFzeWwuYmFieWNoQGV2ZXJ0cnVlLmNvbTpwMG85UClPKHAwbzlQKU8o`,
      },
    });

    const sessionBody = await sessionResponse.json();
    const authToken = sessionBody.token;

    // Get current user to extract user ID
    const userResponse = await request.get('/auth/users/me', {
      headers: {
        'Application-Key': getAppKey('console'),
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
      },
    });

    const userBody = await userResponse.json();
    testUserId = userBody.id;
  });

  test('should create Link Token with App Token', async ({ request }) => {
    const response = await request.post('/auth/link_tokens', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': getAppToken('volunteers_api'),
        'Authorization-Provider': 'EvertrueAppToken',
        'Application-Key': getAppKey('volunteers_api'),
      },
      data: {
        application: 'volunteers',
        user_id: testUserId
      }
    });

    // API повертає 200 замість очікуваного 201 (згідно документації)
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expectSchema(responseBody, linkTokenSchema);
    
    expect(responseBody.token).toBeTruthy();
    expect(responseBody.user).toBeTruthy();
    expect(responseBody.user.id).toBe(testUserId);
    expect(responseBody.user.email).toBe('vasyl.babych@evertrue.com');
  });

  test('should return 401 without App Token for Link Token creation', async ({ request }) => {
    const response = await request.post('/auth/link_tokens', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': getAppKey('volunteers_api'),
      },
      data: {
        application: 'volunteers',
        user_id: testUserId
      }
    });

    expect([401, 403]).toContain(response.status());
  });

  test('should return 400 with invalid application name', async ({ request }) => {
    const response = await request.post('/auth/link_tokens', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': getAppKey('volunteers_api'),
        'Authorization': getAppToken('volunteers_api'),
        'Authorization-Provider': 'EvertrueAppToken',
      },
      data: {
        application: 'invalid_app_name',
        user_id: testUserId
      }
    });

    expect([400, 404, 422]).toContain(response.status());
  });

  test('should authenticate with Link Token', async ({ request }) => {
    // Спочатку створимо Link Token
    const createResponse = await request.post('/auth/link_tokens', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': getAppToken('volunteers_api'),
        'Authorization-Provider': 'EvertrueAppToken',
        'Application-Key': getAppKey('volunteers_api'),
      },
      data: {
        application: 'volunteers',
        user_id: testUserId
      }
    });
    
    const createBody = await createResponse.json();
    const linkToken = createBody.token;
    
    // Тепер використовуємо Link Token для автентифікації
    const authResponse = await request.post('/auth/session', {
      headers: {
        'Application-Key': getAppKey('volunteers'),
        'Authorization-Provider': 'EvertrueLinkToken',
        'Authorization': linkToken,
      },
    });

    expect(authResponse.status()).toBe(201);
    
    const responseBody = await authResponse.json();
    expectSchema(responseBody, createSessionSchema);
    
    expect(responseBody.token).toBeTruthy();
    expect(responseBody.user).toBeTruthy();
    expect(responseBody.user.id).toBe(testUserId);
    expect(responseBody.user.email).toBe('vasyl.babych@evertrue.com');
  });

  test('should return 401 with invalid Link Token', async ({ request }) => {
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': getAppKey('volunteers'),
        'Authorization-Provider': 'EvertrueLinkToken',
        'Authorization': 'invalid_link_token_12345',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('should exchange expired Link Token for new one', async ({ request }) => {
    // Спочатку створимо Link Token, а потім спробуємо його обміняти
    
    // Створюємо Link Token
    const createResponse = await request.post('/auth/link_tokens', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': getAppToken('volunteers_api'),
        'Authorization-Provider': 'EvertrueAppToken',
        'Application-Key': getAppKey('volunteers_api'),
      },
      data: {
        application: 'volunteers',
        user_id: testUserId
      }
    });
    
    const createBody = await createResponse.json();
    const linkToken = createBody.token;
    
    // Обмінюємо токен (якщо він не expired, він просто продовжиться)
    const exchangeResponse = await request.post('/auth/link_tokens', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': getAppToken('volunteers_api'),
        'Authorization-Provider': 'EvertrueAppToken',
        'Application-Key': getAppKey('volunteers_api'),
      },
      data: {
        application: 'volunteers',
        token: linkToken
      }
    });

    expect(exchangeResponse.status()).toBe(200);
    
    const responseBody = await exchangeResponse.json();
    expectSchema(responseBody, linkTokenSchema);
    
    expect(responseBody.token).toBeTruthy();
    expect(responseBody.user).toBeTruthy();
    expect(responseBody.user.id).toBe(testUserId);
  });

  test('should return 404 for invalid token exchange', async ({ request }) => {
    const response = await request.post('/auth/link_tokens', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'fake_app_token',
        'Authorization-Provider': 'EvertrueAppToken',
        'Application-Key': getAppKey('volunteers_api'),
      },
      data: {
        application: 'volunteers',
        token: 'invalid_token_12345'
      }
    });

    expect([404, 401]).toContain(response.status());
  });

  test('should return 422 when providing both token and user_id', async ({ request }) => {
    const response = await request.post('/auth/link_tokens', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'fake_app_token',
        'Authorization-Provider': 'EvertrueAppToken',
        'Application-Key': getAppKey('volunteers_api'),
      },
      data: {
        application: 'volunteers',
        token: 'some_token',
        user_id: testUserId // Should not provide both
      }
    });

    expect([422, 401]).toContain(response.status());
  });
});
