/**
 * Global fixture for automatic API tracking
 * Wraps the default request fixture to log all API calls
 */

import { test as base, APIRequestContext, APIResponse } from '@playwright/test';

// Store API calls for the current test
let currentTestApiCalls: any[] = [];

// Wrapper for APIResponse to capture response data
class TrackedAPIResponse {
  constructor(
    private originalResponse: APIResponse,
    private callData: any,
    private testInfo: any
  ) {}

  async captureAndAttach() {
    try {
      let responseBody: any;
      const contentType = this.originalResponse.headers()['content-type'] || '';
      
      if (contentType.includes('application/json')) {
        responseBody = await this.originalResponse.json();
      } else if (contentType.includes('text/')) {
        responseBody = await this.originalResponse.text();
      } else {
        responseBody = '[Binary content]';
      }

      const apiCallData = {
        ...this.callData,
        statusCode: this.originalResponse.status(),
        responseHeaders: this.originalResponse.headers(),
        responseBody: responseBody,
        timestamp: new Date().toISOString(),
      };

      // Attach to test
      await this.testInfo.attach('api-call-data', {
        body: JSON.stringify(apiCallData),
        contentType: 'application/json',
      });
    } catch (error) {
      console.error('Failed to capture API response:', error);
    }

    return this.originalResponse;
  }

  // Proxy all APIResponse methods
  status() { return this.originalResponse.status(); }
  statusText() { return this.originalResponse.statusText(); }
  headers() { return this.originalResponse.headers(); }
  headersArray() { return this.originalResponse.headersArray(); }
  ok() { return this.originalResponse.ok(); }
  url() { return this.originalResponse.url(); }
  async body() { return this.originalResponse.body(); }
  async text() { return this.originalResponse.text(); }
  async json() { return this.originalResponse.json(); }
  async dispose() { return this.originalResponse.dispose(); }
}

// Wrapper for APIRequestContext
class TrackedAPIRequestContext {
  constructor(
    private context: APIRequestContext,
    private testInfo: any
  ) {}

  private async wrapRequest(
    method: string,
    urlOrRequest: string | any,
    options?: any
  ): Promise<APIResponse> {
    const url = typeof urlOrRequest === 'string' ? urlOrRequest : urlOrRequest.url;
    const startTime = Date.now();

    // Make the actual request
    const response = await this.context.fetch(urlOrRequest, {
      ...options,
      method: method,
    });

    const duration = Date.now() - startTime;

    // Prepare call data
    const callData = {
      method: method.toUpperCase(),
      url: url,
      headers: options?.headers || {},
      requestBody: options?.data || options?.form || options?.multipart || null,
      duration: duration,
    };

    // Create tracked response and capture data
    const trackedResponse = new TrackedAPIResponse(response, callData, this.testInfo);
    await trackedResponse.captureAndAttach();

    return response;
  }

  async get(url: string, options?: any): Promise<APIResponse> {
    return this.wrapRequest('GET', url, options);
  }

  async post(url: string, options?: any): Promise<APIResponse> {
    return this.wrapRequest('POST', url, options);
  }

  async put(url: string, options?: any): Promise<APIResponse> {
    return this.wrapRequest('PUT', url, options);
  }

  async patch(url: string, options?: any): Promise<APIResponse> {
    return this.wrapRequest('PATCH', url, options);
  }

  async delete(url: string, options?: any): Promise<APIResponse> {
    return this.wrapRequest('DELETE', url, options);
  }

  async head(url: string, options?: any): Promise<APIResponse> {
    return this.wrapRequest('HEAD', url, options);
  }

  async fetch(urlOrRequest: string | any, options?: any): Promise<APIResponse> {
    const method = options?.method || 'GET';
    return this.wrapRequest(method, urlOrRequest, options);
  }

  // Delegate other methods
  async dispose() {
    return this.context.dispose();
  }

  storageState(options?: any) {
    return this.context.storageState(options);
  }
}

export const test = base.extend<{}>({
  request: async ({ request }: { request: APIRequestContext }, use: (r: APIRequestContext) => Promise<void>, testInfo: any) => {
    // Wrap the request context
    const tracked = new TrackedAPIRequestContext(request, testInfo);
    await use(tracked as any as APIRequestContext);
  },
});

export { expect, APIRequestContext } from '@playwright/test';
