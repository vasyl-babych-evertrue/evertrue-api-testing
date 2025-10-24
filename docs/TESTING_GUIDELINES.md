# 📋 Testing Guidelines - Правила написання тестів

## 🎯 Загальні принципи

### 1. Структура тестового файлу

```typescript
// 1. Імпорти (завжди в такому порядку)
import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey, getAppToken } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { yourSchema } from '../../schemas/your.schemas';

// 2. Опис тесту
/**
 * Auth API Tests - Feature Name (Positive/Negative Tests)
 * Опис що тестується
 */

// 3. Test suite
test.describe('API Name - Feature (Positive/Negative Tests)', () => {
  // 4. Змінні для зберігання даних між тестами
  let authToken: string;
  let userId: number;
  
  // 5. Setup (якщо потрібен)
  test.beforeAll(async ({ request }) => {
    // Створення сесії, підготовка даних
  });
  
  // 6. Тести
  test.describe('GET /endpoint - Description', () => {
    test('should do something and return 200', async ({ request }) => {
      // Тест
    });
  });
  
  // 7. Cleanup (якщо потрібен)
  test.afterAll(async ({ request }) => {
    // Очищення даних
  });
});
```

---

## 🔐 Credentials & Authentication

### ❌ НІКОЛИ НЕ РОБИТИ:
```typescript
// ❌ Hardcoded credentials
const auth = Buffer.from('email@example.com:password123').toString('base64');

// ❌ Hardcoded tokens
const token = 'dmFzeWwuYmFieWNoQGV2ZXJ0cnVlLmNvbTpwMG85UClPKA==';
```

### ✅ ЗАВЖДИ РОБИТИ:
```typescript
import { config } from '../../config/env.config';

// ✅ Використовуйте config для credentials
const response = await request.post('/auth/session', {
  headers: {
    'Authorization': `Basic ${config.auth.superAdminToken}`,
  },
});
```

### Доступні credentials:
```typescript
config.auth.superAdminToken    // Super Admin (найчастіше)
config.auth.regularUserToken   // Regular User
config.auth.testUserToken      // Test User
config.auth.basicToken         // Backward compatibility

// Якщо потрібні raw credentials:
config.users.superAdmin.email
config.users.superAdmin.password
```

---

## 📦 Імпорти

### ✅ Правильний порядок імпортів:

```typescript
// 1. Playwright fixtures (ЗАВЖДИ з global-api-tracking.fixture)
import { test, expect } from '../../fixtures/global-api-tracking.fixture';

// 2. Config
import { config, getAppKey, getAppToken } from '../../config/env.config';

// 3. Helpers
import { expectSchema } from '../../helpers/schema-validator';

// 4. Schemas
import { yourSchema } from '../../schemas/your.schemas';

// 5. Інші залежності (якщо потрібні)
```

### ❌ НІКОЛИ:
```typescript
// ❌ НЕ використовуйте @playwright/test напряму
import { test, expect } from '@playwright/test';

// ❌ НЕ використовуйте старий api-tracking.fixture
import { test, expect } from '../../fixtures/api-tracking.fixture';
```

### ✅ ЗАВЖДИ:
```typescript
// ✅ Використовуйте global-api-tracking.fixture
import { test, expect } from '../../fixtures/global-api-tracking.fixture';
```

---

## 🌐 API Requests

### Headers

```typescript
// Базові headers для більшості запитів
headers: {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Application-Key': config.headers.applicationKey,
  'Authorization-Provider': 'EvertrueAuthToken',
  'Authorization': authToken,
}

// Для Basic Auth
headers: {
  'Application-Key': config.headers.applicationKey,
  'Authorization-Provider': config.headers.authorizationProvider,
  'Authorization': `Basic ${config.auth.superAdminToken}`,
  'host': config.headers.host,
}

// Для App Token
headers: {
  'Application-Key': getAppKey('auth_api'),
  'Authorization-Provider': 'EvertrueAppToken',
  'Authorization': getAppToken('auth_api'),
}
```

### Query Parameters

