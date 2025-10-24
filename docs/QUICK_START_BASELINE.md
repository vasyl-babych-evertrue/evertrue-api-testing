# Quick Start: API Baseline Testing

## Швидкий старт для порівняння API до/після деплою

### 1️⃣ Встановлення залежностей

```bash
npm install
```

### 2️⃣ Створення baseline ПЕРЕД деплоєм

```bash
# Запустити всі тести
npm run test

# АБО запустити конкретну групу
npm run test:auth

# Зберегти baseline перед деплоєм
copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-before-deploy.json
```

### 3️⃣ Виконати deploy

```bash
# Ваш процес деплою
# ...
```

### 4️⃣ Створення baseline ПІСЛЯ деплою

```bash
# Запустити ті ж тести
npm run test
```

### 5️⃣ Порівняти результати

```bash
# Порівняти до і після деплою
npm run baseline:compare -- api-baseline-reports/baseline-before-deploy.json api-baseline-reports/baseline-latest.json
```

### 6️⃣ Переглянути результати

Результати будуть показані в консолі та збережені в:
- `api-baseline-reports/comparisons/comparison-YYYY-MM-DDTHH-MM-SS.json` - детальний JSON
- `api-baseline-reports/comparisons/comparison-YYYY-MM-DDTHH-MM-SS.txt` - текстовий звіт

## Інтерпретація результатів

### ✅ Успіх
```
✅ All checks passed!
```
Немає критичних різниць - можна продовжувати.

### ⚠️ Попередження
```
⚠️ Warnings detected, but no critical issues.
```
Є некритичні зміни - перевірте чи вони очікувані.

### ❌ Критичні різниці
```
❌ Critical differences detected!

🔴 CRITICAL DIFFERENCES:
1. STATUS_CODE
   Endpoint: GET /auth/users/123
   Details: Status code changed from 200 to 500
```
Виявлено критичні проблеми - потрібна увага!

## Типи різниць

| Символ | Severity | Опис |
|--------|----------|------|
| 🔴 | Critical | Зміна status code на помилковий, 5xx errors |
| 🟡 | Warning | Відсутні поля в response, зміни в тестах |
| 🔵 | Info | Нові поля, нові endpoints |

## Корисні команди

```bash
# Показати всі збережені baselines
dir api-baseline-reports\baseline-*.json

# Показати останній summary
type api-baseline-reports\summary-latest.txt

# Порівняти два конкретні файли
npm run baseline:compare -- api-baseline-reports/baseline-2024-01-15.json api-baseline-reports/baseline-2024-01-16.json

# Допомога по команді порівняння
npm run baseline:compare -- --help
```

## 🔧 Налаштування (опціонально)

### Використання в тестах

Для автоматичного логування API запитів, використовуйте `global-api-tracking.fixture`:

```typescript
import { test, expect } from '../../fixtures/global-api-tracking.fixture';

test('my test', async ({ request }) => {
  // Всі запити автоматично логуються
  const response = await request.get('/auth/users');
  expect(response.status()).toBe(200);
});
```

**Важливо:** Просто змініть import - все інше залишається без змін!

## Автоматизація (опціонально)

Додайте в CI/CD pipeline:

```yaml
# Before deploy
- run: npm run test
- run: copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-before-deploy.json

# Deploy
- run: ./deploy.sh

# After deploy
- run: npm run test
- run: npm run baseline:compare -- api-baseline-reports/baseline-before-deploy.json api-baseline-reports/baseline-latest.json
```

## Troubleshooting

**Q: Не створюється baseline файл**
- Перевірте що тести запускаються успішно
- Перевірте що папка `api-baseline-reports` існує

**Q: Порівняння показує багато різниць**
- Переконайтесь що порівнюєте правильні файли
- Перевірте що тести виконувались в тому ж environment

**Q: Як зберегти baseline для конкретної версії?**
```bash
copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-v1.0.0.json
```

## Детальна документація

Для повної документації дивіться: [API_BASELINE_TESTING.md](./API_BASELINE_TESTING.md)
