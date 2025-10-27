# 🌊 Windsurf Global Rules - EverTrue API Testing

## 📋 Copy these rules to Windsurf Settings

Щоб додати ці правила як Global Rules в Windsurf:
1. Відкрийте Windsurf Settings (Ctrl+,)
2. Знайдіть "Cascade" → "Global Rules"
3. Скопіюйте текст нижче в поле Global Rules

---

## 🎯 GLOBAL RULES FOR WINDSURF

```
# EverTrue API Testing - Playwright Test Rules

## 1. IMPORTS (ЗАВЖДИ)

При написанні тестів ЗАВЖДИ використовуй:
```typescript
import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { expectSchema } from '../../helpers/schema-validator';
```

НІКОЛИ не використовуй:
```typescript
import { test, expect } from '@playwright/test';  // ❌ НЕПРАВИЛЬНО
```

## 2. CREDENTIALS (НІКОЛИ HARDCODED)

ЗАВЖДИ використовуй config для credentials:
```typescript
Authorization: `Basic ${config.auth.superAdminToken}`
```

НІКОЛИ не використовуй hardcoded credentials:
```typescript
const auth = Buffer.from('email:password').toString('base64');  // ❌ ЗАБОРОНЕНО
```

Доступні tokens:
- config.auth.superAdminToken - Super Admin (найчастіше)
- config.auth.regularUserToken - Regular User
- config.auth.testUserToken - Test User

## 3. STATUS CODE (ОДИН КОНКРЕТНИЙ КОД)

Кожен тест має перевіряти ОДИН конкретний status code:
```typescript
expect(response.status()).toBe(200);  // ✅ ПРАВИЛЬНО
```

НІКОЛИ не використовуй масив можливих кодів:
```typescript
expect([200, 201]).toContain(response.status());  // ❌ ЗАБОРОНЕНО
```

Якщо endpoint може повертати різні коди - це ОКРЕМІ тести.

## 4. SCHEMA VALIDATION (ОБОВ'ЯЗКОВО)

ЗАВЖДИ валідуй response через schema:
```typescript
const responseBody = await response.json();
expectSchema(responseBody, yourSchema);
```

## 5. SCHEMAS - КРИТИЧНО ВАЖЛИВО

### ФІЛОСОФІЯ: Тести мають ЗНАХОДИТИ помилки, а НЕ підлаштовуватися під них!

### Правило #1: Кожен параметр ЗАВЖДИ з .required()

```typescript
// ✅ ПРАВИЛЬНО
export const userSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),
  name: Joi.string().required(),
  phone: Joi.string().allow(null).required(),  // ✅ Поле завжди є, може бути null
});

// ❌ ЗАБОРОНЕНО
export const userSchema = Joi.object({
  id: Joi.number(),  // Немає .required()
  email: Joi.string().optional(),  // Приховує баг - поле може бути відсутнім!
});

// ВАЖЛИВО: Різниця між .optional() та .allow(null):
// .allow(null).required() - поле ЗАВЖДИ присутнє в response (може бути null) ✅
// .optional() - поле може бути ВІДСУТНІМ в response ❌ приховує баги!
```

### Правило #2: Якщо response НЕ містить поле - створи ОКРЕМУ схему

НЕ використовуй .optional() щоб "обійти" помилки API.
Створи нову схему без цього поля.

Використовуй .allow(null).required() якщо API ЗАВЖДИ повертає поле (навіть якщо null).

```typescript
// ✅ ПРАВИЛЬНО: Різні схеми для різних endpoints
export const userFullSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
});

export const userMinimalSchema = Joi.object({
  id: Joi.number().required(),
  email: Joi.string().required(),
  // phone відсутній - це нормально для цього endpoint
});

// ❌ ЗАБОРОНЕНО: Підлаштування під баги
export const userSchema = Joi.object({
  phone: Joi.string().optional(),  // Приховує баг!
});
```

### Правило #3: НІКОЛИ не використовуй .unknown(true)

```typescript
// ❌ ЗАБОРОНЕНО
export const userSchema = Joi.object({
  id: Joi.number().required(),
}).unknown(true);  // Не бачимо зайвих полів!

// ✅ ПРАВИЛЬНО
export const userSchema = Joi.object({
  id: Joi.number().required(),
  // Якщо API повертає зайві поля - тест fail, це добре!
});
```

### Naming Convention для схем:
- resourceSchema - базова схема
- resourcesArraySchema - масив
- resourceMinimalSchema - мінімальна схема
- resourceFullSchema - повна схема
- resourceWithoutFieldSchema - без певного поля

## 6. УНІКАЛЬНІ ДАНІ (FAKER.JS)

ЗАВЖДИ використовуй test-data-generator helpers:
```typescript
import { generateUser, generateEmail } from '../../helpers/test-data-generator';

