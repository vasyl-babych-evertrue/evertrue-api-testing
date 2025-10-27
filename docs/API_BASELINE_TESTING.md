# API Baseline Testing Guide

## Огляд

Система для автоматичного збереження та порівняння API responses між різними запусками тестів. Це дозволяє виявляти зміни в поведінці API після деплою.

## Архітектура

### Компоненти

1. **API Response Reporter** (`reporters/api-response-reporter.ts`)
   - Custom Playwright reporter
   - Автоматично збирає всі API requests/responses під час виконання тестів
   - Зберігає дані у JSON форматі з timestamp

2. **API Tracking Fixture** (`fixtures/api-tracking.fixture.ts`)
   - Розширений fixture для Playwright
   - Перехоплює всі API виклики (GET, POST, PUT, PATCH, DELETE)
   - Логує request/response дані як test attachments

3. **Report Comparator** (`helpers/report-comparator.ts`)
   - Утиліта для порівняння двох baseline репортів
   - Виявляє різниці в status codes, response bodies, endpoints
   - Генерує детальний звіт з категоризацією по severity

4. **CLI Script** (`scripts/compare-baselines.ts`)
   - Командний інтерфейс для порівняння репортів
   - Автоматичне створення comparison звітів

## Використання

### 1. Створення Baseline (до деплою)

```bash
# Запустити всі тести і створити baseline
npm run baseline:create

# Або запустити конкретну групу тестів
npm run test:auth
```

Це створить файли:
- `api-baseline-reports/baseline-YYYY-MM-DDTHH-MM-SS.json` - детальний звіт з timestamp
- `api-baseline-reports/baseline-latest.json` - копія останнього звіту
- `api-baseline-reports/summary-YYYY-MM-DDTHH-MM-SS.txt` - текстовий summary

### 2. Збереження Baseline перед деплоєм

```bash
# Зберегти поточний baseline під спеціальною назвою
copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-before-deploy.json
```

### 3. Створення нового Baseline (після деплою)

```bash
# Запустити тести після деплою
npm run baseline:create
```

### 4. Порівняння Baselines

```bash
# Порівняти два конкретні файли
npm run baseline:compare -- api-baseline-reports/baseline-before-deploy.json api-baseline-reports/baseline-latest.json

# Або використати скорочену команду
npm run baseline:compare-latest
```

Це створить:
- `api-baseline-reports/comparisons/comparison-YYYY-MM-DDTHH-MM-SS.json` - детальне порівняння
- `api-baseline-reports/comparisons/comparison-YYYY-MM-DDTHH-MM-SS.txt` - текстовий звіт

## Використання API Tracking в тестах

### Автоматичне логування (Рекомендовано)

Використовуйте `global-api-tracking.fixture` для автоматичного логування всіх API запитів:

```typescript
import { test, expect } from '../../fixtures/global-api-tracking.fixture';
import { config } from '../../config/env.config';

test('my test', async ({ request }) => {
  // Всі запити автоматично логуються
  const response = await request.get('/auth/users', {
    headers: {
      'Application-Key': config.headers.applicationKey,
    },
  });
  expect(response.status()).toBe(200);
});
```

### Оновлення існуючих тестів

Для використання tracking в існуючих тестах, просто змініть import:

```typescript
// Було:
import { test, expect } from '@playwright/test';

// Стало:
import { test, expect } from '../../fixtures/global-api-tracking.fixture';

// Все інше залишається без змін!
test('my test', async ({ request }) => {
  const response = await request.get('/auth/users');
  expect(response.status()).toBe(200);
});
```

**Важливо:** Використовуйте той самий `request` fixture - не потрібно змінювати назву на `trackedRequest`.

## Структура Baseline Report

```json
{
  "metadata": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "environment": "https://stage-api.evertrue.com",
    "baseUrl": "https://stage-api.evertrue.com",
    "totalTests": 150,
    "passedTests": 148,
    "failedTests": 2,
    "duration": 45000
  },
  "tests": [
    {
      "testId": "test-123",
      "testTitle": "should get user affiliations",
      "testFile": "tests/auth/auth-affiliations.spec.ts",
      "status": "passed",
      "duration": 1234,
      "apiCalls": [
        {
          "method": "GET",
          "url": "/auth/users/123/affiliations",
          "headers": { ... },
          "requestBody": null,
          "statusCode": 200,
          "responseHeaders": { ... },
          "responseBody": { ... },
          "duration": 234,
          "timestamp": "2024-01-15T10:30:01.000Z"
        }
      ]
    }
  ]
}
```

