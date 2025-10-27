/**
 * Enhanced Playwright fixture for API request/response tracking
 * Automatically logs all API calls for baseline comparison
 */

import { test as base, APIRequestContext, APIResponse } from '@playwright/test';

type ApiTrackingFixtures = {
  trackedRequest: APIRequestContext;
};

/**
 * Wraps APIRequestContext to track all requests and responses
 */
class TrackedAPIRequestContext {
  constructor(
    private context: APIRequestContext,
    private testInfo: any
  ) {}

  private async trackApiCall(
    method: string,
    url: string,
    options: any,
    response: APIResponse
  ) {
    try {
      const requestBody = options?.data || options?.form || options?.multipart;
      let responseBody: any;
      
      // Try to parse response body
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          responseBody = await response.json();
        } else {
          responseBody = await response.text();
        }
      } catch (e) {
        responseBody = '[Unable to parse response body]';
      }

      const apiCallData = {
        method: method.toUpperCase(),
        url: url,
        headers: options?.headers || {},
        requestBody: requestBody,
        statusCode: response.status(),
        responseHeaders: response.headers(),
        responseBody: responseBody,
        duration: 0, // Will be calculated by reporter
        timestamp: new Date().toISOString(),
      };

      // Attach API call data to test
      await this.testInfo.attach('api-call-data', {
        body: JSON.stringify(apiCallData),
        contentType: 'application/json',
      });
    } catch (error) {
      console.error('Failed to track API call:', error);
    }
  }

  async get(url: string, options?: any): Promise<APIResponse> {
    const response = await this.context.get(url, options);
    await this.trackApiCall('GET', url, options, response);
    return response;
  }

  async post(url: string, options?: any): Promise<APIResponse> {
    const response = await this.context.post(url, options);
    await this.trackApiCall('POST', url, options, response);
    return response;
  }

  async put(url: string, options?: any): Promise<APIResponse> {
    const response = await this.context.put(url, options);
    await this.trackApiCall('PUT', url, options, response);
    return response;
  }

  async patch(url: string, options?: any): Promise<APIResponse> {
    const response = await this.context.patch(url, options);
    await this.trackApiCall('PATCH', url, options, response);
    return response;
  }

  async delete(url: string, options?: any): Promise<APIResponse> {
    const response = await this.context.delete(url, options);
    await this.trackApiCall('DELETE', url, options, response);
    return response;
  }

  async head(url: string, options?: any): Promise<APIResponse> {
    const response = await this.context.head(url, options);
    await this.trackApiCall('HEAD', url, options, response);
    return response;
  }

  // Delegate other methods to original context
  async dispose() {
    return this.context.dispose();
  }

  async fetch(urlOrRequest: string | any, options?: any): Promise<APIResponse> {
    const response = await this.context.fetch(urlOrRequest, options);
    const url = typeof urlOrRequest === 'string' ? urlOrRequest : urlOrRequest.url;
    const method = options?.method || 'GET';
    await this.trackApiCall(method, url, options, response);
    return response;
  }

  storageState(options?: any) {
    return this.context.storageState(options);
  }
}

/**
 * Extended test with API tracking
 */
export const test = base.extend<ApiTrackingFixtures>({
  trackedRequest: async ({ request }, use, testInfo) => {
    const tracked = new TrackedAPIRequestContext(request, testInfo);
    await use(tracked as any);
  },
});

export { expect } from '@playwright/test';
