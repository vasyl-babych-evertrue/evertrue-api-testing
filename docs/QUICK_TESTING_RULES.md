# ⚡ Quick Testing Rules - Швидкі правила

## 🎯 Основні правила (Must Follow)

### 1. ✅ Завжди використовуйте правильний fixture
```typescript
import { test, expect } from '../../fixtures/global-api-tracking.fixture';
```

### 2. ✅ Завжди використовуйте config для credentials
```typescript
import { config } from '../../config/env.config';

// Використовуйте:
Authorization: `Basic ${config.auth.superAdminToken}`

// ❌ НІКОЛИ не робіть:
const auth = Buffer.from('email:password').toString('base64');
```

### 3. ✅ Завжди перевіряйте ОДИН конкретний status code
```typescript
expect(response.status()).toBe(200);

// ❌ НЕ використовуйте масив можливих кодів
// expect([400, 422]).toContain(response.status());
```

### 4. ✅ Завжди валідуйте response через schema
```typescript
import { expectSchema } from '../../helpers/schema-validator';
expectSchema(responseBody, yourSchema);
```

### 5. ✅ Schemas: всі поля з .required()

**Філософія: Тести мають ЗНАХОДИТИ помилки, а НЕ підлаштовуватися під них!**

```typescript
// ✅ Правильно
export const userSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),
  phone: Joi.string().allow(null).required(),  // ✅ Поле завжди є, може бути null
});

// ❌ Неправильно - приховує баги
export const userSchema = Joi.object({
  id: Joi.number(),  // ❌ Немає .required()
  email: Joi.string().optional(),  // ❌ Приховує баг - поле може бути відсутнім!
});

// Різниця між .optional() та .allow(null):
// .allow(null).required() - поле ЗАВЖДИ є (може бути null) ✅
// .optional() - поле може бути ВІДСУТНІМ ❌ приховує баги

// ✅ Якщо response НЕ містить поле - створіть окрему schema
// Це означає що різні endpoints повертають різні дані (нормально)
// А не що API має баг (погано)
```

### 6. ✅ Використовуйте унікальні дані
```typescript
const email = `test.${Date.now()}@example.com`;
```

---

## 📦 Стандартний шаблон

```typescript
import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
import { yourSchema } from '../../schemas/your.schemas';

test.describe('API - Feature (Positive Tests)', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
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
  });

  test('should do something and return 200', async ({ request }) => {
    const response = await request.get('/endpoint', {
      headers: {
        'Accept': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expectSchema(body, yourSchema);
  });
});
```

---

## 🚫 Top 7 помилок

1. ❌ `import { test } from '@playwright/test'` → ✅ `from '../../fixtures/global-api-tracking.fixture'`
2. ❌ `Buffer.from('email:pass')` → ✅ `config.auth.superAdminToken`
3. ❌ Пропущена перевірка `response.status()`
4. ❌ Пропущена schema validation
5. ❌ Schema без `.required()` → ✅ Всі поля з `.required()`
6. ❌ Hardcoded email/ID → ✅ `Date.now()` для унікальності
7. ❌ `expect([400, 422]).toContain()` → ✅ `expect().toBe(400)` - тільки ОДИН код

---

## 📋 Checklist

- [ ] Правильний import fixture
- [ ] Config для credentials
- [ ] Status code перевірено (ОДИН конкретний код)
- [ ] Schema validation
- [ ] Schema має всі поля з `.required()`
- [ ] Унікальні дані

---

Детальні правила: [TESTING_GUIDELINES.md](./TESTING_GUIDELINES.md)
