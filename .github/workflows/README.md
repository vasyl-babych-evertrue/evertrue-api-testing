# 🚀 GitHub Actions Workflows для Playwright тестів

## 📋 Доступні Workflows

### 1. **Manual Test Runner** (`manual-tests.yml`)

Простий workflow для ручного запуску тестів з вибором папки.

**Можливості:**

- ✅ Вибір папки тестів (auth, Importer, events, searchAPI, або всі)
- ✅ Вибір формату звіту (list, html, json, junit)
- ✅ Налаштування кількості паралельних workers

### 2. **Advanced Manual Test Runner** (`advanced-manual-tests.yml`)

Розширений workflow з більшою кількістю опцій.

**Можливості:**

- ✅ Вказати конкретний шлях до тестів (папка або файл)
- ✅ Вибір оточення (stage/production)
- ✅ Вибір браузера (chromium, firefox, webkit, або всі)
- ✅ Headed режим (з UI)
- ✅ Debug режим
- ✅ Налаштування retries
- ✅ Grep фільтр для вибору конкретних тестів

---

## 🎯 Як запустити тести вручну

### Крок 1: Перейдіть на GitHub

1. Відкрийте ваш репозиторій на GitHub
2. Перейдіть на вкладку **Actions**

### Крок 2: Виберіть Workflow

Ви побачите список workflows:

- **Manual Test Runner** - простий варіант
- **Advanced Manual Test Runner** - розширений варіант

### Крок 3: Запустіть Workflow

1. Натисніть на потрібний workflow
2. Натисніть кнопку **"Run workflow"** (праворуч)
3. Заповніть параметри:
   - Виберіть branch (наприклад, `main` або `develop`)
   - Виберіть папку/шлях до тестів
   - Налаштуйте інші опції (за потреби)
4. Натисніть **"Run workflow"** (зелена кнопка)

### Крок 4: Перегляньте результати

1. Workflow почне виконуватися (з'явиться жовтий індикатор)
2. Натисніть на запущений workflow щоб побачити прогрес
3. Після завершення:
   - ✅ Зелений - всі тести пройшли
   - ❌ Червоний - є падіння тестів
4. Завантажте артефакти (HTML звіти, screenshots, videos)

---

## 📊 Приклади використання

### Приклад 1: Запустити всі auth тести

```
Workflow: Manual Test Runner
Test folder: tests/auth
Reporter: list
Workers: 4
```

### Приклад 2: Запустити конкретний файл з debug

```
Workflow: Advanced Manual Test Runner
Test path: tests/auth/auth-session.spec.ts
Environment: stage
Browser: chromium
Debug: true
```

### Приклад 3: Запустити тести з фільтром

```
Workflow: Advanced Manual Test Runner
Test path: tests/auth
Grep: "should return 200"
Browser: all
Retries: 2
```

### Приклад 4: Запустити всі Importer тести

```
Workflow: Manual Test Runner
Test folder: tests/Importer
Reporter: html
Workers: 6
```

---

## 🔐 Налаштування Secrets

Перед першим запуском додайте secrets в GitHub:

1. Перейдіть в **Settings** → **Secrets and variables** → **Actions**
2. Натисніть **"New repository secret"**
3. Додайте наступні secrets:

| Secret Name             | Опис                          | Приклад                        |
| ----------------------- | ----------------------------- | ------------------------------ |
| `SUPER_ADMIN_EMAIL`     | Email супер-адміна            | `vasyl.babych@evertrue.com`    |
| `SUPER_ADMIN_PASSWORD`  | Пароль супер-адміна           | `your-password`                |
| `REGULAR_USER_EMAIL`    | Email звичайного користувача  | `vasyl.babych+3@swanteams.com` |
| `REGULAR_USER_PASSWORD` | Пароль звичайного користувача | `your-password`                |

**⚠️ Важливо:** Ніколи не commitьте паролі в код! Використовуйте тільки GitHub Secrets.

---

## 📥 Як завантажити звіти

1. Після завершення workflow, прокрутіть вниз до секції **Artifacts**
2. Ви побачите:
   - `playwright-report-{run_number}` - HTML звіт з результатами
   - `test-results-{run_number}` - детальні результати, screenshots, videos
3. Натисніть на артефакт щоб завантажити ZIP архів
4. Розпакуйте і відкрийте `index.html` для перегляду звіту

---

## 🎨 Візуальний приклад

### Як виглядає кнопка "Run workflow":

```
Actions → Manual Test Runner → [Run workflow ▼]
```

### Форма запуску:

```
┌─────────────────────────────────────────┐
│ Use workflow from: [main ▼]            │
│                                         │
│ Test folder: [tests/auth ▼]           │
│ Reporter: [list ▼]                     │
│ Workers: [4]                           │
│                                         │
│          [Run workflow]                │
└─────────────────────────────────────────┘
```

---

## 🔧 Налаштування для вашого проєкту

### Додати нову папку в список:

Відредагуйте `manual-tests.yml`:

```yaml
options:
  - 'tests/auth'
  - 'tests/Importer'
  - 'tests/events'
  - 'tests/searchAPI'
  - 'tests/your-new-folder' # ← Додайте тут
```

### Змінити timeout:

```yaml
jobs:
  test:
    timeout-minutes: 60 # ← Змініть тут (в хвилинах)
```

### Додати нотифікації в Slack/Teams:

Додайте крок після тестів:

```yaml
- name: Send notification
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## ❓ FAQ

**Q: Чи можна запустити тести локально перед push?**  
A: Так! Використовуйте `npx playwright test tests/auth --reporter=list`

**Q: Скільки коштує запуск тестів на GitHub?**  
A: Для публічних репозиторіїв - безкоштовно. Для приватних - є ліміт безкоштовних хвилин.

**Q: Чи можна запланувати автоматичний запуск?**  
A: Так, додайте `schedule` trigger в workflow.

**Q: Як запустити тільки один конкретний тест?**  
A: Використовуйте Advanced workflow з grep фільтром, наприклад: `"should create session"`

---

## 📚 Корисні посилання

- [Playwright Documentation](https://playwright.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

---

**Створено:** 2025-01-27  
**Автор:** Vasyl Babych  
**Проєкт:** EverTrue API Testing
