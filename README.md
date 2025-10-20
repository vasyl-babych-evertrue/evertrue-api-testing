# EverTrue API Testing with Playwright

Project for automated testing of EverTrue API using Playwright Test.

## 📁 Project Structure

```
evertrue-api-testing/
├── config/
│   └── env.config.ts              # Environment configuration and credentials
├── helpers/
│   └── schema-validator.ts        # Schema validation utilities
├── schemas/
│   └── auth.schemas.ts            # JSON schemas for Auth API
├── fixtures/
│   └── auth.fixture.ts            # Authentication fixtures
├── tests/
│   └── auth/
│       ├── auth-session.spec.ts           # Core session management tests
│       ├── auth-session-expiration.spec.ts # Token expiration and lifetime tests
│       ├── auth-link-tokens.spec.ts       # Link Token tests for backend services
│       ├── auth-linkedin-oauth.spec.ts    # LinkedIn OAuth integration tests
│       ├── auth-users.spec.ts             # User management tests
│       ├── auth-roles.spec.ts             # Role management tests
│       └── auth-status.spec.ts            # API status tests
├── playwright.config.ts           # Playwright configuration
├── package.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables (Optional)

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials (if you need to change the default values).

### 3. Run Tests

```bash
# Run all tests
npm test

# Run only authentication tests
npm run test:auth

# Run tests in UI mode
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Show report after execution
npm run report
```

## 📋 Imported Tests from Postman

The project includes tests converted from the Postman collection "Vasyl test":

### Auth API Tests
- ✅ **POST /auth/session** - Create session (login)
- ✅ **GET /auth/session** - Get current session
- ✅ **DELETE /auth/session** - Delete session (logout)
- ✅ **OPTIONS /auth/** - CORS preflight requests
- ✅ **GET /auth/status** - Check API status

All tests include:
- Status code verification
- JSON schema validation (from Postman environment)
- Specific field value verification
- Negative scenarios (invalid credentials, missing headers)

## 📝 Writing Tests

### Basic API Test Example

```typescript
import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';

test.describe('GET /api/endpoint', () => {
  
  test('should return 200 and valid schema', async ({ request }) => {
    const response = await request.get('/api/endpoint', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization': `Basic ${config.auth.basicToken}`,
      },
    });

    // Verify status code
    expect(response.status()).toBe(200);

    // Parse response
    const responseBody = await response.json();

    // Verify schema
    expectSchema(responseBody, {
      id: { type: 'number', required: true },
      name: { type: 'string', required: true },
      items: { 
        type: 'array', 
        required: true,
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', required: true },
            value: { type: 'string', required: true },
          }
        }
      },
    });

    // Verify specific values
    expect(responseBody.id).toBeGreaterThan(0);
    expect(responseBody.name).toBeTruthy();
  });
});
```

### Schema Validation

The `expectSchema` utility supports:

- **Basic types**: `string`, `number`, `boolean`, `object`, `array`, `null`
- **Multiple types**: `{ type: ['string', 'null'] }`
- **Nested objects**: `properties: { ... }`
- **Arrays**: `items: { ... }`
- **Required fields**: `required: true` (default)
- **Optional fields**: `required: false`

### Status Code Verification

```typescript
// Single status code
expect(response.status()).toBe(200);

// Multiple possible status codes
expect([200, 201]).toContain(response.status());
```

### Header Verification

```typescript
const headers = response.headers();
expect(headers['content-type']).toContain('application/json');
```

### POST/PUT/PATCH Requests with Body

```typescript
const response = await request.post('/api/endpoint', {
  headers: {
    'Application-Key': config.headers.applicationKey,
  },
  data: {
    name: 'Test Name',
    value: 123,
  },
});
```

### Using Fixtures for Authentication

Fixtures automatically create a session and provide tokens:

```typescript
import { test, expect } from '../../fixtures/auth.fixture';

test('should access protected endpoint', async ({ authenticatedRequest }) => {
  // authenticatedRequest already contains auth token
  const response = await authenticatedRequest.get('/api/protected-endpoint');
  
  expect(response.status()).toBe(200);
});

test('should use auth token directly', async ({ authToken }) => {
  // Use token directly
  console.log('Auth token:', authToken);
});
```

## 🔧 Configuration

### Change Base URL

In the `playwright.config.ts` file or via environment variable:

```bash
API_BASE_URL=https://prod-api.evertrue.com npm test
```

### Application Keys

The project includes a complete list of application keys for various services in the `config/app-keys.config.ts` file. You can use these keys in your tests:

```typescript
import { getAppKey } from '../config/env.config';

// Use specific service key
const consoleKey = getAppKey('console');
const authApiKey = getAppKey('auth_api');
const contactsApiKey = getAppKey('contacts_api');