```typescript
// ✅ Використовуйте params для query parameters
const response = await request.get('/endpoint', {
  params: {
    oid: '463',
    app_key: getAppKey('console'),
    auth: authToken
  }
});

// ❌ НЕ додавайте їх в URL вручну
const response = await request.get('/endpoint?oid=463&auth=' + authToken);
```

### Request Body

```typescript
// ✅ Використовуйте data для body
const response = await request.post('/endpoint', {
  headers: { /* ... */ },
  data: {
    field1: 'value1',
    field2: 'value2'
  }
});
```

---

## ✅ Assertions & Validation

### Status Code

```typescript
// ✅ Завжди перевіряйте конкретний status code
expect(response.status()).toBe(200);

// ❌ НЕ використовуйте декілька можливих кодів
// expect([200, 201]).toContain(response.status());

// Кожен endpoint має повертати ОДИН конкретний status code
// Якщо endpoint може повертати різні коди - це окремі тести:
test('should return 200 for valid request', async ({ request }) => {
  expect(response.status()).toBe(200);
});

test('should return 201 when creating resource', async ({ request }) => {
  expect(response.status()).toBe(201);
});
```

### Response Body

```typescript
// 1. Parse response
const responseBody = await response.json();

// 2. Log для debugging (опціонально)
console.log('Response:', JSON.stringify(responseBody, null, 2));

// 3. Validate schema (якщо є)
expectSchema(responseBody, yourSchema);

// 4. Validate specific fields
expect(responseBody.id).toBeDefined();
expect(responseBody.email).toBe(expectedEmail);
expect(Array.isArray(responseBody.items)).toBe(true);
```

### Schema Validation

```typescript
import { expectSchema } from '../../helpers/schema-validator';
import { yourSchema } from '../../schemas/your.schemas';

// ✅ Використовуйте для валідації структури
expectSchema(responseBody, yourSchema);

// Для масивів
expectSchema(responseBody, Joi.array().items(yourSchema));
```

---

## 📐 Schema Definition Rules

### 🎯 Філософія схем

**Схеми мають робити перевірку ОДНОЗНАЧНОЮ. Тести мають ЗНАХОДИТИ помилки, а НЕ підлаштовуватися під них.**

- ✅ Схема описує **очікувану** структуру response
- ✅ Якщо API повертає щось інше - це **помилка API**, не тесту
- ✅ Тест має **fail**, якщо response не відповідає схемі
- ❌ НЕ робіть поля `.optional()` щоб "тест пройшов"
- ✅ Використовуйте `.allow(null).required()` якщо API **завжди** повертає поле (навіть якщо null)
- ❌ НЕ використовуйте `.unknown(true)` щоб "ігнорувати" зайві поля

**Якщо тест падає через схему - це означає що API працює неправильно, а не що схема погана.**

### ✅ Правила створення схем

#### 1. Кожен параметр ЗАВЖДИ закінчується на `.required()`

```typescript
// ✅ Правильно: всі поля required
export const userSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  created_at: Joi.string().required(),
});

// ❌ НЕПРАВИЛЬНО: поля без required()
export const userSchema = Joi.object({
  id: Joi.number(),  // ❌ Немає .required()
  email: Joi.string().email(),  // ❌ Немає .required()
  name: Joi.string(),  // ❌ Немає .required()
});
```

**Важливо розуміти різницю:**

```typescript
// ✅ .allow(null).required() - поле ЗАВЖДИ присутнє, може бути null
phone: Joi.string().allow(null).required()
// Response: { phone: null } ✅ OK
// Response: { phone: "123" } ✅ OK
// Response: {} ❌ FAIL - поле відсутнє

// ❌ .optional() - поле може бути відсутнім (приховує баги!)
phone: Joi.string().optional()
// Response: { phone: "123" } ✅ OK
// Response: {} ✅ OK - тест пройде, але це може бути баг!
// Response: { phone: null } ❌ FAIL - null не дозволено

// ✅ .allow(null).optional() - поле може бути відсутнім АБО null
phone: Joi.string().allow(null).optional()
// Response: { phone: "123" } ✅ OK
// Response: { phone: null } ✅ OK
// Response: {} ✅ OK - але це приховує баги!
```