## Структура Comparison Report

```json
{
  "summary": {
    "totalDifferences": 5,
    "criticalDifferences": 1,
    "warningDifferences": 2,
    "infoDifferences": 2,
    "baselineTests": 150,
    "currentTests": 150,
    "baselineApiCalls": 450,
    "currentApiCalls": 455
  },
  "differences": [
    {
      "type": "status_code",
      "severity": "critical",
      "endpoint": "GET /auth/users/123",
      "details": "Status code changed from 200 to 500",
      "baseline": 200,
      "current": 500
    },
    {
      "type": "response_body",
      "severity": "warning",
      "endpoint": "GET /auth/users/123/affiliations",
      "details": "Response missing fields: role_name",
      "baseline": ["role_name"],
      "current": "missing"
    }
  ]
}
```

## Типи Різниць

### Critical (🔴)
- Зміна status code з успішного на помилковий
- Зміна status code на 5xx
- Відсутність раніше успішних endpoints

### Warning (🟡)
- Зміна status code з одного успішного на інший
- Відсутність полів у response
- Зміна тестів з passed на failed

### Info (🔵)
- Нові поля у response
- Нові endpoints
- Нові тести

## Best Practices

### 1. Регулярне створення Baselines

```bash
# Щоденний baseline (можна додати в CI/CD)
npm run baseline:create
```

### 2. Збереження важливих Baselines

```bash
# Перед major release
copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-v2.0.0.json

# Перед важливим деплоєм
copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-before-feature-x.json
```

### 3. Автоматизація в CI/CD

```yaml
# GitHub Actions example
- name: Create baseline before deploy
  run: |
    npm run baseline:create
    cp api-baseline-reports/baseline-latest.json api-baseline-reports/baseline-before-deploy.json

- name: Deploy application
  run: ./deploy.sh

- name: Create baseline after deploy
  run: npm run baseline:create

- name: Compare baselines
  run: npm run baseline:compare -- api-baseline-reports/baseline-before-deploy.json api-baseline-reports/baseline-latest.json
```

### 4. Організація файлів

```
api-baseline-reports/
├── baseline-latest.json                    # Останній baseline
├── baseline-before-deploy.json             # Перед деплоєм
├── baseline-v1.0.0.json                    # Version baselines
├── baseline-v2.0.0.json
├── baseline-2024-01-15T10-30-00.json      # Timestamped baselines
├── comparisons/
│   ├── comparison-2024-01-15T11-00-00.json
│   └── comparison-2024-01-15T11-00-00.txt
└── summary-2024-01-15T10-30-00.txt
```

## Troubleshooting

### Reporter не збирає дані

1. Перевірте що reporter доданий в `playwright.config.ts`
2. Перевірте що тести використовують Playwright `request` fixture
3. Перевірте логи під час виконання тестів

### Порівняння не знаходить різниць

1. Переконайтесь що порівнюєте різні файли
2. Перевірте що тести виконувались успішно
3. Перевірте структуру JSON файлів

### Занадто багато різниць

1. Використовуйте фільтрацію по severity
2. Перевірте що порівнюєте правильні environments
3. Можливо потрібно оновити baseline після легітимних змін

## Інтеграція з існуючими тестами

Система працює автоматично з існуючими тестами. Не потрібно змінювати код тестів - достатньо:

1. Запустити тести з новим reporter (вже налаштовано в `playwright.config.ts`)
2. Baseline автоматично створюється після кожного запуску
3. Використовувати CLI для порівняння

## Приклад повного workflow

```bash
# 1. Створити baseline перед деплоєм
npm run test
copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-before-deploy.json

# 2. Виконати deploy
# ... deploy process ...

# 3. Створити baseline після деплою
npm run test

# 4. Порівняти результати
npm run baseline:compare -- api-baseline-reports/baseline-before-deploy.json api-baseline-reports/baseline-latest.json

# 5. Переглянути результати
type api-baseline-reports\comparisons\comparison-latest.txt
```

## Додаткові команди

```bash
# Показати всі доступні baselines
dir api-baseline-reports\baseline-*.json

# Показати останнє порівняння
type api-baseline-reports\comparisons\comparison-latest.txt

# Видалити старі baselines (старші 30 днів)
forfiles /P api-baseline-reports /M baseline-*.json /D -30 /C "cmd /c del @path"
```
