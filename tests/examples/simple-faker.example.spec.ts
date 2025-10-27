/**
 * ПРОСТИЙ приклад використання Faker
 * 
 * DO NOT RUN - це тільки приклад!
 */

import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import {
  generateEmail,
  generateFirstName,
  generateLastName,
  generatePhone,
  randomPick,
} from '../../helpers/test-data-generator';

test.describe.skip('Простий приклад з Faker', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
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

  test('Приклад: створити користувача', async ({ request }) => {
    // Генеруємо дані
    const email = generateEmail();
    const firstName = generateFirstName();
    const lastName = generateLastName();
    const phone = generatePhone();

    console.log('Згенеровані дані:', { email, firstName, lastName, phone });
    // {
    //   email: 'test.1234567890@example.com',
    //   firstName: 'John',
    //   lastName: 'Doe',
    //   phone: '+1-234-567-8900'
    // }

    const response = await request.post('/auth/users', {
      headers: {
        'Authorization-Provider': 'EvertrueAuthToken',
        Authorization: authToken,
        'Application-Key': getAppKey('console'),
      },
      data: {
        email: email,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
      },
    });

    expect(response.status()).toBe(201);
  });

  test('Приклад: випадковий вибір', async ({ request }) => {
    const role = randomPick(['Admin', 'User', 'Guest']);
    
    console.log('Випадкова роль:', role);

    const response = await request.post('/auth/users', {
      headers: {
        'Authorization-Provider': 'EvertrueAuthToken',
        Authorization: authToken,
        'Application-Key': getAppKey('console'),
      },
      data: {
        email: generateEmail(),
        first_name: generateFirstName(),
        last_name: generateLastName(),
        role: role,
      },
    });

    expect(response.status()).toBe(201);
  });
});
