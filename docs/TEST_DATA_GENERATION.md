# 🎲 Test Data Generation Guide

## 📚 Огляд

Проєкт використовує **Faker.js** для генерації реалістичних тестових даних.

**Helper:** `helpers/test-data-generator.ts`

## 🎯 Основні принципи

### ✅ Правило #1: Унікальність через timestamp
```typescript
// ✅ ПРАВИЛЬНО: Email з timestamp
const email = generateEmail();  // test.1234567890@example.com

// ❌ НЕПРАВИЛЬНО: Hardcoded email
const email = 'test@example.com';
```

### ✅ Правило #2: Реалістичність через Faker
```typescript
// ✅ ПРАВИЛЬНО: Реалістичні імена
const user = generateUser();
// { first_name: 'John', last_name: 'Doe', ... }

// ❌ НЕПРАВИЛЬНО: Hardcoded імена
const user = { first_name: 'Test', last_name: 'User' };
```

### ✅ Правило #3: Комбінуйте обидва підходи
```typescript
const user = generateUser({
  email: generateEmail('custom-domain.com'),  // Унікальність
  first_name: 'John',  // Override якщо потрібно
});
```

---

## 📦 Доступні функції

### 1. **Email Generation**

#### `generateEmail(domain?)`
Генерує унікальний email з timestamp.

```typescript
import { generateEmail } from '../../helpers/test-data-generator';

const email = generateEmail();
// test.1234567890@example.com

const customEmail = generateEmail('mycompany.com');
// test.1234567890@mycompany.com
```

---

### 2. **User Generation**

#### `generateUser(overrides?)`
Генерує повний об'єкт користувача з реалістичними даними.

```typescript
import { generateUser } from '../../helpers/test-data-generator';

const user = generateUser();
// {
//   email: 'test.1234567890@example.com',
//   first_name: 'John',
//   last_name: 'Doe',
//   name: 'John Doe',
//   phone: '+1-234-567-8900',
//   username: 'user_1234567890'
// }

// З override
const customUser = generateUser({
  first_name: 'Custom',
  email: 'custom@example.com'
});
```

---

### 3. **Organization Generation**

#### `generateOrganization(overrides?)`
Генерує дані організації.

```typescript
import { generateOrganization } from '../../helpers/test-data-generator';

const org = generateOrganization();
// {
//   name: 'Acme Corp 1234567890',
//   slug: 'org-1234567890',
//   description: 'Innovative solutions for modern business',
//   website: 'https://example.com'
// }
```

---

### 4. **Contact Generation**

#### `generateContact(overrides?)`
Генерує контактні дані.

```typescript
import { generateContact } from '../../helpers/test-data-generator';

const contact = generateContact();
// {
//   email: 'contact.1234567890@example.com',
//   first_name: 'Jane',
//   last_name: 'Smith',
//   phone: '+1-234-567-8900',
//   company: 'Tech Solutions Inc',
//   title: 'Senior Developer'
// }
```

---

### 5. **Address Generation**

#### `generateAddress()`
Генерує повну адресу.

```typescript
import { generateAddress } from '../../helpers/test-data-generator';

const address = generateAddress();
// {
//   street: '123 Main Street',
//   city: 'New York',
//   state: 'NY',
//   zip: '10001',
//   country: 'United States'
// }
```

---

### 6. **Utility Functions**

#### `generateUsername()`
```typescript
const username = generateUsername();  // user_1234567890
```

#### `generateSlug(base?)`
```typescript
const slug = generateSlug('my-org');  // my-org-1234567890
```

#### `generateId(prefix?)`
```typescript
const id = generateId('user');  // user_1234567890
```

#### `generateNumber(min?, max?)`
```typescript
const num = generateNumber(1, 100);  // Random number 1-100
```

#### `generateBoolean()`
```typescript
const bool = generateBoolean();  // true or false
```

#### `generateText(sentences?)`
```typescript
const text = generateText(2);  // Two sentences of lorem ipsum
```

#### `generatePastDate(years?)`
```typescript
const date = generatePastDate(1);  // Date within last year
```

#### `generateFutureDate(years?)`
```typescript
const date = generateFutureDate(1);  // Date within next year
```

#### `generateArray(generator, count?)`
```typescript
const users = generateArray(generateUser, 5);  // Array of 5 users
```