// Example usage in test
const response = await request.get('/auth/users/me', {
  params: {
    app_key: getAppKey('console'),
    auth: authToken
  }
});
```

**Available services:**
- `auth_api`, `contacts_api`, `lids_api`, `console`, `community`, `givingtree`
- `capi_migrator`, `csv_importer`, `reds_api`, `reds_shuttle`, `reporting_api`

### 🔐 Application Tokens (Backend Services)

For backend services, App Tokens are available - "godmode" passwords that don't expire:

```typescript
import { getAppToken } from '../config/env.config';

// Use App Token for backend service
const response = await request.post('/auth/link_tokens', {
  headers: {
    'Authorization': getAppToken('volunteers_api'),
    'Authorization-Provider': 'EvertrueAppToken',
    'Application-Key': getAppKey('volunteers_api'),
  },
  data: {
    application: 'volunteers',
    user_id: 136
  }
});
```

**Available App Tokens (STAGING):**
- `volunteers_api`, `auth_api`, `contacts_api`, `lids_api`
- `reds_api`, `reporting_api`, `search_api`, `storm`, `ems_api`
- `dna_api`, `hadoop`, `upload`, `scout_*` сервіси
- `soda_fountain`, `buoys`, `ugc_api`, `harbormaster`
- `payments_api`, `salesforce_syncer`

### 🔗 LinkedIn Authentication Flow

LinkedIn authentication uses the full OAuth 2.0 flow via SODAS/LIDS:

#### **Step 1: Get Authorization URL**
```typescript
const callbackUrl = 'https://your-app.com/callback';
const encodedCallback = encodeURIComponent(callbackUrl);

const response = await request.get(`/lids/auth?callback_url=${encodedCallback}`, {
  headers: {
    'Application-Key': getAppKey('console'),
  }
});

const { authorize_url } = await response.json();
// Redirect user to authorize_url for LinkedIn login
```

#### **Step 2: Exchange Code for Access Token**
```typescript
// After login, LinkedIn will redirect to callback_url with code and state
const response = await request.get(`/lids/callback?code=${code}&state=${state}`);
const { linkedin_access_token } = await response.json();
```

#### **Step 3: Activate Token via LIDS**
```typescript
const activateResponse = await request.put(
  `/lids/auth/association/activate?linkedin_access_token=${linkedin_access_token}`,
  {
    headers: {
      'Application-Key': getAppKey('console'),
    }
  }
);
expect(activateResponse.status()).toBe(204);
```

#### **Step 4: Create Session with Auth API**
```typescript
const authResponse = await request.post('/auth/session', {
  headers: {
    'Authorization-Provider': 'LinkedinAccessToken',
    'Authorization': linkedin_access_token,
  }
});
expect(authResponse.status()).toBe(201);
```

#### **Managing LinkedIn Associations**
```typescript
// Create association (requires existing session)
await request.put(`/lids/auth/association?linkedin_access_token=${token}`, {
  headers: { 'Authorization': authToken }
});

// Check association status
await request.get('/lids/auth/association', {
  headers: { 'Authorization': authToken }
});

// Delete association
await request.delete('/lids/auth/association', {
  headers: { 'Authorization': authToken }
});
```

**Possible LIDS activation errors:**
- `422` - LinkedIn token is missing
- `403` - Invalid LinkedIn token or profile not found
- `404` - LinkedIn profile cannot be matched with user
- `502` - Upstream service error

**Note:** API may return `403` instead of `404` for some cases of failed profile matching.
- `search_api`, `storm`, `ems_api`, `dna_api`, `hadoop`, `upload`
- `scout_auth_api`, `scout_contacts_api`, `scout_lids_api`, `scout_importer`
- `scout_ems_api`, `scout_dna_api`, `soda_fountain`, `buoys`, `ugc_api`
- `harbormaster`, `payments_api`, `windlass`, `salesforce_syncer`
- `volunteers_api`, `volunteers`

### Adding New Headers

Edit `config/env.config.ts`:

```typescript
export const config = {
  headers: {
    applicationKey: process.env.APPLICATION_KEY || DEFAULT_APP_KEY,
    customHeader: process.env.CUSTOM_HEADER || 'default_value',
    // ...
  },
};
```

## 📊 Reports

After test execution, an HTML report is automatically generated:

```bash
npm run report
```

## 🎯 Playwright Advantages for API Testing

- ✅ Built-in API testing support
- ✅ Parallel test execution
- ✅ Detailed reports and traces
- ✅ TypeScript support out-of-the-box
- ✅ Easy CI/CD integration
- ✅ Convenient UI mode for debugging

## 📚 Useful Links

- [Playwright API Testing Documentation](https://playwright.dev/docs/api-testing)
- [Playwright Test Configuration](https://playwright.dev/docs/test-configuration)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)