#### 2. Якщо response НЕ містить поле - створюйте окрему схему

```typescript
// Базова схема (всі поля присутні)
export const userFullSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
});

// Схема без phone (якщо endpoint не повертає phone)
export const userWithoutPhoneSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  address: Joi.string().required(),
});

// Схема мінімальна (тільки основні поля)
export const userMinimalSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
});
```

#### 3. Використовуйте правильну схему для кожного endpoint

```typescript
test('GET /users/{id} - full data', async ({ request }) => {
  const response = await request.get('/users/123');
  const body = await response.json();
  
  // ✅ Використовуйте схему яка відповідає response
  expectSchema(body, userFullSchema);
});

test('GET /users/search - minimal data', async ({ request }) => {
  const response = await request.get('/users/search');
  const body = await response.json();
  
  // ✅ Використовуйте мінімальну схему
  expectSchema(body.users[0], userMinimalSchema);
});
```

#### 4. Naming Convention для схем

```typescript
// Базова схема
export const resourceSchema = Joi.object({ /* ... */ });

// Схема для масиву
export const resourcesArraySchema = Joi.array().items(resourceSchema);

// Схема без певних полів
export const resourceWithoutFieldSchema = Joi.object({ /* ... */ });

// Мінімальна схема
export const resourceMinimalSchema = Joi.object({ /* ... */ });

// Схема для створення (request body)
export const createResourceSchema = Joi.object({ /* ... */ });

// Схема для оновлення (request body)
export const updateResourceSchema = Joi.object({ /* ... */ });
```

#### 5. Коментарі в схемах

```typescript
/**
 * Schema for GET /auth/users/{id}
 * Full user data with all fields
 */
export const userFullSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
});

/**
 * Schema for GET /auth/users/search
 * Minimal user data (some fields may be missing)
 */
export const userMinimalSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
});
```

#### 6. Nested Objects

```typescript
// ✅ Вкладені об'єкти також з required()
export const userWithAddressSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    country: Joi.string().required(),
    zip: Joi.string().required(),
  }).required(),  // ✅ Сам об'єкт також required
});
```

#### 7. Arrays

```typescript
// ✅ Масиви з required()
export const userWithRolesSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  roles: Joi.array().items(
    Joi.object({
      id: Joi.number().required(),
      name: Joi.string().required(),
    })
  ).required(),  // ✅ Масив також required
});
```

### ❌ Коли НЕ використовувати .required()

**НІКОЛИ.** Завжди використовуйте `.required()`.

Якщо поле може бути відсутнім - створіть окрему схему без цього поля.

### 🚫 Антипатерни (НЕ робіть так!)

#### ❌ Антипатерн #1: Підлаштування під помилки API

```typescript
// ❌ ПОГАНО: API іноді не повертає email, тому робимо optional
export const userSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().optional(),  // ❌ Приховуємо баг API!
  name: Joi.string().required(),
});

// ✅ ДОБРЕ: Якщо API НЕ повертає email - це БАГ, тест має fail
export const userSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),  // ✅ Знайдемо баг!
  name: Joi.string().required(),
});

// ✅ АБО: Якщо це різні endpoints з різними даними
export const userFullSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),
  name: Joi.string().required(),
});

export const userMinimalSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  // email відсутній - це нормально для цього endpoint
});
```

#### ❌ Антипатерн #2: Використання .optional() замість .allow(null)

```typescript
// ❌ ПОГАНО: Поле іноді відсутнє, робимо optional
export const userSchema = Joi.object({
  id: Joi.number().required(),
  phone: Joi.string().optional(),  // ❌ Приховуємо баг!
});

// ✅ ДОБРЕ: Якщо API ЗАВЖДИ повертає поле (навіть null)
export const userSchema = Joi.object({
  id: Joi.number().required(),
  phone: Joi.string().allow(null).required(),  // ✅ Поле завжди є
});

// ✅ АБО: Якщо API НЕ повертає поле - окрема схема
export const userMinimalSchema = Joi.object({
  id: Joi.number().required(),
  // phone відсутній - це нормально для цього endpoint
});
```