#### `pickRandom(array)`
```typescript
const role = pickRandom(['Admin', 'User', 'Guest']);  // Random role
```

---

## 💡 Приклади використання

### Приклад 1: Створення користувача

```typescript
import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config, getAppKey } from '../../config/env.config';
import { generateUser } from '../../helpers/test-data-generator';

test('should create user with realistic data', async ({ request }) => {
  const userData = generateUser();
  
  const response = await request.post('/auth/users', {
    headers: {
      'Authorization-Provider': 'EvertrueAuthToken',
      Authorization: authToken,
      'Application-Key': getAppKey('console'),
    },
    data: userData,
  });
  
  expect(response.status()).toBe(201);
  
  const body = await response.json();
  expect(body.email).toBe(userData.email);
  expect(body.first_name).toBe(userData.first_name);
});
```

### Приклад 2: Масове створення

```typescript
import { generateArray, generateUser } from '../../helpers/test-data-generator';

test('should create multiple users', async ({ request }) => {
  const users = generateArray(generateUser, 10);
  
  for (const userData of users) {
    const response = await request.post('/auth/users', {
      headers: { /* ... */ },
      data: userData,
    });
    
    expect(response.status()).toBe(201);
  }
});
```

### Приклад 3: Custom override

```typescript
import { generateUser, pickRandom } from '../../helpers/test-data-generator';

test('should create user with specific role', async ({ request }) => {
  const userData = generateUser({
    first_name: 'Admin',
    last_name: 'User',
  });
  
  const role = pickRandom(['Admin', 'Moderator', 'User']);
  
  const response = await request.post('/auth/users', {
    headers: { /* ... */ },
    data: {
      ...userData,
      role: role,
    },
  });
  
  expect(response.status()).toBe(201);
});
```

### Приклад 4: CSV Invites

```typescript
import { generateCsvInvite, generateArray } from '../../helpers/test-data-generator';

test('should create CSV invites', async ({ request }) => {
  const invites = generateArray(generateCsvInvite, 5);
  
  const csvContent = invites.map(invite => 
    `${invite.email},${invite.first_name},${invite.last_name},${invite.role}`
  ).join('\n');
  
  // Upload CSV...
});
```

---

## 🚫 Що НЕ робити

### ❌ Hardcoded дані
```typescript
// ❌ ПОГАНО
const email = 'test@example.com';
const name = 'Test User';
```

### ❌ Faker без timestamp для унікальних полів
```typescript
// ❌ ПОГАНО - не гарантує унікальність
const email = faker.internet.email();
```

### ❌ Date.now() для реалістичних даних
```typescript
// ❌ ПОГАНО - нереалістично
const firstName = `User${Date.now()}`;
```

---

## ✅ Що робити

### ✅ Комбінуйте timestamp + Faker
```typescript
// ✅ ДОБРЕ
const user = generateUser();  // Унікальність + Реалістичність
```

### ✅ Override коли потрібно
```typescript
// ✅ ДОБРЕ
const admin = generateUser({
  first_name: 'Admin',  // Specific value
});
```

### ✅ Використовуйте helper functions
```typescript
// ✅ ДОБРЕ
const email = generateEmail();
const slug = generateSlug('my-org');
```

---

## 📊 Коли використовувати що

| Тип даних | Функція | Чому |
|-----------|---------|------|
| Email | `generateEmail()` | Унікальність критична |
| Username | `generateUsername()` | Унікальність критична |
| Slug | `generateSlug()` | Унікальність критична |
| Ім'я | `generateUser()` | Реалістичність важлива |
| Адреса | `generateAddress()` | Реалістичність важлива |
| Телефон | `generateUser().phone` | Реалістичність важлива |
| ID | `generateId()` | Унікальність критична |
| Текст | `generateText()` | Реалістичність важлива |

---

## 🔧 Розширення

Якщо потрібна нова функція генерації:

1. Додайте її в `helpers/test-data-generator.ts`
2. Додайте JSDoc коментар
3. Додайте приклад в цю документацію
4. Дотримуйтесь правил: timestamp для унікальності, Faker для реалістичності

---

## 📚 Додаткові ресурси

- [Faker.js Documentation](https://fakerjs.dev/)
- [Testing Guidelines](./TESTING_GUIDELINES.md)
- [Quick Testing Rules](./QUICK_TESTING_RULES.md)
