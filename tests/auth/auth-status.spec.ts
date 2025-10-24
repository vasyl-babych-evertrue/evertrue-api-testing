import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { expectSchema } from '../../helpers/schema-validator';
import { statusSchema } from '../../schemas/auth.schemas';

/**
 * Auth API Tests - Status Check
 * Based on Postman collection: "Get status"
 */
test.describe('GET /auth/status', () => {
  
  test('should return status ok with 200', async ({ request }) => {
    // Note: This endpoint uses production API, not stage
    const response = await request.get('https://api.evertrue.com/auth/status');

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Parse response body
    const responseBody = await response.json();
    // Verify response schema
    expectSchema(responseBody, statusSchema);

    // Verify status is "ok"
    expect(responseBody.status).toBe('ok');
  });

  test('should return status ok on stage environment', async ({ request }) => {
    const response = await request.get('https://stage-api.evertrue.com/auth/status');

    // Verify status code is 200
    expect(response.status()).toBe(200);

    // Parse response body
    const responseBody = await response.json();

    // Verify status is "ok"
    expect(responseBody.status).toBe('ok');
  });
});
