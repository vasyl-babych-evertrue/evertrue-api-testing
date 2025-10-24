# 🔐 Міграція Credentials - Інструкції

## ✅ Виправлено (8 файлів)

Наступні файли вже оновлені для використання `config.auth.superAdminToken`:

- ✅ `tests/auth/auth-affiliations.positive.spec.ts`
- ✅ `tests/auth/auth-affiliations.negative.spec.ts`
- ✅ `tests/auth/auth-affiliation-roles.positive.spec.ts`
- ✅ `tests/auth/auth-affiliation-roles.negative.spec.ts`
- ✅ `tests/auth/auth-affiliation-requests.positive.spec.ts`
- ✅ `tests/auth/auth-affiliation-requests.negative.spec.ts`
- ✅ `tests/auth/auth-affiliation-invitations.positive.spec.ts`
- ✅ `tests/auth/auth-affiliation-invitations.negative.spec.ts`

## 📝 Що було змінено

### Було (погана практика):
```typescript
const superAdminAuth = Buffer.from('vasyl.babych@evertrue.com:p0o9P)O(p0o9P)O(').toString('base64');

const response = await request.post('/auth/session', {
  headers: {
    'Authorization': `Basic ${superAdminAuth}`,
  },
});
```

### Стало (добра практика):
```typescript
import { config } from '../../config/env.config';

const response = await request.post('/auth/session', {
  headers: {
    'Authorization': `Basic ${config.auth.superAdminToken}`,
  },
});
```

## 🔍 Файли які потребують перевірки

Інші файли де використовується `Buffer.from(...).toString('base64')`:

### CSV Data (це OK - не креди):
- `tests/auth/auth-csv-invites.positive.spec.ts` - використовує Buffer для CSV даних (це нормально)

### LinkedIn Token (це OK - тестовий токен):
- `tests/auth/auth-linkedin-oauth.spec.ts` - використовує Buffer для LinkedIn токена (це тестовий приклад з документації)

## 📚 Доступні креди в config

### `config/env.config.ts` містить:

```typescript
export const config = {
  auth: {
    // Super Admin (GivingTree Owner)
    superAdminToken: 'dmFzeWwuYmFieWNoQGV2ZXJ0cnVlLmNvbTpwMG85UClPKHAwbzlQKU8o',
    
    // Regular User (GivingTree User)
    regularUserToken: 'dmFzeWwuYmFieWNoKzNAc3dhbnRlYW1zLmNvbTpwMG85UClPKA==',
    
    // Test User
    testUserToken: 'MDIxZTk4MWEtYjIzYS00MWRjLTk5YjYtYzJiYmIyMDBkNDNiQG1haWxzbHVycC54eXo6MTIzNDEyMzQ=',
    
    // Backward compatibility
    basicToken: 'dmFzeWwuYmFieWNoQGV2ZXJ0cnVlLmNvbTpwMG85UClPKHAwbzlQKU8o',
  },
  
  users: {
    superAdmin: {
      email: 'vasyl.babych@evertrue.com',
      password: 'p0o9P)O(p0o9P)O(',
    },
    regularUser: {
      email: 'vasyl.babych+3@swanteams.com',
      password: 'p0o9P)O(',
    },
    testUser: {
      email: '021e981a-b23a-41dc-99b6-c2bbb200d43b@mailslurp.xyz',
      password: '12341234',
    },
  },
};
```

## 🎯 Як використовувати

### 1. Super Admin (найчастіше):
```typescript
import { config } from '../../config/env.config';

const response = await request.post('/auth/session', {
  headers: {
    'Authorization': `Basic ${config.auth.superAdminToken}`,
  },
});
```

### 2. Regular User:
```typescript
const response = await request.post('/auth/session', {
  headers: {
    'Authorization': `Basic ${config.auth.regularUserToken}`,
  },
});
```

### 3. Test User:
```typescript
const response = await request.post('/auth/session', {
  headers: {
    'Authorization': `Basic ${config.auth.testUserToken}`,
  },
});
```

### 4. Якщо потрібен custom user:
```typescript
// Використовуйте існуючі креди з config.users
const customAuth = Buffer.from(
  `${config.users.superAdmin.email}:${config.users.superAdmin.password}`
).toString('base64');
```

## 🌍 Переваги централізованих кредів

### ✅ Легко змінити environment:
```bash
# .env файл
API_BASE_URL=http://localhost:3000
SUPER_ADMIN_TOKEN=<local-token>
REGULAR_USER_TOKEN=<local-token>
```

### ✅ Легко перемкнутись на prod:
```bash
# .env файл
API_BASE_URL=https://api.evertrue.com
SUPER_ADMIN_TOKEN=<prod-token>
REGULAR_USER_TOKEN=<prod-token>
```

### ✅ Безпека:
- Креди в одному місці
- Легко оновити при зміні паролів
- Можна винести в environment variables
- Не розкидані по всіх тестах

### ✅ Підтримка:
- Легко знайти де використовуються креди
- Легко додати нові креди
- Легко оновити існуючі

## 🔄 Міграція інших файлів

Якщо знайдете інші файли з hardcoded кредами, використовуйте цей pattern:

### Знайти:
```typescript
const someAuth = Buffer.from('email:password').toString('base64');
```

### Замінити на:
```typescript
import { config } from '../../config/env.config';
// Використовуйте config.auth.superAdminToken або інший токен
```

## 📋 Checklist для нових тестів

При написанні нових тестів:

- [ ] ❌ НЕ використовуйте `Buffer.from('email:password').toString('base64')`
- [ ] ✅ Використовуйте `config.auth.superAdminToken` (або інший)
- [ ] ✅ Імпортуйте `config` з `../../config/env.config`
- [ ] ✅ Якщо потрібен новий користувач - додайте його в `config/env.config.ts`

## 🎊 Результат

Тепер всі креди централізовані і легко керуються через:
1. `config/env.config.ts` - default значення
2. `.env` файл - override для різних environments
3. Environment variables - для CI/CD

**Дата міграції:** 24 жовтня 2025  
**Оновлено файлів:** 8  
**Статус:** ✅ Основні файли виправлені