#### ❌ Антипатерн #3: Ігнорування зайвих полів

```typescript
// ❌ ПОГАНО: Дозволяємо будь-які зайві поля
export const userSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),
}).unknown(true);  // ❌ Не бачимо зайвих полів!

// ✅ ДОБРЕ: Схема має точно відповідати response
export const userSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),
  // Якщо API повертає зайві поля - тест fail, це добре!
});
```

### 💡 Правильний підхід до "проблемних" полів

**Ситуація:** API іноді не повертає поле `phone`

```typescript
// ❌ НЕПРАВИЛЬНО: Робимо optional
export const userSchema = Joi.object({
  phone: Joi.string().optional(),
});

// ✅ ПРАВИЛЬНО: З'ясуйте ЧОМУ API не повертає phone
// Варіант 1: Це баг API → тест має fail → виправити API
// Варіант 2: Це різні endpoints → створити дві схеми

// Для GET /users/{id} (повний профіль)
export const userFullSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
});

// Для GET /users/search (мінімальні дані)
export const userSearchSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),
  // phone не повертається - це нормально для search
});
```

### 📊 Приклад: Як тести знаходять реальні баги

```typescript
// Схема очікує email
export const userSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),
  name: Joi.string().required(),
});

test('should return user data', async ({ request }) => {
  const response = await request.get('/users/123');
  const body = await response.json();
  
  // ✅ Якщо API повертає: { id: 123, name: "John" }
  // Тест FAIL - відсутній email
  // Це ДОБРЕ! Ми знайшли баг в API!
  expectSchema(body, userSchema);
});

// ❌ ПОГАНО: Змінити схему щоб тест пройшов
// export const userSchema = Joi.object({
//   email: Joi.string().optional(),  // Приховали баг!
// });

// ✅ ДОБРЕ: Виправити API або створити правильну схему
```

### 📋 Приклад: Різні схеми для різних endpoints

```typescript
// schemas/auth.schemas.ts

/**
 * Full user schema - GET /auth/users/{id}
 */
export const userFullSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  super_user: Joi.boolean().required(),
  created_at: Joi.string().required(),
  updated_at: Joi.string().required(),
  phone: Joi.string().required(),
  address: Joi.string().required(),
});

/**
 * User schema without contact info - GET /auth/users/search
 */
export const userSearchSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  super_user: Joi.boolean().required(),
});

/**
 * Minimal user schema - GET /auth/session
 */
export const userMinimalSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
});
```

```typescript
// tests/auth/auth-users.spec.ts

test('should get full user data', async ({ request }) => {
  const response = await request.get('/auth/users/123');
  const body = await response.json();
  
  // ✅ Використовуємо full schema
  expectSchema(body, userFullSchema);
});

test('should search users', async ({ request }) => {
  const response = await request.get('/auth/users/search');
  const body = await response.json();
  
  // ✅ Використовуємо search schema (без phone/address)
  expectSchema(body.users[0], userSearchSchema);
});

test('should get session user', async ({ request }) => {
  const response = await request.get('/auth/session');
  const body = await response.json();
  
  // ✅ Використовуємо minimal schema
  expectSchema(body.user, userMinimalSchema);
});
```

---

## 🔄 Test Organization

### Positive Tests

```typescript
test.describe('API Name - Feature (Positive Tests)', () => {
  test.describe('GET /endpoint - Description', () => {
    test('should return data with valid params and return 200', async ({ request }) => {
      // Arrange
      const params = { /* ... */ };
      
      // Act
      const response = await request.get('/endpoint', { params });
      
      // Assert
      expect(response.status()).toBe(200);
      const body = await response.json();
      expectSchema(body, schema);
    });
  });
});
```

### Negative Tests

