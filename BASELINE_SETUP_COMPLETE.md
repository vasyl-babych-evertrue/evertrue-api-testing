# ✅ API Baseline Testing - Setup Complete

## 🎉 Що було створено

Система для автоматичного збереження та порівняння API responses готова до використання!

### Створені файли:

1. **Reporter** - `reporters/api-response-reporter.ts`
   - Автоматично збирає всі API requests/responses
   - Зберігає дані у JSON форматі

2. **Fixture** - `fixtures/api-tracking.fixture.ts`
   - Розширений fixture для детального логування
   - Опціональний - можна використовувати стандартний `request`

3. **Comparator** - `helpers/report-comparator.ts`
   - Порівнює два baseline репорти
   - Виявляє різниці та категоризує їх

4. **CLI Script** - `scripts/compare-baselines.ts`
   - Командний інтерфейс для порівняння

5. **Документація**:
   - `docs/QUICK_START_BASELINE.md` - швидкий старт
   - `docs/API_BASELINE_TESTING.md` - повна документація
   - `tests/examples/baseline-tracking-example.spec.ts` - приклади

### Оновлені файли:

- ✅ `playwright.config.ts` - доданий custom reporter
- ✅ `package.json` - додані скрипти та залежності
- ✅ `.gitignore` - додана папка з репортами
- ✅ `README.md` - додана секція про baseline testing

## 🚀 Як використовувати

### Базовий workflow:

```bash
# 1. Створити baseline ПЕРЕД деплоєм
npm run test
copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-before-deploy.json

# 2. Виконати deploy
# ... ваш процес деплою ...

# 3. Створити baseline ПІСЛЯ деплою
npm run test

# 4. Порівняти результати
npm run baseline:compare -- api-baseline-reports/baseline-before-deploy.json api-baseline-reports/baseline-latest.json
```

## 📁 Структура репортів

```
api-baseline-reports/
├── baseline-latest.json                    # Останній baseline
├── baseline-2024-10-24T13-30-00.json      # Timestamped baselines
├── baseline-before-deploy.json             # Ваші custom baselines
├── summary-2024-10-24T13-30-00.txt        # Текстові summaries
└── comparisons/
    ├── comparison-2024-10-24T14-00-00.json
    └── comparison-2024-10-24T14-00-00.txt
```

## 🎯 Що відбувається автоматично

### При запуску тестів (`npm run test`):

1. ✅ Всі API requests автоматично логуються
2. ✅ Всі responses зберігаються (status, headers, body)
3. ✅ Створюється файл `baseline-TIMESTAMP.json`
4. ✅ Створюється копія `baseline-latest.json`
5. ✅ Генерується summary у текстовому форматі

### Як увімкнути логування в тестах

Для логування API запитів потрібно змінити import в тестах:

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

**Це єдина зміна** яку потрібно зробити в існуючих тестах!

## 📊 Приклад output порівняння

```
╔════════════════════════════════════════════════════════════════╗
║           API BASELINE COMPARISON REPORT                       ║
╚════════════════════════════════════════════════════════════════╝

📅 Comparison Date: 2024-10-24T14:00:00.000Z

📊 SUMMARY:
   Total Differences: 3
   🔴 Critical: 1
   🟡 Warnings: 1
   🔵 Info: 1

🔴 CRITICAL DIFFERENCES:

1. STATUS_CODE
   Endpoint: GET /auth/users/123
   Details: Status code changed from 200 to 500
   Baseline: 200
   Current: 500

🟡 WARNINGS:

1. RESPONSE_BODY
   Endpoint: GET /auth/users/123/affiliations
   Details: Response missing fields: role_name
   Baseline: ["role_name"]
   Current: missing

🔵 INFORMATIONAL:

1. NEW_ENDPOINT
   Endpoint: POST /auth/new-feature
   Details: New endpoint detected (called 5 times)
```

## 🔧 Налаштування (опціонально)

### Використання trackedRequest fixture

Якщо потрібен більший контроль, можна використовувати `trackedRequest`:

```typescript
import { test, expect } from '../../fixtures/api-tracking.fixture';

test('my test', async ({ trackedRequest }) => {
  const response = await trackedRequest.get('/auth/users');
  expect(response.status()).toBe(200);
});
```

### Зміна директорії для репортів

У `playwright.config.ts`:

```typescript
['./reporters/api-response-reporter.ts', { 
  outputDir: 'custom-reports-folder' 
}],
```

## 📚 Доступні команди

```bash
# Створити baseline
npm run baseline:create
npm run test                    # те саме

# Порівняти два файли
npm run baseline:compare -- <baseline-file> <current-file>

# Показати допомогу
npm run baseline:compare -- --help

# Запустити конкретну групу тестів
npm run test:auth              # тільки auth тести
npm run test:events            # тільки events тести
```

## 🎓 Навчальні ресурси

1. **Quick Start** - `docs/QUICK_START_BASELINE.md`
   - Мінімальний набір команд для старту

2. **Full Documentation** - `docs/API_BASELINE_TESTING.md`
   - Детальна документація
   - Best practices
   - Troubleshooting
   - CI/CD інтеграція

3. **Example Tests** - `tests/examples/baseline-tracking-example.spec.ts`
   - Приклади використання
   - Коментарі та пояснення

## ✨ Що далі?

### Рекомендований workflow:

1. **Запустіть тести зараз** для створення першого baseline:
   ```bash
   npm run test
   ```

2. **Перегляньте створений baseline**:
   ```bash
   type api-baseline-reports\baseline-latest.json
   type api-baseline-reports\summary-latest.txt
   ```

3. **Спробуйте порівняння** (поки що з самим собою):
   ```bash
   npm run baseline:compare -- api-baseline-reports/baseline-latest.json api-baseline-reports/baseline-latest.json
   ```

4. **Перед наступним деплоєм**:
   - Створіть baseline
   - Збережіть його як `baseline-before-deploy.json`
   - Після деплою створіть новий baseline
   - Порівняйте їх

## 🐛 Troubleshooting

### Проблема: Reporter не збирає дані
**Рішення**: Перевірте що в `playwright.config.ts` є рядок:
```typescript
['./reporters/api-response-reporter.ts', { outputDir: 'api-baseline-reports' }],
```

### Проблема: Файли baseline не створюються
**Рішення**: 
1. Перевірте що тести запускаються успішно
2. Перевірте що папка `api-baseline-reports` існує
3. Перевірте права доступу до папки

### Проблема: Порівняння не знаходить різниць
**Рішення**: Переконайтесь що порівнюєте різні файли з різних запусків

## 💡 Tips & Tricks

1. **Зберігайте важливі baselines**:
   ```bash
   copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-v1.0.0.json
   ```

2. **Автоматичне очищення старих файлів** (старші 30 днів):
   ```bash
   forfiles /P api-baseline-reports /M baseline-*.json /D -30 /C "cmd /c del @path"
   ```

3. **Швидкий перегляд останнього summary**:
   ```bash
   type api-baseline-reports\summary-latest.txt
   ```

## 🎊 Готово!

Система повністю налаштована і готова до використання. Просто запускайте тести як завжди - все інше відбувається автоматично!

Для питань та детальної інформації дивіться документацію в папці `docs/`.
