# ESLint & Prettier Setup

## 📦 Встановлення

```bash
npm install
```

## 🚀 Використання

### Перевірка коду (lint)

```bash
# Перевірити всі файли
npm run lint

# Автоматично виправити помилки
npm run lint:fix
```

### Форматування коду (prettier)

```bash
# Відформатувати всі файли
npm run format

# Перевірити форматування без змін
npm run format:check
```

## 🎯 Автоматична перевірка перед комітом

Husky вже налаштовано! Після `npm install` він автоматично активується.

При кожному `git commit`:

- ✅ ESLint автоматично перевірить і виправить код
- ✅ Prettier відформатує файли
- ✅ Коміт буде заблоковано, якщо є помилки

**Примітка:** Використовується Husky v9 з новою конфігурацією (файл `.husky/pre-commit`)

## 📋 Правила ESLint

- TypeScript recommended rules
- Playwright recommended rules
- Prettier integration (без конфліктів)
- `@typescript-eslint/no-explicit-any`: warning
- `@typescript-eslint/no-unused-vars`: error (крім `_` префіксу)
- `console.log`: дозволено (для тестів)

## 🎨 Правила Prettier

- Single quotes: `'`
- Semicolons: `true`
- Print width: `120`
- Tab width: `2 spaces`
- Trailing commas: `es5`
- Arrow parens: `always`

## 🔧 VS Code Integration

Встанови розширення:

- ESLint
- Prettier - Code formatter

Додай в `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 📝 Команди

| Команда                | Опис                          |
| ---------------------- | ----------------------------- |
| `npm run lint`         | Перевірити код на помилки     |
| `npm run lint:fix`     | Виправити помилки автоматично |
| `npm run format`       | Відформатувати всі файли      |
| `npm run format:check` | Перевірити форматування       |

## 🚫 Ігноровані файли

- `node_modules/`
- `playwright-report/`
- `test-results/`
- `*.config.ts`
- `*.config.js`
- `package-lock.json`