```typescript
test.describe('API Name - Feature (Negative Tests)', () => {
  test.describe('GET /endpoint - Error handling', () => {
    test('should return 401 without authentication', async ({ request }) => {
      const response = await request.get('/endpoint');
      expect(response.status()).toBe(401);
    });
    
    test('should return 400 with invalid params', async ({ request }) => {
      const response = await request.get('/endpoint', {
        params: { invalid: 'param' }
      });
      // ✅ ОДИН конкретний status code
      expect(response.status()).toBe(400);
    });
    
    test('should return 422 with validation error', async ({ request }) => {
      const response = await request.get('/endpoint', {
        params: { invalid: 'data' }
      });
      // ✅ Якщо можливі різні коди - окремі тести
      expect(response.status()).toBe(422);
    });
  });
});
```

### CRUD Tests (Serial)

```typescript
test.describe.serial('Feature CRUD Operations', () => {
  let createdId: number;
  
  test('should create resource', async ({ request }) => {
    const response = await request.post('/endpoint', {
      headers: { /* ... */ },
      data: { /* ... */ }
    });
    
    expect(response.status()).toBe(201);
    const body = await response.json();
    createdId = body.id;
  });
  
  test('should read resource', async ({ request }) => {
    const response = await request.get(`/endpoint/${createdId}`);
    expect(response.status()).toBe(200);
  });
  
  test('should update resource', async ({ request }) => {
    const response = await request.put(`/endpoint/${createdId}`, {
      data: { /* ... */ }
    });
    expect(response.status()).toBe(200);
  });
  
  test('should delete resource', async ({ request }) => {
    const response = await request.delete(`/endpoint/${createdId}`);
    expect(response.status()).toBe(204);
  });
});
```

---

## 🎨 Naming Conventions

### Test Files

```
feature-name.positive.spec.ts    // Positive scenarios
feature-name.negative.spec.ts    // Negative scenarios
feature-name.spec.ts             // Mixed or simple tests
```

### Test Descriptions

```typescript
// ✅ Добре: описує що тест робить і очікуваний результат
test('should return user data with valid token and return 200', async ({ request }) => {});
test('should return 401 without authentication token', async ({ request }) => {});
test('should create new user with valid data and return 201', async ({ request }) => {});

// ❌ Погано: неясно що тестується
test('test user endpoint', async ({ request }) => {});
test('check auth', async ({ request }) => {});
```

### Variables

```typescript
// ✅ Описові назви
let authToken: string;
let userId: number;
let createdAffiliationId: number;
let testUserEmail: string;

// ❌ Неясні назви
let token: string;
let id: number;
let x: number;
```

---

## 🧹 Best Practices

### 1. Ізоляція тестів

```typescript
// ✅ Кожен тест має бути незалежним
test('should do something', async ({ request }) => {
  // Створити свої дані
  // Виконати тест
  // Очистити дані (якщо потрібно)
});

// ❌ НЕ покладайтеся на порядок виконання (крім .serial)
```

### 2. Унікальні дані

```typescript
// ✅ Використовуйте timestamp для унікальності
const email = `test.user.${Date.now()}@example.com`;
const name = `Test User ${Date.now()}`;

// ❌ Hardcoded дані можуть конфліктувати
const email = 'test@example.com';
```

### 3. Cleanup

```typescript
// ✅ Очищайте створені дані
test.afterAll(async ({ request }) => {
  if (createdUserId) {
    await request.delete(`/users/${createdUserId}`);
  }
});
```

### 4. Error Handling

```typescript
// ✅ Перевіряйте ОДИН конкретний error code
expect(response.status()).toBe(400);

// ❌ НЕ використовуйте масив можливих кодів
// expect([400, 422]).toContain(response.status());

// ✅ Логуйте для debugging
console.log('Error response:', await response.json());
```

### 5. Conditional Tests

```typescript
// ✅ Skip якщо немає необхідних даних
test('should do something', async ({ request }) => {
  if (!requiredData) {
    test.skip();
  }
  // Test logic
});
```

---

## 📝 Template для нового тесту

