# Migration from Postman to Playwright

This document describes the process of converting tests from Postman collection to Playwright Test.

## 🔄 What Was Done

### 1. Project Structure
- ✅ Created `schemas/` folder for JSON schemas
- ✅ Created `fixtures/` folder for shared fixtures
- ✅ Organized tests by endpoints

### 2. Converted Tests
From Postman collection **"Vasyl test"** the following were converted:

#### Auth API (5 tests)
- `POST /auth/session` - Create session
- `GET /auth/session` - Get current session
- `DELETE /auth/session` - Delete session
- `OPTIONS /auth/` - CORS preflight
- `GET /auth/status` - API status

### 3. Schemas from Postman Environment
Schemas from `Staging Swan QA valid Copy 210-15.postman_environment.json` converted to TypeScript:
- `currentSessionSchema` - for GET /auth/session
- `createSessionSchema` - for POST /auth/session
- `statusSchema` - for GET /auth/status

## 📝 How to Add New Tests

### Step 1: Find Test in Postman Collection

Open the file `tests/auth/Vasyl test.postman_collection.json` and find the required request.

Example Postman request structure:
```json
{
  "name": "Get User by ID",
  "event": [{
    "listen": "test",
    "script": {
      "exec": [
        "pm.test(\"Status code is 200\", function () {",
        "    pm.response.to.have.status(200);",
        "});"
      ]
    }
  }],
  "request": {
    "method": "GET",
    "header": [...],
    "url": {
      "raw": "https://stage-api.evertrue.com/users/{{userId}}"
    }
  }
}
```

### Step 2: Create Schema (if needed)

If the test uses a schema from Postman environment, add it to `schemas/`:

```typescript
// schemas/users.schemas.ts
export const getUserSchema: Schema = {
  id: { type: 'number', required: true },
  name: { type: 'string', required: true },
  email: { type: 'string', required: true },
  // ...
};
```

### Step 3: Write Playwright Test

```typescript
// tests/users/get-user.spec.ts
import { test, expect } from '@playwright/test';
import { config } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { getUserSchema } from '../../schemas/users.schemas';

test.describe('GET /users/:id', () => {
  
  test('should return user by id with 200', async ({ request }) => {
    const userId = 123; // or from fixture
    
    const response = await request.get(`/users/${userId}`, {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Status code
    expect(response.status()).toBe(200);

    // Schema
    const body = await response.json();
    expectSchema(body, getUserSchema);

    // Specific values
    expect(body.id).toBe(userId);
  });
});
```

## 🔍 Postman → Playwright Mapping

### Status Codes
```javascript
// Postman
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Playwright
expect(response.status()).toBe(200);
```

### JSON Schema Verification
```javascript
// Postman
pm.test("Response matches schema", function () {
    let schema = JSON.parse(pm.variables.get("userSchema"));
    pm.response.to.have.jsonSchema(schema);
});

// Playwright
import { expectSchema } from '../../helpers/schema-validator';
import { userSchema } from '../../schemas/users.schemas';

expectSchema(responseBody, userSchema);
```

### Field Value Verification
```javascript
// Postman
pm.test("Status is ok", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql("ok");
});

// Playwright
const body = await response.json();
expect(body.status).toBe("ok");
```

### Saving Variables
```javascript
// Postman
let jsonData = pm.response.json();
pm.environment.set("auth_token", jsonData.token);

// Playwright - use variables in test
const body = await response.json();
const authToken = body.token;
// or use fixtures
```

### Headers
```javascript
// Postman
{
  "key": "Application-Key",
  "value": "{{auth_api}}",
  "type": "text"
}

// Playwright
headers: {
  'Application-Key': config.headers.applicationKey,
}
```

### Query Parameters
```javascript
// Postman URL
"raw": "https://stage-api.evertrue.com/users?page=1&limit=10"

// Playwright
const response = await request.get('/users', {
  params: {
    page: 1,
    limit: 10,
  },
});
```

### Body (POST/PUT/PATCH)
```javascript
// Postman
{
  "body": {
    "mode": "raw",
    "raw": "{\"name\": \"Test\", \"email\": \"test@example.com\"}"
  }
}

// Playwright
const response = await request.post('/users', {
  data: {
    name: 'Test',
    email: 'test@example.com',
  },
});
```

## 🎯 Tips

### 1. Group Tests Logically
```typescript
test.describe('Users API', () => {
  test.describe('GET /users', () => {
    test('should return list of users', ...);
    test('should filter by name', ...);
  });
  
  test.describe('POST /users', () => {
    test('should create user', ...);
    test('should validate required fields', ...);
  });
});
```

### 2. Use beforeAll/beforeEach for Setup
```typescript
test.describe('Protected endpoints', () => {
  let authToken: string;
  
  test.beforeAll(async ({ request }) => {
    // Create session once for all tests
    const response = await request.post('/auth/session', {...});
    const body = await response.json();
    authToken = body.token;
  });
  
  test('should access endpoint', async ({ request }) => {
    // Use token
  });
});
```

### 3. Create Fixtures for Reusable Logic
```typescript
// fixtures/users.fixture.ts
export const test = base.extend({
  testUser: async ({ request }, use) => {
    // Create test user
    const response = await request.post('/users', {...});
    const user = await response.json();
    
    await use(user);
    
    // Cleanup - delete user
    await request.delete(`/users/${user.id}`);
  },
});
```

### 4. Add console.log for Debugging
```typescript
const body = await response.json();
console.log('Response:', JSON.stringify(body, null, 2));
```

## 📊 Migration Progress

- ✅ Auth API (5/5 tests)
- ⏳ Users API (0/? tests)
- ⏳ Organizations API (0/? tests)
- ⏳ Other endpoints

## 🔗 Useful Links

- [Playwright API Testing](https://playwright.dev/docs/api-testing)
- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [JSON Schema Validation](https://json-schema.org/)
