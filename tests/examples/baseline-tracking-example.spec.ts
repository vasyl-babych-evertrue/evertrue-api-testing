/**
 * Example test demonstrating API baseline tracking
 * This test shows how API calls are automatically tracked for baseline comparison
 */

import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';

test.describe('API Baseline Tracking Example', () => {
  
  test('example: automatic tracking with standard request', async ({ request }) => {
    // All API calls using the standard 'request' fixture are automatically tracked
    // by the custom reporter configured in playwright.config.ts
    
    const response = await request.get('/auth/status', {
      headers: {
        'Application-Key': config.headers.applicationKey,
      },
    });

    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('status');
    
    // This request/response will be saved in the baseline report:
    // - Method: GET
    // - URL: /auth/status
    // - Status Code: 200
    // - Response Body: { status: "ok", ... }
  });

  test('example: multiple API calls in one test', async ({ request }) => {
    // All API calls in this test will be tracked and associated with this test
    
    // First API call
    const statusResponse = await request.get('/auth/status', {
      headers: {
        'Application-Key': config.headers.applicationKey,
      },
    });
    expect(statusResponse.status()).toBe(200);

    // Second API call - create session
    const sessionResponse = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Device-ID': config.headers.deviceId,
        'host': config.headers.host,
        'Authorization': `Basic ${config.auth.basicToken}`,
      },
    });
    expect(sessionResponse.status()).toBe(201);

    const session = await sessionResponse.json();
    const authToken = session.token;

    // Third API call - get current session
    const getCurrentResponse = await request.get('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
      },
    });
    expect(getCurrentResponse.status()).toBe(200);

    // All three API calls will be saved in the baseline report
    // and can be compared with future test runs
  });

  test('example: POST request with body tracking', async ({ request }) => {
    // Create a session first
    const sessionResponse = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Device-ID': config.headers.deviceId,
        'host': config.headers.host,
        'Authorization': `Basic ${config.auth.basicToken}`,
      },
    });

    const session = await sessionResponse.json();
    const authToken = session.token;

    // Example POST with request body
    // Both request body and response body will be tracked
    const response = await request.post('/auth/affiliations', {
      params: {
        oid: '463'
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
      },
      data: {
        user_id: session.user.id,
        role_ids: [1]
      }
    });

    // The baseline will include:
    // - Request body: { user_id: 123, role_ids: [1] }
    // - Response status: 201 or 422
    // - Response body: { id: 456, user_id: 123, ... }
    
    expect([201, 422]).toContain(response.status());
  });
});

/**
 * HOW TO USE THIS FOR BASELINE COMPARISON:
 * 
 * 1. Run tests BEFORE deploy:
 *    npm run test
 *    copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-before-deploy.json
 * 
 * 2. Deploy your changes
 * 
 * 3. Run tests AFTER deploy:
 *    npm run test
 * 
 * 4. Compare baselines:
 *    npm run baseline:compare -- api-baseline-reports/baseline-before-deploy.json api-baseline-reports/baseline-latest.json
 * 
 * 5. Review the comparison report:
 *    - Critical differences (🔴): Status code changes, new errors
 *    - Warnings (🟡): Missing response fields, test failures
 *    - Info (🔵): New fields, new endpoints
 * 
 * The comparison will show you exactly what changed in the API behavior!
 */