// ✅ ПРАВИЛЬНО: Faker + timestamp
const user = generateUser();
// {
//   email: 'test.1234567890@example.com',  // Унікальність
//   first_name: 'John',                     // Реалістичність
//   last_name: 'Doe',
//   ...
// }

// ✅ АБО: Тільки email
const email = generateEmail();  // test.1234567890@example.com
```

НІКОЛИ не використовуй hardcoded дані:
```typescript
const email = 'test@example.com';  // ❌ ЗАБОРОНЕНО
const name = 'Test User';          // ❌ ЗАБОРОНЕНО
```

Доступні функції:
- generateUser() - повний користувач
- generateEmail() - унікальний email
- generateOrganization() - організація
- generateContact() - контакт
- generateAddress() - адреса
- generateArray() - масив об'єктів
- pickRandom() - випадковий вибір

Детальна документація: docs/TEST_DATA_GENERATION.md

## 7. СТРУКТУРА ТЕСТУ

```typescript
test.describe('API - Feature (Positive Tests)', () => {
  let authToken: string;
  
  test.beforeAll(async ({ request }) => {
    // Create session з config.auth.superAdminToken
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
    // 1. Make request
    const response = await request.get('/endpoint', {
      headers: {
        'Accept': 'application/json',
        'Application-Key': config.headers.applicationKey,
        'Authorization-Provider': 'EvertrueAuthToken',
        'Authorization': authToken,
      },
    });
    
    // 2. Check ОДИН конкретний status code
    expect(response.status()).toBe(200);
    
    // 3. Validate schema (з .required() на всіх полях)
    const body = await response.json();
    expectSchema(body, yourSchema);
    
    // 4. Assert specific fields
    expect(body.id).toBeDefined();
  });
});
```

## 8. ЗАБОРОНЕНІ ПРАКТИКИ

❌ НІКОЛИ не робіть:
1. Hardcoded credentials (Buffer.from('email:password'))
2. Неправильні imports (@playwright/test)
3. Масив status codes (expect([200, 201]).toContain())
4. Schema без .required()
5. Schema з .optional() або .allow(null)
6. Schema з .unknown(true)
7. Hardcoded email/ID без timestamp
8. Пропущена schema validation
9. Пропущена перевірка status code

## 9. CHECKLIST ДЛЯ КОЖНОГО ТЕСТУ

Перед commit перевір:
- [ ] Використано global-api-tracking.fixture
- [ ] Credentials з config.auth.*
- [ ] Status code перевірено (ОДИН конкретний код)
- [ ] Schema validation виконана
- [ ] Schema має всі поля з .required()
- [ ] Якщо response не містить поле - створена окрема schema
- [ ] Унікальні дані з Date.now()
- [ ] Описова назва тесту
- [ ] Cleanup виконується (якщо потрібно)

## 10. ДОКУМЕНТАЦІЯ

Детальні правила:
- docs/TESTING_GUIDELINES.md - повні правила
- docs/QUICK_TESTING_RULES.md - швидкі правила
- docs/CREDENTIALS_MIGRATION.md - робота з credentials

## ВАЖЛИВО

Якщо тест падає через schema validation - це означає що API працює неправильно, а не що schema погана.
НЕ змінюй schema щоб тест пройшов. Виправ API або створи правильну schema для цього endpoint.

Тести - це детектор помилок, а не маскувальна сітка для багів!
```

---

## 📝 Як використовувати

### Варіант 1: Global Rules в Windsurf
1. Відкрийте Windsurf Settings (Ctrl+,)
2. Знайдіть "Cascade" → "Global Rules"
3. Скопіюйте весь блок з секції "GLOBAL RULES FOR WINDSURF" вище
4. Вставте в поле Global Rules
5. Збережіть

### Варіант 2: Project Rules (.windsurfrules)
Якщо хочете project-specific rules:
1. Створіть файл `.windsurfrules` в корені проекту
2. Скопіюйте туди правила
3. Windsurf автоматично їх підхопить

### Варіант 3: Cascade Instructions
При кожному запиті до Cascade можна додавати:
```
@WINDSURF_RULES.md - дотримуйся цих правил при написанні тестів
```

---

## 🎯 Результат

Після додавання цих правил, Windsurf/Cascade буде:
- ✅ Автоматично використовувати правильні imports
- ✅ Використовувати config для credentials
- ✅ Перевіряти один конкретний status code
- ✅ Створювати schemas з .required() на всіх полях
- ✅ НЕ використовувати .optional() або .allow(null)
- ✅ Створювати окремі schemas для різних responses
- ✅ Використовувати унікальні дані з timestamp
- ✅ Дотримуватись правильної структури тестів

**Тепер всі тести будуть писатися за єдиним стандартом!** 🎉
