# 🔄 API Baseline Testing - Повний Workflow

## 📋 Рекомендований процес тестування до/після деплою

### 🎯 Мета
Зберегти повні результати тестів (включаючи всі API requests/responses в Attachments) перед деплоєм, щоб потім порівняти з результатами після деплою.

---

## 📊 Workflow: До деплою

### 1. Запустити всі тести
```bash
npm run test
```

Це створить:
- ✅ `playwright-report/` - HTML репорт з детальними Attachments
- ✅ `api-baseline-reports/baseline-latest.json` - JSON з API calls

### 2. Зберегти HTML репорт
```bash
npm run report:save
```

Це скопіює `playwright-report/` → `playwright-report-before-deploy/`

### 3. Зберегти JSON baseline (опціонально)
```bash
npm run baseline:save
```

Це скопіює `baseline-latest.json` → `baseline-before-deploy.json`

### 4. Переглянути збережений репорт (опціонально)
```bash
npm run report:before
```

Відкриється HTML репорт ДО деплою в браузері.

---

## 🚀 Deploy

Виконайте ваш процес деплою...

---

## 📊 Workflow: Після деплою

### 1. Запустити тести знову
```bash
npm run test
```

Це створить нові:
- ✅ `playwright-report/` - новий HTML репорт
- ✅ `api-baseline-reports/baseline-latest.json` - новий JSON baseline

### 2. Відкрити обидва репорти для порівняння

**Репорт ДО деплою:**
```bash
npm run report:before
```

**Репорт ПІСЛЯ деплою:**
```bash
npm run report:after
```

Відкриються два вікна браузера - можна порівнювати side-by-side!

### 3. Автоматичне порівняння JSON baselines (опціонально)
```bash
npm run baseline:compare -- api-baseline-reports/baseline-before-deploy.json api-baseline-reports/baseline-latest.json
```

Це покаже:
- 🔴 Critical різниці (зміни status codes, нові помилки)
- 🟡 Warnings (відсутні поля в response)
- 🔵 Info (нові поля, нові endpoints)

---

## 🎯 Що дивитись в HTML репортах

### Playwright HTML Report містить:

#### 1. **Загальна статистика**
- Кількість passed/failed/skipped тестів
- Тривалість виконання
- Розподіл по файлах

#### 2. **Детальна інформація по кожному тесту**
При кліку на тест:
- ✅ Статус виконання
- ⏱️ Тривалість
- 📎 **Attachments** - тут найцінніша інформація!

#### 3. **Attachments (найважливіше!)**
Для кожного API запиту в тесті:
```
📎 api-call-data
   {
     "method": "POST",
     "url": "/auth/session",
     "headers": {...},
     "requestBody": {...},
     "statusCode": 201,
     "responseHeaders": {...},
     "responseBody": {...},
     "duration": 234,
     "timestamp": "2025-10-24T10:35:00.000Z"
   }
```

### Як порівнювати:

1. **Відкрийте обидва репорти** (before/after) в окремих вкладках
2. **Знайдіть той самий тест** в обох репортах
3. **Порівняйте Attachments**:
   - Чи змінився status code?
   - Чи з'явились нові поля в response?
   - Чи зникли якісь поля?
   - Чи змінилась структура даних?
   - Чи з'явились помилки?

---

## 📝 Приклад повного циклу

```bash
# === ПЕРЕД ДЕПЛОЄМ ===

# 1. Запустити тести
npm run test

# 2. Зберегти результати
npm run report:save
npm run baseline:save

# 3. Переглянути (опціонально)
npm run report:before


# === DEPLOY ===
# ... ваш процес деплою ...


# === ПІСЛЯ ДЕПЛОЮ ===

# 4. Запустити тести знову
npm run test

# 5. Відкрити обидва репорти для порівняння
npm run report:before   # Вікно 1: ДО деплою
npm run report:after    # Вікно 2: ПІСЛЯ деплою

# 6. Автоматичне порівняння (опціонально)
npm run baseline:compare -- api-baseline-reports/baseline-before-deploy.json api-baseline-reports/baseline-latest.json
```

---

## 🔍 Що шукати при порівнянні

### 🔴 Критичні проблеми:
- ❌ Тести які були passed стали failed
- ❌ Status code змінився (200 → 500, 201 → 400)
- ❌ З'явились нові 5xx помилки
- ❌ Endpoint перестав відповідати

### 🟡 Потенційні проблеми:
- ⚠️ Зникли поля з response
- ⚠️ Змінилась структура даних
- ⚠️ Збільшилась тривалість запитів
- ⚠️ Нові 4xx помилки

### 🔵 Інформаційні зміни:
- ℹ️ Додались нові поля в response
- ℹ️ Нові endpoints
- ℹ️ Покращення performance

---

## 💡 Tips & Tricks

### 1. Зберігайте важливі репорти з версіями
```bash
# Зберегти з версією
xcopy playwright-report playwright-report-v1.2.3 /E /I /H
copy api-baseline-reports\baseline-latest.json api-baseline-reports\baseline-v1.2.3.json
```

### 2. Очищення старих репортів
```bash
# Видалити старі збережені репорти (старші 30 днів)
forfiles /P playwright-report-before-deploy /D -30 /C "cmd /c del @path"
```

### 3. Швидкий доступ до останнього репорту
```bash
# Просто відкрити HTML файл без сервера
start playwright-report\index.html
```

### 4. Порівняння конкретних тестів
В HTML репорті використовуйте:
- 🔍 Пошук по назві тесту
- 🏷️ Фільтри по статусу (failed/passed)
- 📁 Фільтри по файлах

---

## 📚 Доступні команди

### Тестування:
```bash
npm run test              # Запустити всі тести
npm run test:auth         # Тільки auth тести
npm run test:ui           # UI mode
npm run test:debug        # Debug mode
```

### HTML репорти:
```bash
npm run report            # Відкрити останній репорт
npm run report:save       # Зберегти репорт як "before deploy"
npm run report:before     # Відкрити збережений репорт (до деплою)
npm run report:after      # Відкрити поточний репорт (після деплою)
```

### JSON baselines:
```bash
npm run baseline:save     # Зберегти JSON baseline
npm run baseline:compare  # Порівняти два JSON файли
```

---

## ✨ Висновок

**Рекомендований підхід:**
1. ✅ Використовуйте **HTML репорти з Attachments** для детального аналізу
2. ✅ Використовуйте **JSON baseline comparison** для швидкого огляду змін
3. ✅ Зберігайте репорти перед кожним важливим деплоєм
4. ✅ Порівнюйте side-by-side в браузері

**HTML репорт дає найбільше інформації** завдяки Attachments з повними request/response даних!