```typescript
import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { yourSchema } from '../../schemas/your.schemas';

/**
 * API Name - Feature Tests (Positive/Negative)
 * Description of what is being tested
 */
test.describe('API Name - Feature (Positive Tests)', () => {
  let authToken: string;
  let userId: number;

  test.beforeAll(async ({ request }) => {
    // Create session
    const response = await request.post('/auth/session', {
      headers: {
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': config.headers.authorizationProvider,
        'Authorization': `Basic ${config.auth.superAdminToken}`,
        'host': config.headers.host,
      },
    });

    const session = await response.json();
    authToken = session.token;
    userId = session.user.id;
  });

  test.describe('GET /your/endpoint - Description', () => {
    test('should return data with valid params and return 200', async ({ request }) => {
      const response = await request.get('/your/endpoint', {
        headers: {
          'Accept': 'application/json',
          'Application-Key': config.headers.applicationKey,
          'Authorization-Provider': 'EvertrueAuthToken',
          'Authorization': authToken,
        },
      });

      // Verify status code
      expect(response.status()).toBe(200);

      // Parse and validate response
      const responseBody = await response.json();
      console.log('Response:', JSON.stringify(responseBody, null, 2));

      // Validate schema
      expectSchema(responseBody, yourSchema);

      // Additional assertions
      expect(responseBody.id).toBeDefined();
    });
  });

  test.afterAll(async ({ request }) => {
    // Cleanup if needed
  });
});
```

---

## 🚫 Common Mistakes (Чого НЕ робити)

### ❌ 1. Hardcoded credentials
```typescript
const auth = Buffer.from('email:password').toString('base64');
```

### ❌ 2. Wrong imports
```typescript
import { test, expect } from '@playwright/test';
```

### ❌ 3. No schema validation
```typescript
// Пропущена валідація структури
const body = await response.json();
// Тільки перевірка полів без schema
```

### ❌ 4. Schema fields without .required()
```typescript
// ❌ Поля без .required()
export const userSchema = Joi.object({
  id: Joi.number(),  // Немає .required()
  email: Joi.string().email(),  // Немає .required()
});

// ✅ Всі поля з .required()
export const userSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().email().required(),
});
```

### ❌ 5. Hardcoded IDs/emails
```typescript
const userId = 123;
const email = 'test@example.com';
```

### ❌ 6. No status code check
```typescript
const body = await response.json();
// Забули перевірити response.status()
```

### ❌ 7. Unclear test names
```typescript
test('test 1', async ({ request }) => {});
```

### ❌ 8. No cleanup
```typescript
// Створили дані але не видалили
```

### ❌ 9. Multiple possible status codes
```typescript
// ❌ НЕ використовуйте масив можливих кодів
expect([400, 422]).toContain(response.status());

// ✅ Кожен тест має перевіряти ОДИН конкретний код
expect(response.status()).toBe(400);
```

---

## ✅ Checklist для нового тесту

- [ ] Використано `global-api-tracking.fixture` для імпорту
- [ ] Credentials беруться з `config.auth.*`
- [ ] Headers правильно налаштовані
- [ ] Status code перевіряється (ОДИН конкретний код)
- [ ] Response body валідується через schema (якщо є)
- [ ] Schema має всі поля з `.required()`
- [ ] Якщо response не містить поле - створена окрема schema
- [ ] Унікальні дані (timestamp) для email/names
- [ ] Описова назва тесту
- [ ] Cleanup виконується (якщо потрібно)
- [ ] Логування для debugging (опціонально)
- [ ] Тест незалежний від інших (крім .serial)

---

## 📚 Додаткові ресурси

- [Playwright API Testing](https://playwright.dev/docs/api-testing)
- [API Baseline Testing](./API_BASELINE_TESTING.md)
- [Baseline Workflow](./BASELINE_WORKFLOW.md)
- [Credentials Migration](./CREDENTIALS_MIGRATION.md)

---

**Дата створення:** 24 жовтня 2025  
**Версія:** 1.0  
**Статус:** ✅ Актуально
